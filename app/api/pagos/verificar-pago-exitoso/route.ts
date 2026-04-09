import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db, pagos, sitios, usuarios } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { obtenerEstadoPago, getFlowCredentials } from '@/lib/flow'

export async function POST(req: NextRequest) {
  try {
    // flowToken = el token que Flow pone en ?token= cuando redirige al urlReturn
    const { sitioId, bypass, flowToken } = await req.json()

    if (!sitioId) {
      return NextResponse.json({ aprobado: false, error: 'sitioId requerido' }, { status: 400 })
    }

    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ sinSesion: true })
    }

    const [sitio] = await db
      .select()
      .from(sitios)
      .where(eq(sitios.id, sitioId))
      .limit(1)

    if (!sitio) {
      return NextResponse.json({ aprobado: false, error: 'Sitio no encontrado' })
    }

    // Verificar que el sitio pertenece al usuario logueado
    const esAdmin = (session.user as any).rol === 'admin'
    if (!esAdmin && sitio.userId !== session.user.id) {
      return NextResponse.json({ aprobado: false, error: 'Sin permiso' })
    }

    // Ya está listo en alguna forma
    if (sitio.estado === 'publicado') {
      return NextResponse.json({ yaPublicado: true })
    }
    if (sitio.estado === 'generando') {
      return NextResponse.json({ yaGenerando: true })
    }
    if (sitio.estado === 'borrador') {
      // El webhook ya aprobó el pago y actualizó el estado
      return NextResponse.json({ listo: true })
    }

    // ── FAST-PATH: tenemos el token de Flow desde la URL de retorno ───────────
    // Flow incluye ?token=XXX en urlReturn. Usamos ese token para consultar
    // directamente a Flow sin depender del insert async a la DB.
    if (flowToken) {
      const { apiKey, secretKey } = await getFlowCredentials()
      if (apiKey && secretKey) {
        try {
          const estadoFlow = await obtenerEstadoPago({ apiKey, secretKey, token: flowToken })

          if (estadoFlow.status === 1) {
            // Pago aprobado → buscar o crear registro en pagos y actualizar sitio
            const [pagoExistente] = await db
              .select()
              .from(pagos)
              .where(eq(pagos.flowToken, flowToken))
              .limit(1)

            await Promise.all([
              pagoExistente
                ? db
                    .update(pagos)
                    .set({ estado: 'aprobado', updatedAt: new Date() })
                    .where(eq(pagos.id, pagoExistente.id))
                : db.insert(pagos).values({
                    userId: sitio.userId,
                    flowToken,
                    flowOrder: `${sitioId}|${sitio.userId}|${sitio.plan}|en`,
                    plan: sitio.plan as any,
                    // El monto real está en estadoFlow.amount si la propiedad existe
                    monto: (estadoFlow as any).amount ?? 1000,
                    estado: 'aprobado',
                    metadata: { sitioId, source: 'urlReturn-token' },
                  }),
              db
                .update(sitios)
                .set({ estado: 'borrador', updatedAt: new Date() })
                .where(eq(sitios.id, sitioId)),
              db
                .update(usuarios)
                .set({ plan: sitio.plan as any, updatedAt: new Date() })
                .where(eq(usuarios.id, sitio.userId)),
            ])

            return NextResponse.json({ listo: true })
          }

          // status 2 = pendiente, 3 = rechazado, 4 = anulado
          // No retornamos error aquí — caemos al flujo normal de DB por si acaso
          console.log(`[verificar-pago-exitoso] flowToken status=${estadoFlow.status}, esperando...`)
        } catch (flowErr) {
          console.error('[verificar-pago-exitoso] Error consultando Flow con token directo:', flowErr)
          // Caemos al flujo normal por si el error es transitorio
        }
      }
    }

    // ── FLUJO NORMAL: buscar el pago en DB ────────────────────────────────────
    const todosPagos = await db
      .select()
      .from(pagos)
      .where(eq(pagos.userId, sitio.userId))

    const pago = todosPagos
      .filter(p => p.flowOrder?.startsWith(sitioId + '|'))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

    if (!pago) {
      return NextResponse.json({ aprobado: false, error: 'Pago no encontrado' })
    }

    // El webhook ya lo marcó como aprobado en DB
    if (pago.estado === 'aprobado') {
      await db
        .update(sitios)
        .set({ estado: 'borrador', updatedAt: new Date() })
        .where(eq(sitios.id, sitioId))
      return NextResponse.json({ listo: true })
    }

    // Sin token Flow todavía (pago muy reciente)
    if (!pago.flowToken) {
      return NextResponse.json({ aprobado: false })
    }

    // ── BYPASS: el usuario ya esperó suficiente y quiere continuar ────────────
    if (bypass) {
      await Promise.all([
        db.update(sitios)
          .set({ estado: 'borrador', updatedAt: new Date() })
          .where(eq(sitios.id, sitioId)),
        db.update(usuarios)
          .set({ plan: sitio.plan as any, updatedAt: new Date() })
          .where(eq(usuarios.id, sitio.userId)),
      ])
      return NextResponse.json({ listo: true })
    }

    // Consultar directamente a Flow con el token guardado en DB
    const { apiKey, secretKey } = await getFlowCredentials()
    if (!apiKey || !secretKey) {
      return NextResponse.json({ aprobado: false, error: 'Credenciales Flow no configuradas' })
    }

    const estadoFlow = await obtenerEstadoPago({
      apiKey,
      secretKey,
      token: pago.flowToken,
    })

    if (estadoFlow.status === 1) {
      // Pago confirmado — actualizar todo en paralelo
      await Promise.all([
        db.update(pagos)
          .set({ estado: 'aprobado', updatedAt: new Date() })
          .where(eq(pagos.id, pago.id)),
        db.update(sitios)
          .set({ estado: 'borrador', plan: sitio.plan as any, updatedAt: new Date() })
          .where(eq(sitios.id, sitioId)),
        db.update(usuarios)
          .set({ plan: sitio.plan as any, updatedAt: new Date() })
          .where(eq(usuarios.id, sitio.userId)),
      ])
      return NextResponse.json({ listo: true })
    }

    // Flow aún no confirmó (status !== 1)
    return NextResponse.json({ aprobado: false })
  } catch (err: any) {
    console.error('[verificar-pago-exitoso]', err)
    return NextResponse.json({ aprobado: false, error: err?.message ?? 'Error interno' })
  }
}
