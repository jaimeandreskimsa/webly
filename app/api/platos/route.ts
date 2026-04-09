import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { platos, usuarios } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'

// GET /api/platos — listar platos del usuario
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const [usuario] = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.id, session.user.id as string))
      .limit(1)

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    if (usuario.plan !== 'restaurante') {
      return NextResponse.json({ error: 'Plan no permitido' }, { status: 403 })
    }

    const lista = await db
      .select()
      .from(platos)
      .where(eq(platos.userId, usuario.id))
      .orderBy(asc(platos.orden), asc(platos.createdAt))

    return NextResponse.json({ platos: lista })
  } catch (error) {
    console.error('[GET /api/platos]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// POST /api/platos — crear plato
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const [usuario] = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.id, session.user.id as string))
      .limit(1)

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    if (usuario.plan !== 'restaurante') {
      return NextResponse.json({ error: 'Plan no permitido' }, { status: 403 })
    }

    const body = await req.json()
    const { nombre, descripcion, precio, categoria, imagen, disponible, destacado, orden } = body

    if (!nombre?.trim()) {
      return NextResponse.json({ error: 'El nombre del plato es requerido' }, { status: 400 })
    }

    const [nuevo] = await db
      .insert(platos)
      .values({
        userId: usuario.id,
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        precio: precio ? Number(precio) : null,
        categoria: categoria || 'principal',
        imagen: imagen || null,
        disponible: disponible !== false,
        destacado: destacado ?? false,
        orden: orden ?? 0,
      })
      .returning()

    return NextResponse.json({ plato: nuevo }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/platos]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
