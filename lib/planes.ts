/**
 * Helpers para obtener configuración de planes desde BD.
 * Los precios son editables desde /admin/planes — este módulo
 * los lee desde DB (con fallback al valor hardcoded en PLAN_PRECIOS).
 */
import { db } from '@/lib/db'
import { configuracion } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { PLAN_PRECIOS } from '@/lib/utils'

const CONFIG_KEY = 'planes_config'

interface PlanConfigLite {
  id: string
  precio: number
  activo: boolean
}

/**
 * Devuelve un map {planId -> precio} leyendo desde DB.
 * Usada en el home, en el selector de planes y en crear-express.
 */
export async function getPlanesConfig(): Promise<Record<string, number>> {
  try {
    const [row] = await db
      .select()
      .from(configuracion)
      .where(eq(configuracion.clave, CONFIG_KEY))
      .limit(1)

    if (row?.valor) {
      const planes = JSON.parse(row.valor) as PlanConfigLite[]
      const map: Record<string, number> = {}
      planes.forEach(p => { if (p.precio > 0) map[p.id] = p.precio })
      return map
    }
  } catch {}

  // Fallback: usar PLAN_PRECIOS hardcodeados
  return { ...PLAN_PRECIOS } as Record<string, number>
}

/**
 * Devuelve el precio de un plan leyendo primero la configuración guardada en DB
 * por el superadmin. Usa PLAN_PRECIOS como fallback si no hay configuración.
 */
export async function getPrecioPlan(planId: string): Promise<number> {
  const precios = await getPlanesConfig()
  return precios[planId] ?? (PLAN_PRECIOS[planId as keyof typeof PLAN_PRECIOS] ?? 0)
}
