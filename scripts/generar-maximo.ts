import { db, sitios, usuarios } from '../lib/db/index'
import { eq, ilike } from 'drizzle-orm'
import { generarEnBackground } from '../lib/generar'
import type { DatosWizard } from '../components/wizard/WizardCreacion'

async function main() {
  console.log('🔍 Buscando usuario Maximo Crusizio...')

  const [usuario] = await db
    .select()
    .from(usuarios)
    .where(ilike(usuarios.email, '%maximocrusizio%'))
    .limit(1)

  if (!usuario) {
    console.error('❌ Usuario no encontrado: maximocrusizio@gmail.com')
    process.exit(1)
  }

  console.log(`✅ Usuario encontrado: ${usuario.nombre} (${usuario.email}) — ID: ${usuario.id}`)

  const todosSitios = await db
    .select()
    .from(sitios)
    .where(eq(sitios.userId, usuario.id))

  if (todosSitios.length === 0) {
    console.error('❌ No tiene sitios creados')
    process.exit(1)
  }

  console.log(`📋 Sitios encontrados (${todosSitios.length}):`)
  todosSitios.forEach(s => {
    const updatedAt = s.updatedAt ? new Date(s.updatedAt).toLocaleString('es-CL') : '—'
    console.log(`   - [${s.id}] "${s.nombre}" | plan: ${s.plan} | estado: ${s.estado} | actualizado: ${updatedAt}`)
  })

  // Elegir el más reciente con datos
  const candidato = todosSitios
    .filter(s => {
      const datos = s.contenidoJson as unknown as DatosWizard
      return datos?.plan && datos?.nombreEmpresa
    })
    .sort((a, b) => new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() - new Date(a.updatedAt ?? a.createdAt ?? 0).getTime())[0]

  if (!candidato) {
    console.error('❌ Ningún sitio tiene datos de configuración (contenidoJson vacío)')
    process.exit(1)
  }

  const datos = candidato.contenidoJson as unknown as DatosWizard
  console.log(`\n🚀 Generando sitio: "${candidato.nombre}" (${candidato.id})`)
  console.log(`   Plan: ${datos.plan}`)
  console.log(`   Empresa: ${datos.nombreEmpresa}`)
  console.log(`   Estado actual: ${candidato.estado}`)
  console.log('\n⏳ Disparando generación en background...')

  // Marcar como generando de inmediato para dar feedback visual
  await db.update(sitios)
    .set({ estado: 'generando', updatedAt: new Date() })
    .where(eq(sitios.id, candidato.id))

  // Esperar a que termine (máx 5 min)
  generarEnBackground(candidato.id, datos)

  // Polling hasta que termine
  const inicio = Date.now()
  const MAX_ESPERA = 5 * 60 * 1000
  let intentos = 0

  while (Date.now() - inicio < MAX_ESPERA) {
    await new Promise(r => setTimeout(r, 8000))
    intentos++
    const [actual] = await db.select({ estado: sitios.estado }).from(sitios).where(eq(sitios.id, candidato.id)).limit(1)
    const elapsed = Math.round((Date.now() - inicio) / 1000)
    console.log(`   [${elapsed}s] Estado: ${actual?.estado}`)

    if (actual?.estado === 'borrador' || actual?.estado === 'publicado') {
      console.log(`\n✅ ¡Sitio generado exitosamente en ${elapsed}s!`)
      console.log(`   Ver en: /dashboard/sitios/${candidato.id}`)
      process.exit(0)
    }
    if (actual?.estado === 'error') {
      console.error(`\n❌ La generación falló (estado: error)`)
      process.exit(1)
    }
  }

  console.error('\n⏱️ Timeout: La generación tardó más de 5 minutos')
  console.log(`   Verificar manualmente en /admin/sitios`)
  process.exit(1)
}

main().catch(e => {
  console.error('Error fatal:', e)
  process.exit(1)
})
