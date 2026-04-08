import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db, sitios, versionesSitio } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import JSZip from 'jszip'

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

  // Crear ZIP
  const zip = new JSZip()
  zip.file('index.html', version.htmlCompleto)
  zip.file('README.txt', `
Sitio web de ${sitio.nombre}
Generado con WeblyNow (weblynow.cl)
Versión: ${version.numeroVersion}
Fecha: ${new Date().toLocaleDateString('es-CL')}

INSTRUCCIONES:
1. Sube el archivo index.html a tu hosting
2. Asegúrate de que sea el archivo principal
3. Para soporte: soporte@weblynow.cl
`)

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })

  const nombreArchivo = `${sitio.nombre.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_v${version.numeroVersion}.zip`

  return new Response(zipBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
      'Content-Length': String(zipBuffer.length),
    },
  })
}
