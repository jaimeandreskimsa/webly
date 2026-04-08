import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db, usuarios } from '@/lib/db'
import { z } from 'zod'
import { enviarEmailBienvenida } from '@/lib/email'

const PLANES_VALIDOS = ['basico', 'pro', 'premium', 'broker'] as const
type PlanValido = typeof PLANES_VALIDOS[number]

const registroSchema = z.object({
  nombre: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  plan: z.enum(PLANES_VALIDOS).optional().default('basico'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = registroSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', detalles: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { nombre, email, password, plan } = parsed.data

    // Verificar si ya existe
    const [existente] = await db
      .select({ id: usuarios.id })
      .from(usuarios)
      .where(eq(usuarios.email, email))
      .limit(1)

    if (existente) {
      return NextResponse.json(
        { error: 'Este email ya está registrado' },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const [nuevoUsuario] = await db
      .insert(usuarios)
      .values({
        nombre,
        email,
        password: passwordHash,
        plan: plan as PlanValido,
      })
      .returning({ id: usuarios.id, email: usuarios.email, nombre: usuarios.nombre })

    // Email de bienvenida — fire-and-forget
    enviarEmailBienvenida(nombre, email).catch(err =>
      console.error('[registro] Error enviando email bienvenida:', err)
    )

    return NextResponse.json(
      { mensaje: 'Usuario creado exitosamente', usuario: nuevoUsuario },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error en registro:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
