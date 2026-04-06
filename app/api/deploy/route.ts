import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db, sitios, versionesSitio, usuarios } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { deployarSitio } from '@/lib/vercel/deploy'

export const maxDuration = 120

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { sitioId } = await req.json()

    // Verificar que el sitio pertenece al usuario
    const [sitio] = await db
      .select()
      .from(sitios)
      .where(
        and(eq(sitios.id, sitioId), eq(sitios.userId, session.user.id as string))
      )
      .limit(1)

    if (!sitio) {
      return NextResponse.json({ error: 'Sitio no encontrado' }, { status: 404 })
    }

    // Obtener HTML actual
    const [version] = await db
      .select()
      .from(versionesSitio)
      .where(
        and(eq(versionesSitio.sitioId, sitioId), eq(versionesSitio.esActual, true))
      )
      .limit(1)

    if (!version) {
      return NextResponse.json(
        { error: 'No hay versión generada para desplegar' },
        { status: 404 }
      )
    }

    // Leer token Vercel del usuario (tiene prioridad sobre el token del sistema)
    const [usuarioData] = await db
      .select({ vercelToken: usuarios.vercelToken })
      .from(usuarios)
      .where(eq(usuarios.id, session.user.id as string))
      .limit(1)

    // Desplegar en Vercel
    const resultado = await deployarSitio(
      version.htmlCompleto,
      sitio.nombre,
      sitio.id,
      usuarioData?.vercelToken
    )

    // Guardar deploy info
    await db
      .update(sitios)
      .set({
        estado: 'publicado',
        deployUrl: resultado.url,
        vercelProjectId: resultado.projectId,
        vercelDeploymentId: resultado.deploymentId,
        updatedAt: new Date(),
      })
      .where(eq(sitios.id, sitioId))

    return NextResponse.json({
      ok: true,
      url: resultado.url,
      deploymentId: resultado.deploymentId,
    })
  } catch (error: any) {
    console.error('Error desplegando sitio:', error)
    return NextResponse.json(
      { error: error.message || 'Error al desplegar el sitio' },
      { status: 500 }
    )
  }
}
