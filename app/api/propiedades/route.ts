import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { propiedades, usuarios } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

// GET /api/propiedades — listar propiedades del usuario
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

    if (usuario.plan !== 'broker') {
      return NextResponse.json({ error: 'Plan no permitido' }, { status: 403 })
    }

    const lista = await db
      .select()
      .from(propiedades)
      .where(and(eq(propiedades.userId, usuario.id), eq(propiedades.activa, true)))
      .orderBy(desc(propiedades.createdAt))

    return NextResponse.json({ propiedades: lista })
  } catch (error) {
    console.error('[GET /api/propiedades]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// POST /api/propiedades — crear propiedad
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

    if (usuario.plan !== 'broker') {
      return NextResponse.json({ error: 'Plan no permitido' }, { status: 403 })
    }

    const body = await req.json()
    const {
      titulo, descripcion, precio, moneda, tipo, tipoPropiedad,
      superficie, habitaciones, banos, estacionamientos,
      ubicacion, ciudad, imagenes, destacada,
    } = body

    if (!titulo) {
      return NextResponse.json({ error: 'El título es requerido' }, { status: 400 })
    }

    const [nueva] = await db
      .insert(propiedades)
      .values({
        userId: usuario.id,
        titulo,
        descripcion: descripcion || null,
        precio: precio ? Number(precio) : null,
        moneda: moneda || 'CLP',
        tipo: tipo || 'venta',
        tipoPropiedad: tipoPropiedad || 'casa',
        superficie: superficie ? Number(superficie) : null,
        habitaciones: habitaciones ? Number(habitaciones) : null,
        banos: banos ? Number(banos) : null,
        estacionamientos: estacionamientos ? Number(estacionamientos) : null,
        ubicacion: ubicacion || null,
        ciudad: ciudad || null,
        imagenes: imagenes || [],
        destacada: destacada ?? false,
        activa: true,
      })
      .returning()

    return NextResponse.json({ propiedad: nueva }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/propiedades]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
