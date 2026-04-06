import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db, usuarios } from '@/lib/db'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { actual, nueva } = await req.json()
  if (!actual || !nueva) return NextResponse.json({ error: 'Campos requeridos' }, { status: 400 })
  if (nueva.length < 8) return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' }, { status: 400 })

  const [usuario] = await db
    .select({ id: usuarios.id, password: usuarios.password })
    .from(usuarios)
    .where(eq(usuarios.id, session.user.id as string))
    .limit(1)

  if (!usuario?.password) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const valida = await bcrypt.compare(actual, usuario.password)
  if (!valida) return NextResponse.json({ error: 'La contraseña actual es incorrecta' }, { status: 400 })

  const hash = await bcrypt.hash(nueva, 12)
  await db
    .update(usuarios)
    .set({ password: hash, updatedAt: new Date() })
    .where(eq(usuarios.id, session.user.id as string))

  return NextResponse.json({ ok: true })
}
