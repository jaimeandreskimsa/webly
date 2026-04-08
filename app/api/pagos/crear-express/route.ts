import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db, pagos, sitios } from '@/lib/db'
import { crearPagoPlan } from '@/lib/flow'
import { PLAN_PRECIOS, generateSlug } from '@/lib/utils'

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

    // 1. Crear sitio vacío (sin datos del wizard todavía)
    const slug = `sitio-${plan}-${Date.now().toString(36)}`
    const [nuevoSitio] = await db
      .insert(sitios)
      .values({
        userId,
        nombre: `Mi sitio ${plan}`,
        slug,
        plan: plan as any,
        estado: 'pendiente_pago',
        contenidoJson: null,
      })
      .returning()

    // 2. Crear pago express en Flow
    //    urlReturn apuntará a /dashboard/sitios/{id}/configurar
    const { checkoutUrl, flowToken } = await crearPagoPlan({
      plan: plan as any,
      sitioId: nuevoSitio.id,
      userId,
      nombreEmpresa: 'Nuevo sitio',
      email: session.user.email!,
      tipo: 'express_nuevo',
    })

    // 3. Registrar pago pendiente
    await db.insert(pagos).values({
      userId,
      flowToken,
      flowOrder: `${nuevoSitio.id}|${userId}|${plan}|en`,
      plan: plan as any,
      monto: PLAN_PRECIOS[plan as keyof typeof PLAN_PRECIOS] || 0,
      estado: 'pendiente',
      metadata: { sitioId: nuevoSitio.id, userId, plan, tipo: 'en' },
    })

    return NextResponse.json({ checkoutUrl, sitioId: nuevoSitio.id })
  } catch (error: any) {
    console.error('[pagos/crear-express] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al iniciar el pago' },
      { status: 500 }
    )
  }
}
