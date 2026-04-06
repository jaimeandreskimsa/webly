import { db } from './db'
import { configuracion } from './db/schema'
import { eq } from 'drizzle-orm'

// ─── Cache en memoria con TTL de 5 minutos ────────────────────────────────────
const _cache = new Map<string, { value: string; ts: number }>()
const TTL = 5 * 60 * 1000 // 5 min

export async function getConfig(clave: string, fallback = ''): Promise<string> {
  const hit = _cache.get(clave)
  if (hit && Date.now() - hit.ts < TTL) return hit.value

  try {
    const rows = await db
      .select({ valor: configuracion.valor })
      .from(configuracion)
      .where(eq(configuracion.clave, clave))
      .limit(1)
    const value = rows[0]?.valor ?? fallback
    _cache.set(clave, { value, ts: Date.now() })
    return value
  } catch {
    return fallback
  }
}

export async function getAllConfig(): Promise<Record<string, string>> {
  try {
    const rows = await db.select().from(configuracion)
    const map: Record<string, string> = {}
    rows.forEach(r => { map[r.clave] = r.valor })
    return map
  } catch {
    return {}
  }
}

export function invalidateConfig(clave?: string) {
  if (clave) _cache.delete(clave)
  else _cache.clear()
}

/** Devuelve true si el valor de una clave secret es válido (no está enmascarado ni vacío) */
export function isValidSecret(value: string): boolean {
  return Boolean(value) && !value.includes('●')
}
