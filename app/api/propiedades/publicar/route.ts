import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { propiedades, usuarios, sitios, versionesSitio } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { deployarSitio } from '@/lib/vercel/deploy'

export const maxDuration = 120

// POST /api/propiedades/publicar
// Inyecta las propiedades actuales en el HTML del sitio y redespliega
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const [usuario] = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.id, session.user.id as string))
      .limit(1)

    if (!usuario || usuario.plan !== 'broker') {
      return NextResponse.json({ error: 'Plan no permitido' }, { status: 403 })
    }

    // Obtener el sitio activo del usuario
    const [sitio] = await db
      .select()
      .from(sitios)
      .where(and(eq(sitios.userId, usuario.id), eq(sitios.plan, 'broker')))
      .orderBy(desc(sitios.createdAt))
      .limit(1)

    if (!sitio) {
      return NextResponse.json({ error: 'No tienes un sitio broker activo' }, { status: 404 })
    }

    // Obtener la versión actual del HTML
    const [version] = await db
      .select()
      .from(versionesSitio)
      .where(and(eq(versionesSitio.sitioId, sitio.id), eq(versionesSitio.esActual, true)))
      .limit(1)

    if (!version) {
      return NextResponse.json({ error: 'No hay versión generada para actualizar' }, { status: 404 })
    }

    // Obtener todas las propiedades activas del usuario
    const lista = await db
      .select()
      .from(propiedades)
      .where(and(eq(propiedades.userId, usuario.id), eq(propiedades.activa, true)))
      .orderBy(desc(propiedades.createdAt))

    // Serializar propiedades como JSON limpio
    const propiedadesJson = JSON.stringify(lista)

    // Inyectar en el HTML reemplazando el marcador
    const htmlActualizado = version.htmlCompleto.replace(
      /\/\* PROPERTIES_DATA_START \*\/[\s\S]*?\/\* PROPERTIES_DATA_END \*\//,
      `/* PROPERTIES_DATA_START */${propiedadesJson}/* PROPERTIES_DATA_END */`
    )

    if (htmlActualizado === version.htmlCompleto) {
      return NextResponse.json(
        { error: 'No se encontró el marcador de propiedades en el HTML. Regenera el sitio.' },
        { status: 400 }
      )
    }

    // Guardar nueva versión con el HTML actualizado
    await db
      .update(versionesSitio)
      .set({ esActual: false })
      .where(eq(versionesSitio.sitioId, sitio.id))

    const [nuevaVersion] = await db
      .insert(versionesSitio)
      .values({
        sitioId: sitio.id,
        numeroVersion: version.numeroVersion + 1,
        htmlCompleto: htmlActualizado,
        esActual: true,
        modeloUsado: 'propiedades-update',
        promptUsado: `Actualización de ${lista.length} propiedades`,
      })
      .returning()

    // Redesplegar en Vercel si tiene token
    if (usuario.vercelToken) {
      const resultado = await deployarSitio(
        htmlActualizado,
        sitio.nombre,
        sitio.id,
        usuario.vercelToken
      )

      await db
        .update(sitios)
        .set({
          deployUrl: resultado.url,
          vercelDeploymentId: resultado.deploymentId,
          updatedAt: new Date(),
        })
        .where(eq(sitios.id, sitio.id))

      return NextResponse.json({
        ok: true,
        publicado: true,
        url: resultado.url,
        propiedades: lista.length,
      })
    }

    // Sin token — solo actualizamos el HTML guardado
    return NextResponse.json({
      ok: true,
      publicado: false,
      mensaje: 'HTML actualizado. Configura tu token Vercel en Configuración para publicar automáticamente.',
      propiedades: lista.length,
    })
  } catch (error) {
    console.error('[POST /api/propiedades/publicar]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
