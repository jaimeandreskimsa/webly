import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db, sitios } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { generarEnBackground, genStore } from '@/lib/generar'
import type { DatosWizard } from '@/components/wizard/WizardCreacion'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as any).rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { sitioId, accion } = await req.json()

  if (accion === 'regenerar') {
    const [sitio] = await db.select().from(sitios).where(eq(sitios.id, sitioId)).limit(1)
    if (!sitio) return NextResponse.json({ error: 'Sitio no encontrado' }, { status: 404 })

    const datos = sitio.contenidoJson as unknown as DatosWizard
    if (!datos?.plan) return NextResponse.json({ error: 'Sitio sin datos de configuración' }, { status: 400 })

    // Evitar doble generación si ya está corriendo
    const existing = genStore.get(sitioId)
    if (existing?.status !== 'running') {
      generarEnBackground(sitioId, datos) // fire-and-forget
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
