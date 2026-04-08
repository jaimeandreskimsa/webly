import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db, usuarios } from '@/lib/db'
import { enviarEmailRecuperacion } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
    }

    // Buscar usuario (no revelar si existe o no por seguridad)
    const [usuario] = await db
      .select({ id: usuarios.id, nombre: usuarios.nombre, activo: usuarios.activo })
      .from(usuarios)
      .where(eq(usuarios.email, email.toLowerCase().trim()))
      .limit(1)

    if (usuario?.activo) {
      // Fire-and-forget: no bloqueamos la respuesta
      enviarEmailRecuperacion(email.toLowerCase().trim(), usuario.nombre).catch(err =>
        console.error('[recuperar] Error enviando email:', err)
      )
    }

    // Siempre OK para no revelar si el email existe
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[recuperar] Error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
