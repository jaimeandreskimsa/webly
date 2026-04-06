import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { configuracion } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { invalidateConfig } from '@/lib/config'

// ─── Masks a secret value showing only first 4 and last 4 chars ──────────────
function maskSecret(value: string): string {
  if (!value) return ''
  if (value.length <= 8) return '●'.repeat(value.length)
  return value.slice(0, 4) + '●'.repeat(Math.min(value.length - 8, 28)) + value.slice(-4)
}

// ─── GET: Return all config, masking secrets ──────────────────────────────────
export async function GET() {
  const session = await auth()
  if (!session?.user || (session.user as any).rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const rows = await db.select().from(configuracion).orderBy(configuracion.clave)

  const masked = rows.map(r => ({
    ...r,
    valor: r.tipo === 'secret' && r.valor ? maskSecret(r.valor) : r.valor,
  }))

  return NextResponse.json(masked)
}

// ─── PUT: Upsert config entries ───────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as any).rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await req.json() as {
    entries: Array<{
      clave: string
      valor: string
      tipo?: string
      descripcion?: string
    }>
  }

  const userId = (session.user as any).id

  for (const entry of body.entries) {
    // No actualizar secrets si el valor está enmascarado (no cambió)
    if (entry.tipo === 'secret' && entry.valor.includes('●')) continue
    // No guardar valores vacíos en secrets
    if (entry.tipo === 'secret' && !entry.valor.trim()) continue

    await db
      .insert(configuracion)
      .values({
        clave: entry.clave,
        valor: entry.valor.trim(),
        tipo: entry.tipo ?? 'string',
        descripcion: entry.descripcion ?? null,
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .onConflictDoUpdate({
        target: configuracion.clave,
        set: {
          valor: entry.valor.trim(),
          updatedAt: new Date(),
          updatedBy: userId,
        },
      })

    invalidateConfig(entry.clave)
  }

  return NextResponse.json({ ok: true })
}
