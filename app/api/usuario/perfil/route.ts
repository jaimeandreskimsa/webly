import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db, usuarios } from '@/lib/db'
import { eq } from 'drizzle-orm'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const [usuario] = await db
    .select({ nombre: usuarios.nombre, email: usuarios.email, plan: usuarios.plan })
    .from(usuarios)
    .where(eq(usuarios.id, session.user.id as string))
    .limit(1)

  return NextResponse.json(usuario ?? {})
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { nombre } = await req.json()
  if (!nombre?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })

  await db
    .update(usuarios)
    .set({ nombre: nombre.trim(), updatedAt: new Date() })
    .where(eq(usuarios.id, session.user.id as string))

  return NextResponse.json({ ok: true })
}
