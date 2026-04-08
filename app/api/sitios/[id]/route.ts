import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db, sitios } from '@/lib/db'
import { eq, and } from 'drizzle-orm'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const esAdmin = (session.user as any).rol === 'admin'
  const [sitio] = await db
    .select()
    .from(sitios)
    .where(
      esAdmin
        ? eq(sitios.id, id)
        : and(eq(sitios.id, id), eq(sitios.userId, session.user.id as string))
    )
    .limit(1)

  if (!sitio) {
    return NextResponse.json({ error: 'Sitio no encontrado' }, { status: 404 })
  }

  return NextResponse.json({ sitio })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const esAdmin = (session.user as any).rol === 'admin'
  const [sitioActual] = await db
    .select()
    .from(sitios)
    .where(
      esAdmin
        ? eq(sitios.id, id)
        : and(eq(sitios.id, id), eq(sitios.userId, session.user.id as string))
    )
    .limit(1)

  if (!sitioActual) {
    return NextResponse.json({ error: 'Sitio no encontrado' }, { status: 404 })
  }

  const { nombre, contenidoJson } = await req.json()

  const [actualizado] = await db
    .update(sitios)
    .set({
      ...(nombre && { nombre }),
      ...(contenidoJson && { contenidoJson }),
      updatedAt: new Date(),
    })
    .where(eq(sitios.id, id))
    .returning()

  return NextResponse.json({ sitio: actualizado })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const esAdmin = (session.user as any).rol === 'admin'
  const [sitio] = await db
    .select()
    .from(sitios)
    .where(
      esAdmin
        ? eq(sitios.id, id)
        : and(eq(sitios.id, id), eq(sitios.userId, session.user.id as string))
    )
    .limit(1)

  if (!sitio) {
    return NextResponse.json({ error: 'Sitio no encontrado' }, { status: 404 })
  }

  await db.delete(sitios).where(eq(sitios.id, id))

  return NextResponse.json({ ok: true })
}
