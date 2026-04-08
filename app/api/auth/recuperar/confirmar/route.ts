import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db, usuarios } from '@/lib/db'
import { verificarTokenRecuperacion } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password || password.length < 6) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const email = verificarTokenRecuperacion(token)
    if (!email) {
      return NextResponse.json({ error: 'El enlace expiró o no es válido. Solicita uno nuevo.' }, { status: 400 })
    }

    const [usuario] = await db
      .select({ id: usuarios.id })
      .from(usuarios)
      .where(eq(usuarios.email, email))
      .limit(1)

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const hash = await bcrypt.hash(password, 12)
    await db.update(usuarios)
      .set({ password: hash, updatedAt: new Date() })
      .where(eq(usuarios.email, email))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[recuperar/confirmar] Error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
