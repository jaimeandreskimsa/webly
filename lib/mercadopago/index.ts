import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'
import { PLAN_PRECIOS, PLAN_NOMBRES } from '@/lib/utils'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export interface CrearPreferenciaParams {
  plan: 'basico' | 'pro' | 'premium' | 'broker'
  sitioId: string
  userId: string
  nombreEmpresa: string
  email: string
  tipo?: 'nuevo_sitio' | 'cambiar_plan'
}

export async function crearPreferencia(params: CrearPreferenciaParams) {
  const preference = new Preference(client)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const monto = PLAN_PRECIOS[params.plan]
  const planNombre = PLAN_NOMBRES[params.plan]

  const result = await preference.create({
    body: {
      items: [
        {
          id: `webtory-${params.plan}-${params.sitioId}`,
          title: `Webtory — Plan ${planNombre}`,
          description: `Sitio web con IA para ${params.nombreEmpresa}`,
          quantity: 1,
          currency_id: 'CLP',
          unit_price: monto,
        },
      ],
      payer: {
        email: params.email,
      },
      back_urls: {
        success: params.tipo === 'cambiar_plan'
          ? `${appUrl}/dashboard/sitios/${params.sitioId}?plan_cambiado=1`
          : `${appUrl}/dashboard/sitios/${params.sitioId}/generando`,
        failure: `${appUrl}/dashboard/facturacion?error=pago_fallido`,
        pending: `${appUrl}/dashboard/sitios/${params.sitioId}?pago=pendiente`,
      },
      auto_return: 'approved',
      external_reference: JSON.stringify({
        sitioId: params.sitioId,
        userId: params.userId,
        plan: params.plan,
        tipo: params.tipo || 'nuevo_sitio',
      }),
      notification_url: `${appUrl}/api/pagos/webhook`,
      statement_descriptor: 'WEBTORY',
    },
  })

  return {
    preferenceId: result.id,
    checkoutUrl: result.init_point,
  }
}

export async function verificarPago(paymentId: string) {
  const payment = new Payment(client)
  const result = await payment.get({ id: Number(paymentId) })
  return result
}
