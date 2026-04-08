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

// ─── Generación en background con push real-time ─────────────────────────────
// Railway es Node.js persistente. La Promise sigue corriendo aunque el cliente
// cierre la pestaña. Los chunks se pushean a todos los SSE clients activos.

type GenStatus = {
  status: 'running' | 'done' | 'error'
  error?: string
  version?: number
  plan?: string
  chunks: string[]  // acumulado para catch-up en reconexión
  prompt?: string   // prompt enviado (para visualización)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controllers: Set<ReadableStreamDefaultController<any>>
}

const genStore = new Map<string, GenStatus>()
const encoder = new TextEncoder()

function sseEncode(obj: unknown) {
  return encoder.encode(`data: ${JSON.stringify(obj)}\n\n`)
}

async function generarEnBackground(sitioId: string, datos: DatosWizard) {
  // ⚠️ genStore.set ANTES del primer await.
  // ReadableStream.start() en el GET handler corre sincrónicamente justo después
  // de que esta función cede en su primer await (los dynamic imports).
  // Si ponemos genStore.set DESPUÉS del await, start() siempre encuentra undefined.
  const entry: GenStatus = {
    status: 'running',
    plan: datos.plan ?? 'pro',
    chunks: [],
    prompt: '',          // se rellena después del import
    controllers: new Set(),
  }
  genStore.set(sitioId, entry)   // ← sincrono, antes de cualquier await

  const { generarSitioStreamConMetadata } = await import('@/lib/claude/generator')
  const { construirPromptUsuario } = await import('@/lib/claude/prompts')

  try {
    await db.update(sitios).set({ estado: 'generando' }).where(eq(sitios.id, sitioId))

    entry.prompt = construirPromptUsuario(datos)

    const resultado = await generarSitioStreamConMetadata(datos, (chunk) => {
      entry.chunks.push(chunk)
      for (const ctrl of [...entry.controllers]) {
        try {
          ctrl.enqueue(sseEncode({ chunk }))
        } catch {
          entry.controllers.delete(ctrl)
        }
      }
    })

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

    entry.status = 'done'
    entry.version = nuevaVersion
    // Enviar done y cerrar cada controller para forzar flush
    for (const ctrl of [...entry.controllers]) {
      try {
        ctrl.enqueue(sseEncode({ done: true, version: nuevaVersion }))
        // Cerrar el stream para que el mensaje se flushee al cliente
        setTimeout(() => { try { ctrl.close() } catch {} }, 200)
      } catch {}
    }
    entry.controllers.clear()
    setTimeout(() => genStore.delete(sitioId), 10 * 60 * 1000)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[generarEnBackground] Error:', msg, err)
    try { await db.update(sitios).set({ estado: 'error' }).where(eq(sitios.id, sitioId)) } catch {}
    entry.status = 'error'
    entry.error = msg
    for (const ctrl of [...entry.controllers]) {
      try { ctrl.enqueue(sseEncode({ error: msg })) } catch {}
    }
    entry.controllers.clear()
    setTimeout(() => genStore.delete(sitioId), 10 * 60 * 1000)
  }
}

// ─── GET: SSE con push real-time + catch-up en reconexión ────────────────────

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
    return new Response(
      encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`),
      { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' } }
    )
  }

  // Lanzar generación en fondo si no está ya corriendo
  const existing = genStore.get(sitioId)
  if (!existing || existing.status === 'error') {
    // SIN await — fire-and-forget
    generarEnBackground(sitioId, datos)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let _controller: ReadableStreamDefaultController<any> | null = null

  const stream = new ReadableStream({
    start(controller) {
      _controller = controller
      const plan = datos.plan ?? 'pro'
      controller.enqueue(sseEncode({ plan }))

      const s = genStore.get(sitioId)
      if (!s) {
        controller.enqueue(sseEncode({ error: 'Estado perdido' }))
        setTimeout(() => { try { controller.close() } catch {} }, 200)
        return
      }

      // Enviar prompt para visualización en el cliente
      if (s.prompt) {
        controller.enqueue(sseEncode({ prompt: s.prompt }))
      }

      // Catch-up: UN SOLO mensaje con todo el HTML acumulado hasta ahora.
      // Evita enviar miles de mensajes individuales que saturan React state updates.
      const catchupHTML = s.chunks.join('')
      if (catchupHTML.length > 0) {
        controller.enqueue(sseEncode({ catchup: catchupHTML }))
      }

      // Si ya terminó mientras nos conectábamos
      if (s.status === 'done') {
        controller.enqueue(sseEncode({ done: true, version: s.version }))
        setTimeout(() => { try { controller.close() } catch {} }, 500)
        return
      }
      if (s.status === 'error') {
        controller.enqueue(sseEncode({ error: s.error ?? 'Error generando sitio' }))
        setTimeout(() => { try { controller.close() } catch {} }, 500)
        return
      }

      // Registrar para recibir chunks en tiempo real
      s.controllers.add(controller)

      // Heartbeat cada 15s para mantener la conexión viva
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'))
        } catch {
          clearInterval(heartbeat)
          genStore.get(sitioId)?.controllers.delete(controller)
        }
      }, 15_000)
    },
    cancel() {
      if (_controller) {
        genStore.get(sitioId)?.controllers.delete(_controller)
      }
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
