import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db, pagos, sitios } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { crearPagoFlow, getFlowCredentials, getFlowBaseUrl } from '@/lib/flow'
import { PLAN_PRECIOS, PLAN_NOMBRES } from '@/lib/utils'

// Retoma el pago de un sitio que quedó en estado pendiente_pago
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const userId = session.user.id as string

  try {
    const { sitioId } = await req.json()
    if (!sitioId) {
      return NextResponse.json({ error: 'sitioId requerido' }, { status: 400 })
    }

    // Verificar que el sitio pertenece al usuario y está pendiente
    const [sitio] = await db
      .select()
      .from(sitios)
      .where(and(eq(sitios.id, sitioId), eq(sitios.userId, userId)))
      .limit(1)

    if (!sitio) {
      return NextResponse.json({ error: 'Sitio no encontrado' }, { status: 404 })
    }

    if (sitio.estado !== 'pendiente_pago') {
      return NextResponse.json({ error: 'El sitio no está pendiente de pago' }, { status: 400 })
    }

    // Obtener credenciales Flow
    const [credentials, flowBaseUrl] = await Promise.all([
      getFlowCredentials(),
      getFlowBaseUrl(),
    ])

    if (!credentials.apiKey || !credentials.secretKey) {
      throw new Error('Flow no configurado. Agrega FLOW_API_KEY y FLOW_SECRET_KEY.')
    }

    const plan = sitio.plan as string
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const monto = PLAN_PRECIOS[plan as keyof typeof PLAN_PRECIOS]
    const planNombre = PLAN_NOMBRES[plan as keyof typeof PLAN_NOMBRES]
    const shortSitio = sitio.id.replace(/-/g, '').slice(0, 10)
    const shortUser  = userId.replace(/-/g, '').slice(0, 8)
    const commerceOrder = `${shortSitio}${shortUser}${plan}re`.slice(0, 45)
    const urlReturn = `${appUrl}/dashboard/sitios/${sitio.id}/configurar`
    const MERCHANT_EMAIL = process.env.FLOW_MERCHANT_EMAIL || 'hola@weblynow.com'

    const flowParams = {
      apiKey: credentials.apiKey,
      secretKey: credentials.secretKey,
      commerceOrder,
      subject: `WeblyNow — Plan ${planNombre}`,
      amount: monto,
      email: session.user.email!,
      urlConfirmation: `${appUrl}/api/pagos/webhook`,
      urlReturn,
    }

    let result
    try {
      result = await crearPagoFlow(flowParams)
    } catch (err: any) {
      if (err.message?.includes('1620')) {
        result = await crearPagoFlow({ ...flowParams, email: MERCHANT_EMAIL })
      } else {
        throw err
      }
    }

    const checkoutUrl = `${result.url}?token=${result.token}`

    // Registrar nuevo intento de pago (fire-and-forget)
    db.insert(pagos).values({
      userId,
      flowToken: result.token,
      flowOrder: `${sitio.id}|${userId}|${plan}|re`,
      plan: plan as any,
      monto,
      estado: 'pendiente',
      metadata: { sitioId: sitio.id, userId, plan, tipo: 're' },
    }).catch(err => console.error('[pagos/reanudar] pagos insert error:', err))

    return NextResponse.json({ checkoutUrl })
  } catch (error: any) {
    console.error('[pagos/reanudar] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al reanudar el pago' },
      { status: 500 }
    )
  }
}
