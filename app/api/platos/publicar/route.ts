import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { platos, usuarios, sitios, versionesSitio } from '@/lib/db/schema'
import { eq, and, asc, desc } from 'drizzle-orm'
import { deployarSitio } from '@/lib/vercel/deploy'

export const maxDuration = 120

// POST /api/platos/publicar
// Inyecta la carta actual en el HTML del sitio y redespliega
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

    if (!usuario || usuario.plan !== 'restaurante') {
      return NextResponse.json({ error: 'Plan no permitido' }, { status: 403 })
    }

    // Obtener el sitio activo del usuario
    const [sitio] = await db
      .select()
      .from(sitios)
      .where(and(eq(sitios.userId, usuario.id), eq(sitios.plan, 'restaurante')))
      .orderBy(desc(sitios.createdAt))
      .limit(1)

    if (!sitio) {
      return NextResponse.json({ error: 'No tienes un sitio restaurante activo' }, { status: 404 })
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

    // Obtener todos los platos del usuario ordenados
    const lista = await db
      .select()
      .from(platos)
      .where(eq(platos.userId, usuario.id))
      .orderBy(asc(platos.orden), asc(platos.createdAt))

    // Serializar carta como JSON limpio
    const cartaJson = JSON.stringify(lista)

    // Inyectar en el HTML reemplazando el marcador
    const htmlActualizado = version.htmlCompleto.replace(
      /\/\* MENU_DATA_START \*\/[\s\S]*?\/\* MENU_DATA_END \*\//,
      `/* MENU_DATA_START */${cartaJson}/* MENU_DATA_END */`
    )

    if (htmlActualizado === version.htmlCompleto) {
      return NextResponse.json(
        { error: 'No se encontró el marcador de carta en el HTML. Regenera el sitio.' },
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
        modeloUsado: 'carta-update',
        promptUsado: `Actualización de carta con ${lista.length} platos`,
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
        platos: lista.length,
      })
    }

    // Sin token — solo actualizamos el HTML guardado
    return NextResponse.json({
      ok: true,
      publicado: false,
      mensaje: 'Carta actualizada. Configura Vercel en Configuración para publicar automáticamente.',
      platos: lista.length,
    })
  } catch (error) {
    console.error('[POST /api/platos/publicar]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
