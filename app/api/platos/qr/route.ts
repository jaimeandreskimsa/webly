import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db, sitios } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import QRCode from 'qrcode'

/**
 * GET /api/platos/qr — genera un PNG del QR que apunta a la carta online (sección #menu)
 * Query params:
 *   size  — ancho en px (default 512, max 1024)
 *   logo  — "1" para incluir overlay con nombre (default: sin logo)
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Buscar el sitio restaurante del usuario
  const [sitio] = await db
    .select()
    .from(sitios)
    .where(
      and(
        eq(sitios.userId, session.user.id as string),
        eq(sitios.plan, 'restaurante'),
      ),
    )
    .limit(1)

  if (!sitio) {
    return NextResponse.json({ error: 'No tienes un sitio restaurante' }, { status: 404 })
  }

  if (!sitio.deployUrl) {
    return NextResponse.json(
      { error: 'Tu sitio aún no ha sido publicado. Despliega tu sitio primero para generar el QR.' },
      { status: 400 },
    )
  }

  const url = `${sitio.deployUrl}#menu`
  const size = Math.min(Number(req.nextUrl.searchParams.get('size') || 512), 1024)

  const buffer = await QRCode.toBuffer(url, {
    type: 'png',
    width: size,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
    errorCorrectionLevel: 'H',
  })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `inline; filename="qr-carta-${sitio.slug || 'restaurante'}.png"`,
      'Cache-Control': 'no-store',
    },
  })
}
