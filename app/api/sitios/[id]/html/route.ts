import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db, sitios, versionesSitio } from '@/lib/db'
import { eq, and } from 'drizzle-orm'

// PATCH — actualiza el HTML de la versión actual sin pasar por Claude.
// No consume ediciones del plan.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const esAdmin = (session.user as any).rol === 'admin'

  const [sitio] = await db
    .select({ id: sitios.id })
    .from(sitios)
    .where(
      esAdmin
        ? eq(sitios.id, id)
        : and(eq(sitios.id, id), eq(sitios.userId, session.user.id as string))
    )
    .limit(1)

  if (!sitio) {
    return NextResponse.json({ error: 'Sitio no encontrado' }, { status: 404 })
  }

  const { html } = await req.json()
  if (!html || typeof html !== 'string' || html.length < 100) {
    return NextResponse.json({ error: 'HTML inválido' }, { status: 400 })
  }

  const result = await db
    .update(versionesSitio)
    .set({ htmlCompleto: html })
    .where(and(eq(versionesSitio.sitioId, id), eq(versionesSitio.esActual, true)))
    .returning({ id: versionesSitio.id })

  if (!result.length) {
    return NextResponse.json({ error: 'No hay versión activa para este sitio' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
