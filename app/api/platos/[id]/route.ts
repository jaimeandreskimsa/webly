import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { platos, usuarios } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// PATCH /api/platos/[id] — actualizar plato
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const [usuario] = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.id, session.user.id as string))
      .limit(1)

    if (!usuario || usuario.plan !== 'restaurante') {
      return NextResponse.json({ error: 'Plan no permitido' }, { status: 403 })
    }

    // Verificar que el plato pertenece al usuario
    const [plato] = await db
      .select()
      .from(platos)
      .where(and(eq(platos.id, id), eq(platos.userId, usuario.id)))
      .limit(1)

    if (!plato) {
      return NextResponse.json({ error: 'Plato no encontrado' }, { status: 404 })
    }

    const body = await req.json()
    const { nombre, descripcion, precio, categoria, imagen, disponible, destacado, orden } = body

    const [actualizado] = await db
      .update(platos)
      .set({
        ...(nombre !== undefined && { nombre: nombre.trim() }),
        ...(descripcion !== undefined && { descripcion: descripcion?.trim() || null }),
        ...(precio !== undefined && { precio: precio ? Number(precio) : null }),
        ...(categoria !== undefined && { categoria }),
        ...(imagen !== undefined && { imagen: imagen || null }),
        ...(disponible !== undefined && { disponible }),
        ...(destacado !== undefined && { destacado }),
        ...(orden !== undefined && { orden }),
        updatedAt: new Date(),
      })
      .where(and(eq(platos.id, id), eq(platos.userId, usuario.id)))
      .returning()

    return NextResponse.json({ plato: actualizado })
  } catch (error) {
    console.error('[PATCH /api/platos/[id]]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// DELETE /api/platos/[id] — eliminar plato
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const [usuario] = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.id, session.user.id as string))
      .limit(1)

    if (!usuario || usuario.plan !== 'restaurante') {
      return NextResponse.json({ error: 'Plan no permitido' }, { status: 403 })
    }

    const deleted = await db
      .delete(platos)
      .where(and(eq(platos.id, id), eq(platos.userId, usuario.id)))
      .returning()

    if (!deleted.length) {
      return NextResponse.json({ error: 'Plato no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[DELETE /api/platos/[id]]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
