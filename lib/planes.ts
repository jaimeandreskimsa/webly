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
 * Devuelve el precio de un plan leyendo primero la configuración guardada en DB
 * por el superadmin. Usa PLAN_PRECIOS como fallback si no hay configuración.
 */
export async function getPrecioPlan(planId: string): Promise<number> {
  try {
    const [row] = await db
      .select()
      .from(configuracion)
      .where(eq(configuracion.clave, CONFIG_KEY))
      .limit(1)

    if (row?.valor) {
      const planes = JSON.parse(row.valor) as PlanConfigLite[]
      const found = planes.find(p => p.id === planId)
      if (found && found.precio > 0) return found.precio
    }
  } catch {}

  return PLAN_PRECIOS[planId as keyof typeof PLAN_PRECIOS] ?? 0
}
