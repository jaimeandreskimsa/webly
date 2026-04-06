import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db, sitios, pagos } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { crearPagoPlan } from '@/lib/flow'
import { PLAN_PRECIOS } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const userId = session.user.id as string

  try {
    const { sitioId, plan } = await req.json()

    if (!sitioId || !plan) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    // Verificar que el sitio le pertenece al usuario
    const [sitio] = await db
      .select()
      .from(sitios)
      .where(and(eq(sitios.id, sitioId), eq(sitios.userId, userId)))
      .limit(1)

    if (!sitio) {
      return NextResponse.json({ error: 'Sitio no encontrado' }, { status: 404 })
    }

    if (sitio.plan === plan) {
      return NextResponse.json({ error: 'El sitio ya tiene este plan' }, { status: 400 })
    }

    const { checkoutUrl, flowToken } = await crearPagoPlan({
      plan: plan as any,
      sitioId,
      userId,
      nombreEmpresa: sitio.nombre,
      email: session.user.email!,
      tipo: 'cambiar_plan',
    })

    // Registrar pago pendiente
    await db.insert(pagos).values({
      userId,
      flowToken,
      flowOrder: `${sitioId}|${userId}|${plan}|cambiar_plan`,
      plan: plan as any,
      monto: PLAN_PRECIOS[plan as keyof typeof PLAN_PRECIOS] || 0,
      estado: 'pendiente',
      metadata: { sitioId, userId, plan, tipo: 'cambiar_plan' },
    })

    return NextResponse.json({ checkoutUrl })
  } catch (error: any) {
    console.error('[cambiar-plan]', error)
    return NextResponse.json({ error: error.message || 'Error al procesar el pago' }, { status: 500 })
  }
}
