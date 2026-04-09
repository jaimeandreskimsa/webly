import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db, sitios } from '@/lib/db'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as any).rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { sitioId, accion } = await req.json()

  if (accion === 'regenerar') {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/generar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sitioId }),
    })
    if (!res.ok) {
      return NextResponse.json({ error: 'Error regenerando' }, { status: 500 })
    }
  }

  if (accion === 'resetear') {
    await db
      .update(sitios)
      .set({ estado: 'borrador', updatedAt: new Date() })
      .where(eq(sitios.id, sitioId))
  }

  return NextResponse.json({ ok: true })
}
