import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db, pagos, sitios } from '@/lib/db'
import { crearPagoFlow, getFlowCredentials, getFlowBaseUrl } from '@/lib/flow'
import { PLAN_PRECIOS, PLAN_NOMBRES } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const userId = session.user.id as string

  try {
    const { plan } = await req.json()

    if (!plan || !['basico', 'pro', 'premium', 'broker'].includes(plan)) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }

    const slug = `sitio-${plan}-${Date.now().toString(36)}`

    // ── Paso 1: DB insert + credenciales Flow EN PARALELO ─────────────────────
    const [[nuevoSitio], credentials, flowBaseUrl] = await Promise.all([
      db.insert(sitios).values({
        userId,
        nombre: `Mi sitio ${plan}`,
        slug,
        plan: plan as any,
        estado: 'pendiente_pago',
        contenidoJson: null,
      }).returning(),
      getFlowCredentials(),
      getFlowBaseUrl(),
    ])

    if (!credentials.apiKey || !credentials.secretKey) {
      throw new Error('Flow no configurado. Agrega FLOW_API_KEY y FLOW_SECRET_KEY en el panel de admin.')
    }

    // ── Paso 2: Llamar a Flow ─────────────────────────────────────────────────
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const monto = PLAN_PRECIOS[plan as keyof typeof PLAN_PRECIOS]
    const planNombre = PLAN_NOMBRES[plan as keyof typeof PLAN_NOMBRES]
    const shortSitio = nuevoSitio.id.replace(/-/g, '').slice(0, 10)
    const shortUser  = userId.replace(/-/g, '').slice(0, 8)
    const commerceOrder = `${shortSitio}${shortUser}${plan}en`.slice(0, 45)
    const urlReturn = `${appUrl}/dashboard/sitios/${nuevoSitio.id}/configurar`
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
      // baseUrl ya está en caché gracias al Promise.all de arriba
    }

    let result
    try {
      result = await crearPagoFlow(flowParams)
    } catch (err: any) {
      // Error 1620 = email inválido para Flow → reintento con email del comercio
      if (err.message?.includes('1620')) {
        result = await crearPagoFlow({ ...flowParams, email: MERCHANT_EMAIL })
      } else {
        throw err
      }
    }

    const checkoutUrl = `${result.url}?token=${result.token}`

    // ── Paso 3: Registrar pago — fire-and-forget (no bloquea la respuesta) ───
    db.insert(pagos).values({
      userId,
      flowToken: result.token,
      flowOrder: `${nuevoSitio.id}|${userId}|${plan}|en`,
      plan: plan as any,
      monto,
      estado: 'pendiente',
      metadata: { sitioId: nuevoSitio.id, userId, plan, tipo: 'en' },
    }).catch(err => console.error('[pagos/crear-express] pagos insert error:', err))

    return NextResponse.json({ checkoutUrl, sitioId: nuevoSitio.id })
  } catch (error: any) {
    console.error('[pagos/crear-express] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al iniciar el pago' },
      { status: 500 }
    )
  }
}
