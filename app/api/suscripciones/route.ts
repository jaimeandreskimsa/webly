import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db, suscripciones, edicionesMensuales, sitios } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { PLAN_LIMITE_EDICIONES } from '@/lib/utils'

// Activar suscripción mensual de ediciones
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { plan, sitioId } = await req.json()
  const userId = session.user.id as string
  const limiteEdiciones = PLAN_LIMITE_EDICIONES[plan as keyof typeof PLAN_LIMITE_EDICIONES]

  // Si hay sitioId, buscar/actualizar suscripción por sitio
  // Si no, mantener comportamiento legacy por usuario
  const whereClause = sitioId
    ? and(eq(suscripciones.userId, userId), eq(suscripciones.sitioId, sitioId))
    : eq(suscripciones.userId, userId)

  const [existente] = await db
    .select()
    .from(suscripciones)
    .where(whereClause)
    .limit(1)

  const fechaRenovacion = new Date()
  fechaRenovacion.setMonth(fechaRenovacion.getMonth() + 1)

  if (existente) {
    await db
      .update(suscripciones)
      .set({
        plan: plan as any,
        activa: true,
        limiteEdiciones,
        fechaRenovacion,
        updatedAt: new Date(),
      })
      .where(whereClause)
  } else {
    await db.insert(suscripciones).values({
      userId,
      sitioId: sitioId || null,
      plan: plan as any,
      activa: true,
      edicionesUsadasEsteMes: 0,
      limiteEdiciones,
      fechaRenovacion,
    })
  }

  return NextResponse.json({ ok: true })
}

// Registrar una edición usada
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { sitioId } = await req.json()
  const userId = session.user.id as string
  const ahora = new Date()
  const mes = ahora.getMonth() + 1
  const año = ahora.getFullYear()

  // Verificar que el sitio pertenece al usuario
  const [sitio] = await db
    .select()
    .from(sitios)
    .where(and(eq(sitios.id, sitioId), eq(sitios.userId, userId)))
    .limit(1)

  if (!sitio) {
    return NextResponse.json({ error: 'Sitio no encontrado' }, { status: 404 })
  }

  // Verificar limite
  const [suscripcion] = await db
    .select()
    .from(suscripciones)
    .where(eq(suscripciones.userId, userId))
    .limit(1)

  if (suscripcion) {
    const limite = suscripcion.limiteEdiciones ?? 0
    if (limite !== -1 && (suscripcion.edicionesUsadasEsteMes ?? 0) >= limite) {
      return NextResponse.json(
        { error: 'Límite de ediciones mensuales alcanzado' },
        { status: 403 }
      )
    }
  }

  // Actualizar o crear registro de ediciones del mes
  const [edicionMes] = await db
    .select()
    .from(edicionesMensuales)
    .where(
      and(
        eq(edicionesMensuales.userId, userId),
        eq(edicionesMensuales.sitioId, sitioId),
        eq(edicionesMensuales.mes, mes),
        eq(edicionesMensuales.año, año)
      )
    )
    .limit(1)

  if (edicionMes) {
    await db
      .update(edicionesMensuales)
      .set({
        edicionesUsadas: (edicionMes.edicionesUsadas ?? 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(edicionesMensuales.id, edicionMes.id))
  } else {
    await db.insert(edicionesMensuales).values({
      userId,
      sitioId,
      mes,
      año,
      edicionesUsadas: 1,
    })
  }

  // Actualizar contador en suscripción
  if (suscripcion) {
    await db
      .update(suscripciones)
      .set({
        edicionesUsadasEsteMes: (suscripcion.edicionesUsadasEsteMes ?? 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(suscripciones.userId, userId))
  }

  return NextResponse.json({ ok: true })
}

// Cancelar suscripción de edición
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const userId = session.user.id as string
  const { sitioId } = await req.json()

  const whereClause = sitioId
    ? and(eq(suscripciones.userId, userId), eq(suscripciones.sitioId, sitioId))
    : eq(suscripciones.userId, userId)

  await db
    .update(suscripciones)
    .set({ activa: false, updatedAt: new Date() })
    .where(whereClause)

  return NextResponse.json({ ok: true })
}
