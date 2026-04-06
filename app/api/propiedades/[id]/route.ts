import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { propiedades, usuarios } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

async function getUsuarioYPropiedad(userId: string, propiedadId: string) {
  const [usuario] = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.id, userId))
    .limit(1)

  if (!usuario || usuario.plan !== 'broker') return { usuario: null, propiedad: null }

  const [propiedad] = await db
    .select()
    .from(propiedades)
    .where(and(eq(propiedades.id, propiedadId), eq(propiedades.userId, usuario.id)))
    .limit(1)

  return { usuario, propiedad: propiedad || null }
}

// GET /api/propiedades/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { propiedad } = await getUsuarioYPropiedad(session.user.id as string, params.id)
    if (!propiedad) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

    return NextResponse.json({ propiedad })
  } catch (error) {
    console.error('[GET /api/propiedades/[id]]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// PUT /api/propiedades/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { usuario, propiedad } = await getUsuarioYPropiedad(session.user.id as string, params.id)
    if (!usuario) return NextResponse.json({ error: 'Plan no permitido' }, { status: 403 })
    if (!propiedad) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

    const body = await req.json()
    const {
      titulo, descripcion, precio, moneda, tipo, tipoPropiedad,
      superficie, habitaciones, banos, estacionamientos,
      ubicacion, ciudad, imagenes, destacada, activa,
    } = body

    const [actualizada] = await db
      .update(propiedades)
      .set({
        ...(titulo !== undefined && { titulo }),
        ...(descripcion !== undefined && { descripcion }),
        ...(precio !== undefined && { precio: precio ? Number(precio) : null }),
        ...(moneda !== undefined && { moneda }),
        ...(tipo !== undefined && { tipo }),
        ...(tipoPropiedad !== undefined && { tipoPropiedad }),
        ...(superficie !== undefined && { superficie: superficie ? Number(superficie) : null }),
        ...(habitaciones !== undefined && { habitaciones: habitaciones ? Number(habitaciones) : null }),
        ...(banos !== undefined && { banos: banos ? Number(banos) : null }),
        ...(estacionamientos !== undefined && { estacionamientos: estacionamientos ? Number(estacionamientos) : null }),
        ...(ubicacion !== undefined && { ubicacion }),
        ...(ciudad !== undefined && { ciudad }),
        ...(imagenes !== undefined && { imagenes }),
        ...(destacada !== undefined && { destacada }),
        ...(activa !== undefined && { activa }),
        updatedAt: new Date(),
      })
      .where(eq(propiedades.id, params.id))
      .returning()

    return NextResponse.json({ propiedad: actualizada })
  } catch (error) {
    console.error('[PUT /api/propiedades/[id]]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// DELETE /api/propiedades/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { usuario, propiedad } = await getUsuarioYPropiedad(session.user.id as string, params.id)
    if (!usuario) return NextResponse.json({ error: 'Plan no permitido' }, { status: 403 })
    if (!propiedad) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

    await db.delete(propiedades).where(eq(propiedades.id, params.id))

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[DELETE /api/propiedades/[id]]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
