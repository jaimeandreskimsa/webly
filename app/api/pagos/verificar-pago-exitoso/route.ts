import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db, pagos, sitios, usuarios } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { obtenerEstadoPago, getFlowCredentials } from '@/lib/flow'

export async function POST(req: NextRequest) {
  try {
    const { sitioId, bypass } = await req.json()

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

    // Estado pendiente_pago — buscar el pago en DB
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
    // Sólo se activa si existe un flowToken (el usuario SÍ inició el pago en Flow).
    // Cuando Flow confirme (webhook tardío) el sitio ya estará en borrador — ok.
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

    // Consultar directamente a Flow
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
