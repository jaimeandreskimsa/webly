import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db, pagos, sitios, usuarios } from '@/lib/db'
import { eq, and, desc } from 'drizzle-orm'
import { crearPagoFlow, getFlowCredentials, getFlowBaseUrl, obtenerEstadoPago } from '@/lib/flow'
import { PLAN_PRECIOS, PLAN_NOMBRES } from '@/lib/utils'
import { getPrecioPlan } from '@/lib/planes'

// Retoma el pago de un sitio que quedó en estado pendiente_pago
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const userId = session.user.id as string

  // Detectar URL base real del servidor
  const host = req.headers.get('host') || 'localhost:3000'
  const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`

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

    // ── Primero verificar si el pago ya fue procesado por Flow ──────────────
    // (puede ocurrir si el webhook falló o NEXT_PUBLIC_APP_URL estaba mal)
    const { apiKey, secretKey } = await getFlowCredentials()

    if (apiKey && secretKey) {
      const pagosDelSitio = await db
        .select()
        .from(pagos)
        .where(eq(pagos.userId, userId))
        .orderBy(desc(pagos.createdAt))

      const pagoDelSitio = pagosDelSitio
        .filter(p => p.flowOrder?.startsWith(sitioId))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

      if (pagoDelSitio?.flowToken) {
        try {
          const estadoFlow = await obtenerEstadoPago({ apiKey, secretKey, token: pagoDelSitio.flowToken })

          if (estadoFlow.status === 1) {
            // ¡El pago ya estaba hecho! Actualizar BD y redirigir al wizard
            const plan = sitio.plan as string
            await Promise.all([
              db.update(pagos)
                .set({ estado: 'aprobado', updatedAt: new Date() })
                .where(eq(pagos.id, pagoDelSitio.id)),
              db.update(sitios)
                .set({ estado: 'borrador', plan: plan as any, updatedAt: new Date() })
                .where(eq(sitios.id, sitioId)),
              db.update(usuarios)
                .set({ plan: plan as any, updatedAt: new Date() })
                .where(eq(usuarios.id, userId)),
            ])
            return NextResponse.json({
              configurarUrl: `${appUrl}/dashboard/sitios/${sitioId}/configurar`,
              yaAprobado: true,
            })
          }
        } catch (err) {
          console.warn('[pagos/reanudar] No se pudo consultar Flow, creando nuevo pago:', err)
        }
      }
    }

    // ── No está pagado: crear nuevo link de pago ──────────────────────────────
    if (!apiKey || !secretKey) {
      throw new Error('Flow no configurado. Agrega FLOW_API_KEY y FLOW_SECRET_KEY.')
    }

    const plan = sitio.plan as string
    const monto = await getPrecioPlan(plan)
    const planNombre = PLAN_NOMBRES[plan as keyof typeof PLAN_NOMBRES]
    const shortSitio = sitio.id.replace(/-/g, '').slice(0, 10)
    const shortUser  = userId.replace(/-/g, '').slice(0, 8)
    const commerceOrder = `${shortSitio}${shortUser}${plan}re`.slice(0, 45)
    const urlReturn = `${appUrl}/dashboard/sitios/${sitio.id}/configurar`
    const MERCHANT_EMAIL = process.env.FLOW_MERCHANT_EMAIL || 'hola@weblynow.com'

    const flowParams = {
      apiKey,
      secretKey,
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
