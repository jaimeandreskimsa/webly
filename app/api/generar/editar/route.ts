import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db, sitios, versionesSitio } from '@/lib/db'
import { eq, and, max } from 'drizzle-orm'
import { editarSitio } from '@/lib/claude/editor'
import { PLAN_LIMITE_EDICIONES } from '@/lib/utils'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { sitioId, instrucciones } = await req.json()

    if (!sitioId || !instrucciones?.trim()) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }

    // Obtener sitio
    const [sitio] = await db
      .select()
      .from(sitios)
      .where(and(eq(sitios.id, sitioId), eq(sitios.userId, session.user.id as string)))
      .limit(1)

    if (!sitio) {
      return NextResponse.json({ error: 'Sitio no encontrado' }, { status: 404 })
    }

    // Verificar límite de ediciones
    const limite = PLAN_LIMITE_EDICIONES[sitio.plan as keyof typeof PLAN_LIMITE_EDICIONES]
    const edicionesUsadas = Math.max(0, (sitio.totalEdiciones ?? 1) - 1)
    if (edicionesUsadas >= limite) {
      return NextResponse.json({ error: 'Límite de ediciones alcanzado' }, { status: 403 })
    }

    // Obtener versión actual (HTML existente)
    const [versionActual] = await db
      .select()
      .from(versionesSitio)
      .where(and(eq(versionesSitio.sitioId, sitioId), eq(versionesSitio.esActual, true)))
      .limit(1)

    if (!versionActual) {
      return NextResponse.json({ error: 'No hay versión generada para editar' }, { status: 400 })
    }

    // Marcar como generando
    await db.update(sitios).set({ estado: 'generando' }).where(eq(sitios.id, sitioId))

    // Editar con Claude
    const resultado = await editarSitio(
      versionActual.htmlCompleto,
      instrucciones.trim(),
      sitio.plan as 'basico' | 'pro' | 'premium' | 'broker'
    )

    // Obtener número de versión
    const [{ maxVersion }] = await db
      .select({ maxVersion: max(versionesSitio.numeroVersion) })
      .from(versionesSitio)
      .where(eq(versionesSitio.sitioId, sitioId))

    const nuevaVersion = (maxVersion ?? 0) + 1

    // Marcar versiones anteriores como no actuales
    await db
      .update(versionesSitio)
      .set({ esActual: false })
      .where(eq(versionesSitio.sitioId, sitioId))

    // Insertar nueva versión
    await db.insert(versionesSitio).values({
      sitioId,
      numeroVersion: nuevaVersion,
      htmlCompleto: resultado.html,
      esActual: true,
      modeloUsado: resultado.modeloUsado,
      tokensUsados: resultado.tokensUsados,
    })

    // Actualizar sitio
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
      version: nuevaVersion,
      tokens: resultado.tokensUsados,
    })
  } catch (err: any) {
    console.error('[editar] Error:', err)

    // Revertir estado si falla
    try {
      const { sitioId } = await req.json().catch(() => ({}))
      if (sitioId) {
        await db.update(sitios).set({ estado: 'borrador' }).where(eq(sitios.id, sitioId))
      }
    } catch {}

    return NextResponse.json(
      { error: err.message || 'Error al aplicar cambios' },
      { status: 500 }
    )
  }
}
