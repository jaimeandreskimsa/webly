import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db, usuarios } from '@/lib/db'
import { eq } from 'drizzle-orm'

// GET – devuelve las integraciones del usuario (token enmascarado)
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const [usuario] = await db
    .select({ vercelToken: usuarios.vercelToken, vercelTeamId: usuarios.vercelTeamId })
    .from(usuarios)
    .where(eq(usuarios.id, session.user.id as string))
    .limit(1)

  return NextResponse.json({
    vercelToken: maskToken(usuario?.vercelToken),
    vercelTeamId: usuario?.vercelTeamId || '',
    vercelConectado: !!usuario?.vercelToken,
  })
}

// PUT – guarda el token Vercel del usuario
export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { vercelToken, vercelTeamId } = await req.json()

  // Si el token tiene ●, significa que el usuario no lo cambió → no actualizar
  const tokenLimpio = vercelToken?.includes('●') ? undefined : (vercelToken || null)

  await db
    .update(usuarios)
    .set({
      ...(tokenLimpio !== undefined && { vercelToken: tokenLimpio }),
      vercelTeamId: vercelTeamId?.trim() || null,
    })
    .where(eq(usuarios.id, session.user.id as string))

  return NextResponse.json({ ok: true })
}

// DELETE – desconecta Vercel
export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  await db
    .update(usuarios)
    .set({ vercelToken: null, vercelTeamId: null })
    .where(eq(usuarios.id, session.user.id as string))

  return NextResponse.json({ ok: true })
}

function maskToken(token: string | null | undefined): string {
  if (!token || token.length < 8) return ''
  return token.slice(0, 4) + '●'.repeat(Math.max(token.length - 8, 4)) + token.slice(-4)
}
