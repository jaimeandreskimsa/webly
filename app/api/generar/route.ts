import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db, sitios, versionesSitio } from '@/lib/db'
import { eq, max } from 'drizzle-orm'
import { generarSitio } from '@/lib/claude/generator'
import type { DatosWizard } from '@/components/wizard/WizardCreacion'

export const maxDuration = 300 // 5 minutos para generación larga

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { sitioId } = await req.json()

    // Obtener el sitio
    const [sitio] = await db
      .select()
      .from(sitios)
      .where(eq(sitios.id, sitioId))
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
      .where(eq(sitios.id, sitioId))

    const datos = sitio.contenidoJson as unknown as DatosWizard

    // Generar con Claude
    const resultado = await generarSitio(datos)

    // Obtener número de versión
    const [{ maxVersion }] = await db
      .select({ maxVersion: max(versionesSitio.numeroVersion) })
      .from(versionesSitio)
      .where(eq(versionesSitio.sitioId, sitioId))

    const nuevaVersion = (maxVersion ?? 0) + 1

    // Marcar versiones anteriores como no-actuales
    await db
      .update(versionesSitio)
      .set({ esActual: false })
      .where(eq(versionesSitio.sitioId, sitioId))

    // Guardar nueva versión
    await db.insert(versionesSitio).values({
      sitioId,
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
      .where(eq(sitios.id, sitioId))

    return NextResponse.json({
      ok: true,
      versionNumero: nuevaVersion,
      tokensUsados: resultado.tokensUsados,
    })
  } catch (error) {
    console.error('Error generando sitio:', error)

    // Marcar como error
    if (req.body) {
      try {
        const body = await req.json().catch(() => ({}))
        if (body.sitioId) {
          await db
            .update(sitios)
            .set({ estado: 'error' })
            .where(eq(sitios.id, body.sitioId))
        }
      } catch {}
    }

    return NextResponse.json(
      { error: 'Error al generar el sitio. Intenta de nuevo.' },
      { status: 500 }
    )
  }
}

// ─── Streaming endpoint ───────────────────────────────────────────────────────

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

  const { generarSitioStream } = await import('@/lib/claude/generator')

  const encoder = new TextEncoder()
  let htmlAcumulado = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await db
          .update(sitios)
          .set({ estado: 'generando' })
          .where(eq(sitios.id, sitioId))

        for await (const chunk of generarSitioStream(datos)) {
          htmlAcumulado += chunk
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`))
        }

        // Guardar resultado final
        const [{ maxVersion }] = await db
          .select({ maxVersion: max(versionesSitio.numeroVersion) })
          .from(versionesSitio)
          .where(eq(versionesSitio.sitioId, sitioId))

        const nuevaVersion = (maxVersion ?? 0) + 1

        await db
          .update(versionesSitio)
          .set({ esActual: false })
          .where(eq(versionesSitio.sitioId, sitioId))

        await db.insert(versionesSitio).values({
          sitioId,
          numeroVersion: nuevaVersion,
          htmlCompleto: htmlAcumulado,
          esActual: true,
          modeloUsado: 'claude-sonnet-4-6',
        })

        await db
          .update(sitios)
          .set({
            estado: 'borrador',
            totalEdiciones: nuevaVersion,
            ultimaEdicion: new Date(),
          })
          .where(eq(sitios.id, sitioId))

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true, version: nuevaVersion })}\n\n`)
        )
        controller.close()
      } catch (err) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: 'Error generando sitio' })}\n\n`)
        )
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
