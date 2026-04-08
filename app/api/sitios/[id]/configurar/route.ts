import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db, sitios } from '@/lib/db'
import { eq, and } from 'drizzle-orm'

// PUT /api/sitios/[id]/configurar
// Guarda el contenido del wizard y cambia el estado a generando
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Verificar que el sitio le pertenece al usuario
  const [sitio] = await db
    .select()
    .from(sitios)
    .where(and(eq(sitios.id, id), eq(sitios.userId, session.user.id as string)))
    .limit(1)

  if (!sitio) {
    return NextResponse.json({ error: 'Sitio no encontrado' }, { status: 404 })
  }

  // Solo permitir configurar sitios en estado borrador o pendiente_pago
  if (!['borrador', 'pendiente_pago'].includes(sitio.estado || '')) {
    return NextResponse.json(
      { error: 'El sitio ya fue configurado o generado' },
      { status: 400 }
    )
  }

  try {
    const { nombreEmpresa, contenidoJson } = await req.json()

    await db
      .update(sitios)
      .set({
        nombre: nombreEmpresa || sitio.nombre,
        contenidoJson,
        estado: 'generando',
        updatedAt: new Date(),
      })
      .where(eq(sitios.id, id))

    return NextResponse.json({ ok: true, sitioId: id })
  } catch (err: any) {
    console.error('[sitios/configurar] Error:', err)
    return NextResponse.json({ error: err.message || 'Error al guardar' }, { status: 500 })
  }
}
