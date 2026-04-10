import { db, usuarios, sitios } from '../lib/db'
import { eq } from 'drizzle-orm'

const EMAIL = 'leo@uperland.com'
const EDICIONES_A_DAR = 10
const PLAN_LIMITE: Record<string, number> = {
  prueba: 1, basico: 1, pro: 5, premium: 5, broker: 5, restaurante: 5,
}

async function main() {
  const [usuario] = await db.select().from(usuarios).where(eq(usuarios.email, EMAIL)).limit(1)
  if (!usuario) { console.error('Usuario no encontrado'); process.exit(1) }
  console.log(`✅ ${usuario.nombre} | plan: ${usuario.plan} | id: ${usuario.id}`)

  const lista = await db.select({ id: sitios.id, nombre: sitios.nombre, plan: sitios.plan, totalEdiciones: sitios.totalEdiciones, estado: sitios.estado }).from(sitios).where(eq(sitios.userId, usuario.id))
  if (!lista.length) { console.log('Sin sitios'); process.exit(0) }

  for (const s of lista) {
    const limite = PLAN_LIMITE[s.plan ?? 'basico'] ?? 1
    const usadasActual = Math.max(0, (s.totalEdiciones ?? 1) - 1)
    // nuevoTotal = limite - EDICIONES_A_DAR → usadas hoy = max(0, limite-N-1) = 0
    const nuevoTotal = limite - EDICIONES_A_DAR
    await db.update(sitios).set({ totalEdiciones: nuevoTotal, updatedAt: new Date() }).where(eq(sitios.id, s.id))
    console.log(`  ${s.nombre}: usadas ${usadasActual}/${limite} → reset a ${nuevoTotal} (${EDICIONES_A_DAR} ediciones disponibles)`)
  }
  console.log('\n🎉 Listo.')
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
