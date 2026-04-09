import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db, pagos, sitios, usuarios } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { obtenerEstadoPago, getFlowCredentials } from '@/lib/flow'

// POST /api/pagos/verificar
// Consulta Flow directamente para verificar el estado de un pago pendiente
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { sitioId } = await req.json()
  if (!sitioId) return NextResponse.json({ error: 'sitioId requerido' }, { status: 400 })

  // Buscar pago más reciente para este sitio
  const todosPagos = await db
    .select()
    .from(pagos)
    .where(eq(pagos.userId, session.user.id as string))

  const pago = todosPagos
    .filter(p => p.flowOrder?.startsWith(sitioId + '|'))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

  if (!pago) return NextResponse.json({ aprobado: false, error: 'Pago no encontrado' })
  if (pago.estado === 'aprobado') return NextResponse.json({ aprobado: true })

  if (!pago.flowToken) return NextResponse.json({ aprobado: false })

  try {
    const { apiKey, secretKey } = await getFlowCredentials()
    if (!apiKey || !secretKey) return NextResponse.json({ aprobado: false })

    const estadoFlow = await obtenerEstadoPago({ apiKey, secretKey, token: pago.flowToken })

    if (estadoFlow.status === 1) {
      // Aprobar en DB
      await db.update(pagos).set({ estado: 'aprobado', updatedAt: new Date() }).where(eq(pagos.id, pago.id))
      await db.update(sitios).set({ estado: 'borrador', updatedAt: new Date() }).where(eq(sitios.id, sitioId))
      await db.update(usuarios).set({ plan: pago.plan as any, updatedAt: new Date() }).where(eq(usuarios.id, session.user.id as string))
      return NextResponse.json({ aprobado: true })
    }

    return NextResponse.json({ aprobado: false, statusFlow: estadoFlow.status })
  } catch (err: any) {
    return NextResponse.json({ aprobado: false, error: err.message })
  }
}
