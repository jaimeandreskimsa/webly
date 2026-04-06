import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db, sitios } from '@/lib/db'
import { eq, desc } from 'drizzle-orm'
import { generateSlug } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const misSitios = await db
    .select()
    .from(sitios)
    .where(eq(sitios.userId, session.user.id as string))
    .orderBy(desc(sitios.updatedAt))

  return NextResponse.json({ sitios: misSitios })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { nombre, plan, contenidoJson } = await req.json()

    if (!nombre || !plan) {
      return NextResponse.json({ error: 'Nombre y plan requeridos' }, { status: 400 })
    }

    const slug = generateSlug(nombre) + '-' + Date.now().toString(36)

    const [nuevoSitio] = await db
      .insert(sitios)
      .values({
        userId: session.user.id as string,
        nombre,
        slug,
        plan,
        estado: 'pendiente_pago',
        contenidoJson,
      })
      .returning()

    return NextResponse.json({ sitio: nuevoSitio }, { status: 201 })
  } catch (error) {
    console.error('Error creando sitio:', error)
    return NextResponse.json({ error: 'Error al crear el sitio' }, { status: 500 })
  }
}
