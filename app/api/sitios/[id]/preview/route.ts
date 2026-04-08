import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { db, sitios, versionesSitio } from '@/lib/db'
import { eq, and } from 'drizzle-orm'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) {
    return new Response('No autorizado', { status: 401 })
  }

  const esAdmin = (session.user as any).rol === 'admin'
  const [sitio] = await db
    .select()
    .from(sitios)
    .where(
      esAdmin
        ? eq(sitios.id, id)
        : and(eq(sitios.id, id), eq(sitios.userId, session.user.id as string))
    )
    .limit(1)

  if (!sitio) {
    return new Response('Sitio no encontrado', { status: 404 })
  }

  const [version] = await db
    .select()
    .from(versionesSitio)
    .where(
      and(
        eq(versionesSitio.sitioId, id),
        eq(versionesSitio.esActual, true)
      )
    )
    .limit(1)

  if (!version) {
    return new Response('No hay versión generada', { status: 404 })
  }

  return new Response(version.htmlCompleto, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}
