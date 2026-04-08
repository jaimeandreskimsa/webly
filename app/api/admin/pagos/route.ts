import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db, pagos, sitios, usuarios } from '@/lib/db'
import { eq, and } from 'drizzle-orm'

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as any).rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { pagoId, accion } = await req.json()

  if (!pagoId || !accion) {
    return NextResponse.json({ error: 'pagoId y accion requeridos' }, { status: 400 })
  }

  if (accion === 'aprobar') {
    // Buscar el pago
    const [pago] = await db
      .select()
      .from(pagos)
      .where(eq(pagos.id, pagoId))
      .limit(1)

    if (!pago) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
    }

    if (pago.estado === 'aprobado') {
      return NextResponse.json({ message: 'Pago ya estaba aprobado' })
    }

    // Marcar pago como aprobado
    await db
      .update(pagos)
      .set({ estado: 'aprobado', updatedAt: new Date() })
      .where(eq(pagos.id, pagoId))

    // Obtener sitioId del metadata o flowOrder
    const metadata = pago.metadata as any
    const sitioId = metadata?.sitioId

    if (sitioId) {
      // Cambiar sitio de pendiente_pago a borrador (para que pueda llenar el wizard)
      await db
        .update(sitios)
        .set({ estado: 'borrador', updatedAt: new Date() })
        .where(and(eq(sitios.id, sitioId), eq(sitios.estado, 'pendiente_pago')))
    } else {
      // Si no hay sitioId en metadata, buscar sitio pendiente_pago del usuario
      const [sitioPendiente] = await db
        .select()
        .from(sitios)
        .where(
          and(
            eq(sitios.userId, pago.userId),
            eq(sitios.estado, 'pendiente_pago')
          )
        )
        .limit(1)

      if (sitioPendiente) {
        await db
          .update(sitios)
          .set({ estado: 'borrador', updatedAt: new Date() })
          .where(eq(sitios.id, sitioPendiente.id))
      }
    }

    // Actualizar plan del usuario
    await db
      .update(usuarios)
      .set({ plan: pago.plan, updatedAt: new Date() })
      .where(eq(usuarios.id, pago.userId))

    return NextResponse.json({ ok: true, message: 'Pago aprobado manualmente' })
  }

  return NextResponse.json({ error: 'Accion no reconocida' }, { status: 400 })
}
