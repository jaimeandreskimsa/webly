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

// ─── Env var fallbacks para cuando la DB no tiene valores ────────────────────
const ENV_FALLBACKS: Record<string, { valor: string; tipo: string; descripcion: string }> = {
  anthropic_api_key:      { valor: process.env.ANTHROPIC_API_KEY || '',      tipo: 'secret', descripcion: 'Anthropic Claude API Key' },
  fal_api_key:            { valor: process.env.FAL_API_KEY || '',             tipo: 'secret', descripcion: 'fal.ai API Key' },
  flow_api_key:           { valor: process.env.FLOW_API_KEY || '',            tipo: 'secret', descripcion: 'Flow.cl API Key' },
  flow_secret_key:        { valor: process.env.FLOW_SECRET_KEY || '',         tipo: 'secret', descripcion: 'Flow.cl Secret Key' },
  flow_sandbox:           { valor: process.env.FLOW_SANDBOX || 'false',       tipo: 'string', descripcion: 'Flow modo sandbox' },
  cloudinary_cloud_name:  { valor: process.env.CLOUDINARY_CLOUD_NAME || '',   tipo: 'string', descripcion: 'Cloudinary Cloud Name' },
  cloudinary_api_key:     { valor: process.env.CLOUDINARY_API_KEY || '',      tipo: 'secret', descripcion: 'Cloudinary API Key' },
  cloudinary_api_secret:  { valor: process.env.CLOUDINARY_API_SECRET || '',   tipo: 'secret', descripcion: 'Cloudinary API Secret' },
}

// ─── GET: Return all config, masking secrets ──────────────────────────────────
export async function GET() {
  const session = await auth()
  if (!session?.user || (session.user as any).rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const rows = await db.select().from(configuracion).orderBy(configuracion.clave)

  // Construir mapa de lo que hay en DB
  const dbMap = new Map(rows.map(r => [r.clave, r]))

  // Mezclar: DB tiene prioridad, si no existe usar env fallback
  const resultado: Array<{
    clave: string; valor: string; tipo: string; descripcion: string | null
  }> = []

  // Primero los que vienen de env (para que siempre aparezcan)
  for (const [clave, fallback] of Object.entries(ENV_FALLBACKS)) {
    const dbRow = dbMap.get(clave)
    const valor = dbRow?.valor || fallback.valor
    const tipo  = dbRow?.tipo  || fallback.tipo
    resultado.push({
      clave,
      valor: tipo === 'secret' && valor ? maskSecret(valor) : valor,
      tipo,
      descripcion: dbRow?.descripcion ?? fallback.descripcion,
    })
    dbMap.delete(clave) // quitar para no duplicar
  }

  // Luego el resto que solo está en DB
  for (const row of dbMap.values()) {
    resultado.push({
      clave: row.clave,
      valor: row.tipo === 'secret' && row.valor ? maskSecret(row.valor) : row.valor,
      tipo: row.tipo,
      descripcion: row.descripcion ?? null,
    })
  }

  return NextResponse.json(resultado)
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
