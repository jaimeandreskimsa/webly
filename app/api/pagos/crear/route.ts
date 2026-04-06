import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db, pagos } from '@/lib/db'
import { crearPagoPlan } from '@/lib/flow'
import { PLAN_PRECIOS } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const userId = session.user.id as string

  try {
    const { plan, sitioId, nombreEmpresa } = await req.json()

    if (!plan || !sitioId) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    const { checkoutUrl, flowToken } = await crearPagoPlan({
      plan,
      sitioId,
      userId,
      nombreEmpresa,
      email: session.user.email!,
      tipo: 'nuevo_sitio',
    })

    // Registrar pago pendiente en DB para rastreo
    await db.insert(pagos).values({
      userId,
      flowToken,
      flowOrder: `${sitioId}|${userId}|${plan}|nuevo_sitio`,
      plan: plan as any,
      monto: PLAN_PRECIOS[plan as keyof typeof PLAN_PRECIOS] || 0,
      estado: 'pendiente',
      metadata: { sitioId, userId, plan, tipo: 'nuevo_sitio' },
    })

    return NextResponse.json({ checkoutUrl })
  } catch (error: any) {
    console.error('Error creando pago Flow:', error)
    return NextResponse.json(
      { error: error.message || 'Error al iniciar el pago' },
      { status: 500 }
    )
  }
}
