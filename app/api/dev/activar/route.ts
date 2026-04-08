import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db, sitios } from '@/lib/db'
import { eq, and } from 'drizzle-orm'

// Solo disponible en desarrollo local
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Solo disponible en desarrollo' }, { status: 403 })
  }

  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { sitioId } = await req.json()

  const [sitio] = await db
    .select()
    .from(sitios)
    .where(and(eq(sitios.id, sitioId), eq(sitios.userId, session.user.id as string)))
    .limit(1)

  if (!sitio) {
    return NextResponse.json({ error: 'Sitio no encontrado' }, { status: 404 })
  }

  // Activar directamente sin pago — poner en 'generando' para que
  // el GET /api/generar arranque la generación con Claude
  await db
    .update(sitios)
    .set({ estado: 'generando', updatedAt: new Date() })
    .where(eq(sitios.id, sitioId))

  return NextResponse.json({ ok: true })
}
