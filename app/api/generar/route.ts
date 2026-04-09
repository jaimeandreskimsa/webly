import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db, sitios, versionesSitio } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import type { DatosWizard } from '@/components/wizard/WizardCreacion'
import { genStore, encoder, sseEncode, generarEnBackground } from '@/lib/generar'

export const maxDuration = 300

// ─── POST: dispara generación fire-and-forget, retorna inmediatamente ─────────
// No espera a que Claude termine — el cliente debe navegar a /generando
// para seguir el progreso vía SSE (GET handler).

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const sitioId: string = body.sitioId

    const [sitio] = await db
      .select()
      .from(sitios)
      .where(eq(sitios.id, sitioId))
      .limit(1)

    if (!sitio) {
      return NextResponse.json({ error: 'Sitio no encontrado' }, { status: 404 })
    }

    const esAdmin = (session.user as any).rol === 'admin'
    if (!esAdmin && sitio.userId !== session.user.id) {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    }

    const datos = sitio.contenidoJson as unknown as DatosWizard
    if (!datos?.plan) {
      return NextResponse.json({ error: 'El sitio no tiene datos de configuración' }, { status: 400 })
    }

    // Evitar doble generación si ya está corriendo
    const existing = genStore.get(sitioId)
    if (existing?.status === 'running') {
      return NextResponse.json({ ok: true, ya_generando: true })
    }

    // Fire-and-forget — no await, retorna de inmediato
    // El cliente navega a /generando y sigue el progreso via SSE
    generarEnBackground(sitioId, datos)

    return NextResponse.json({ ok: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    console.error('[POST /api/generar]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
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

  const esAdmin = (session.user as any).rol === 'admin'
  if (!sitio || (!esAdmin && sitio.userId !== session.user.id)) {
    return new Response('No autorizado', { status: 403 })
  }

  const datos = sitio.contenidoJson as unknown as DatosWizard

  // Guardia: si el contenidoJson está vacío (sitio demo/incompleto) no podemos generar
  if (!datos || !datos.plan) {
    return new Response(
      encoder.encode(`data: ${JSON.stringify({ error: 'El sitio no tiene datos de configuraci\u00f3n. Rec\u00e9alo desde el wizard.' })}\n\n`),
      { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' } }
    )
  }

  // Si ya terminó en DB → done inmediato (evita regenerar en reconexión de EventSource)
  // IMPORTANTE: verificar que realmente existe una versión con esActual=true.
  // Si estado='borrador' pero sin versión (sitio creado sin generar) hay que generar.
  if (sitio.estado === 'borrador' || sitio.estado === 'publicado') {
    const [versionExistente] = await db
      .select({ id: versionesSitio.id })
      .from(versionesSitio)
      .where(and(eq(versionesSitio.sitioId, sitioId), eq(versionesSitio.esActual, true)))
      .limit(1)

    if (versionExistente) {
      // Versión real existe — done inmediato sin regenerar
      return new Response(
        encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`),
        { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' } }
      )
    }
    // Sin versión real: borrador fantón → resetear estado y dejar que se genere abajo
    await db.update(sitios).set({ estado: 'generando', updatedAt: new Date() }).where(eq(sitios.id, sitioId))
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
