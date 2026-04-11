import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db, usuarios, sitios } from '@/lib/db'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

async function verificarAdmin(req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as any).rol !== 'admin') {
    return null
  }
  return session
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params
  const session = await verificarAdmin(req)
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { accion, valor } = await req.json()

  const [usuario] = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.id, userId))
    .limit(1)

  if (!usuario) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  switch (accion) {
    case 'cambiar_plan':
      await db
        .update(usuarios)
        .set({ plan: valor as any, updatedAt: new Date() })
        .where(eq(usuarios.id, userId))
      break

    case 'cambiar_rol':
      // No permitir que el admin se quite su propio rol
      if (userId === (session.user as any).id && valor !== 'admin') {
        return NextResponse.json(
          { error: 'No puedes quitarte el rol de admin a ti mismo' },
          { status: 400 }
        )
      }
      await db
        .update(usuarios)
        .set({ rol: valor as any, updatedAt: new Date() })
        .where(eq(usuarios.id, userId))
      break

    case 'resetear_password': {
      const nuevaPass = Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6).toUpperCase()
      const hash = await bcrypt.hash(nuevaPass, 12)
      await db
        .update(usuarios)
        .set({ password: hash, updatedAt: new Date() })
        .where(eq(usuarios.id, userId))
      return NextResponse.json({ ok: true, nuevaPassword: nuevaPass })
    }

    case 'toggle_activo':
      await db
        .update(usuarios)
        .set({ activo: !usuario.activo, updatedAt: new Date() })
        .where(eq(usuarios.id, userId))
      break

    case 'eliminar':
      // No permitir que el admin se elimine a sí mismo
      if (userId === (session.user as any).id) {
        return NextResponse.json(
          { error: 'No puedes eliminar tu propia cuenta' },
          { status: 400 }
        )
      }
      // Eliminar sitios del usuario primero
      await db.delete(sitios).where(eq(sitios.userId, userId))
      // Eliminar usuario
      await db.delete(usuarios).where(eq(usuarios.id, userId))
      return NextResponse.json({ ok: true, eliminado: true })

    default:
      return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
