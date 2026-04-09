import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { db } from '../lib/db/index'
import { sitios } from '../lib/db/schema'
import { eq, ilike } from 'drizzle-orm'

async function main() {
  // Buscar sitio atascado
  const lista = await db
    .select({ id: sitios.id, nombre: sitios.nombre, estado: sitios.estado, updatedAt: sitios.updatedAt })
    .from(sitios)
    .where(ilike(sitios.nombre, '%aurora%'))

  console.log('Sitios encontrados:', JSON.stringify(lista, null, 2))

  if (lista.length === 0) {
    console.log('No se encontró ningún sitio con "aurora" en el nombre')
    process.exit(0)
  }

  // Resetear todos los que estén en generando
  const atascados = lista.filter(s => s.estado === 'generando')
  if (atascados.length === 0) {
    console.log('Ninguno está en estado generando. Estados actuales:', lista.map(s => s.estado))
    process.exit(0)
  }

  for (const s of atascados) {
    await db
      .update(sitios)
      .set({ estado: 'error', updatedAt: new Date() })
      .where(eq(sitios.id, s.id))
    console.log(`✅ Sitio "${s.nombre}" (${s.id}) → estado cambiado a 'error'`)
  }

  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
