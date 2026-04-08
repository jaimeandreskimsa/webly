import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db, sitios, versionesSitio } from '@/lib/db'
import { eq, max } from 'drizzle-orm'
import { generarSitio } from '@/lib/claude/generator'
import type { DatosWizard } from '@/components/wizard/WizardCreacion'

export const maxDuration = 300 // 5 minutos para generación larga — aplica a POST y GET

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  let sitioId: string | null = null

  try {
    const body = await req.json()
    sitioId = body.sitioId

    // Obtener el sitio
    const [sitio] = await db
      .select()
      .from(sitios)
      .where(eq(sitios.id, sitioId!))
      .limit(1)

    if (!sitio) {
      return NextResponse.json({ error: 'Sitio no encontrado' }, { status: 404 })
    }

    if (sitio.userId !== session.user.id) {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    }

    // Marcar como generando
    await db
      .update(sitios)
      .set({ estado: 'generando' })
      .where(eq(sitios.id, sitioId!))

    const datos = sitio.contenidoJson as unknown as DatosWizard

    // Generar con Claude
    const resultado = await generarSitio(datos)

    // Obtener número de versión
    const [{ maxVersion }] = await db
      .select({ maxVersion: max(versionesSitio.numeroVersion) })
      .from(versionesSitio)
      .where(eq(versionesSitio.sitioId, sitioId!))

    const nuevaVersion = (maxVersion ?? 0) + 1

    // Marcar versiones anteriores como no-actuales
    await db
      .update(versionesSitio)
      .set({ esActual: false })
      .where(eq(versionesSitio.sitioId, sitioId!))

    // Guardar nueva versión
    await db.insert(versionesSitio).values({
      sitioId: sitioId!,
      numeroVersion: nuevaVersion,
      htmlCompleto: resultado.html,
      esActual: true,
      modeloUsado: resultado.modeloUsado,
      tokensUsados: resultado.tokensUsados,
    })

    // Actualizar estado del sitio
    await db
      .update(sitios)
      .set({
        estado: 'borrador',
        totalEdiciones: nuevaVersion,
        ultimaEdicion: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(sitios.id, sitioId!))

    return NextResponse.json({
      ok: true,
      versionNumero: nuevaVersion,
      tokensUsados: resultado.tokensUsados,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error generando sitio:', msg, error)

    // Marcar el sitio como error (sitioId ya está en scope)
    if (sitioId) {
      try {
        await db
          .update(sitios)
          .set({ estado: 'error' })
          .where(eq(sitios.id, sitioId))
      } catch {}
    }

    return NextResponse.json(
      { error: msg },
      { status: 500 }
    )
  }
}

// ─── Generación en background desacoplada del SSE ────────────────────────────
// Railway es Node.js persistente: los Promises continúan aunque el cliente
// cierre la conexión HTTP. Esto es fire-and-forget real.

type GenStatus = {
  status: 'running' | 'done' | 'error'
  error?: string
  version?: number
  plan?: string
}

// Map en memoria del proceso: persiste entre requests en Railway
const genStore = new Map<string, GenStatus>()

async function generarEnBackground(sitioId: string, datos: DatosWizard) {
  try {
    await db.update(sitios).set({ estado: 'generando' }).where(eq(sitios.id, sitioId))
    genStore.set(sitioId, { status: 'running', plan: datos.plan ?? 'pro' })

    const resultado = await generarSitio(datos)

    const [{ maxVersion }] = await db
      .select({ maxVersion: max(versionesSitio.numeroVersion) })
      .from(versionesSitio)
      .where(eq(versionesSitio.sitioId, sitioId))

    const nuevaVersion = (maxVersion ?? 0) + 1

    await db.update(versionesSitio).set({ esActual: false }).where(eq(versionesSitio.sitioId, sitioId))
    await db.insert(versionesSitio).values({
      sitioId,
      numeroVersion: nuevaVersion,
      htmlCompleto: resultado.html,
      esActual: true,
      modeloUsado: resultado.modeloUsado,
      tokensUsados: resultado.tokensUsados,
    })
    await db.update(sitios).set({
      estado: 'borrador',
      totalEdiciones: nuevaVersion,
      ultimaEdicion: new Date(),
      updatedAt: new Date(),
    }).where(eq(sitios.id, sitioId))

    genStore.set(sitioId, { status: 'done', version: nuevaVersion, plan: datos.plan ?? 'pro' })
    setTimeout(() => genStore.delete(sitioId), 10 * 60 * 1000)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[generarEnBackground] Error:', msg, err)
    try { await db.update(sitios).set({ estado: 'error' }).where(eq(sitios.id, sitioId)) } catch {}
    genStore.set(sitioId, { status: 'error', error: msg })
    setTimeout(() => genStore.delete(sitioId), 10 * 60 * 1000)
  }
}

// ─── GET: SSE que observa el genStore ────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return new Response('No autorizado', { status: 401 })
  }

  const sitioId = req.nextUrl.searchParams.get('sitioId')
  if (!sitioId) {
    return new Response('sitioId requerido', { status: 400 })
  }

  const [sitio] = await db
    .select()
    .from(sitios)
    .where(eq(sitios.id, sitioId))
    .limit(1)

  if (!sitio || sitio.userId !== session.user.id) {
    return new Response('No autorizado', { status: 403 })
  }

  const datos = sitio.contenidoJson as unknown as DatosWizard

  // Si ya terminó en DB → done inmediato (evita regenerar en reconexión de EventSource)
  if (sitio.estado === 'borrador' || sitio.estado === 'publicado') {
    const enc = new TextEncoder()
    return new Response(
      enc.encode(`data: ${JSON.stringify({ done: true })}\n\n`),
      { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' } }
    )
  }

  // Lanzar generación en fondo si no está ya corriendo
  const existing = genStore.get(sitioId)
  if (!existing || existing.status === 'error') {
    // SIN await — fire-and-forget: sigue corriendo aunque el cliente cierre la pestaña
    generarEnBackground(sitioId, datos)
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      const plan = datos.plan ?? 'pro'
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ plan })}\n\n`))

      let active = true

      // Polling al genStore cada 2s + heartbeat para mantener la conexión viva
      const poll = setInterval(() => {
        if (!active) return
        const s = genStore.get(sitioId)
        try {
          if (s?.status === 'done') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, version: s.version })}\n\n`))
            clearInterval(poll)
            active = false
            setTimeout(() => { try { controller.close() } catch {} }, 500)
          } else if (s?.status === 'error') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: s.error ?? 'Error generando sitio' })}\n\n`))
            clearInterval(poll)
            active = false
            setTimeout(() => { try { controller.close() } catch {} }, 500)
          } else {
            // Heartbeat — mantiene la conexión viva mientras Claude procesa
            controller.enqueue(encoder.encode(': ping\n\n'))
          }
        } catch {
          // Cliente se desconectó — el background task sigue corriendo igual
          clearInterval(poll)
          active = false
        }
      }, 2000)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
