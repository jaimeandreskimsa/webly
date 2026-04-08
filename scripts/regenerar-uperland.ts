// Regenera UPERLAND con el prompt real de WeblyNow (prompts.ts)
// Uso: npx tsx scripts/regenerar-uperland.ts
import Anthropic from '@anthropic-ai/sdk'
import { Pool } from 'pg'
import { getSystemPrompt, construirPromptUsuario } from '../lib/claude/prompts'

const DB_URL = 'postgresql://postgres:czlDYMmQOAIHousOibUhsMmAQDYVleWD@maglev.proxy.rlwy.net:23088/railway'
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const SITIO_ID = '31d2a035-170a-477b-927e-05d28067f847'
const MODELO = 'claude-haiku-4-5'
const MAX_TOKENS = 12000 // más espacio para haiku

const pool = new Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } })

async function main() {
  console.log('🔍 Obteniendo datos del sitio UPERLAND...')
  const { rows } = await pool.query('SELECT * FROM sitios WHERE id = $1', [SITIO_ID])
  const sitio = rows[0]
  if (!sitio) throw new Error('Sitio no encontrado')

  const datos = sitio.contenido_json
  console.log(`📋 ${datos.nombreEmpresa} | Plan: ${datos.plan} | Logo: ${datos.logo ? '✅' : '❌'}`)
  console.log(`   Ciudad: ${datos.ciudad}`)
  console.log(`   Colores: ${datos.coloresPrimarios} / ${datos.coloresSecundarios}`)
  console.log(`   Servicios: ${datos.servicios?.filter((s: any) => s.nombre).length}`)

  // Usar los prompts reales
  const systemPrompt = getSystemPrompt(datos.plan)
  const userPrompt = construirPromptUsuario(datos)
  
  console.log(`\n📝 System prompt: ${systemPrompt.length} chars`)
  console.log(`📝 User prompt: ${userPrompt.length} chars`)
  console.log(`   Logo en prompt: ${userPrompt.includes(datos.logo) ? '✅' : '❌'}`)

  // Marcar como generando
  await pool.query("UPDATE sitios SET estado = 'generando', updated_at = NOW() WHERE id = $1", [SITIO_ID])
  console.log('\n⚡ Estado → generando')

  const { rows: vRows } = await pool.query(
    'SELECT COALESCE(MAX(numero_version), 0) as max_v FROM versiones_sitio WHERE sitio_id = $1',
    [SITIO_ID]
  )
  const nuevaVersion = parseInt(vRows[0].max_v) + 1
  console.log(`📦 Nueva versión: ${nuevaVersion}`)

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

  console.log(`\n🤖 Generando con ${MODELO} (max ${MAX_TOKENS} tokens)...`)
  let htmlAcumulado = ''

  const stream = client.messages.stream({
    model: MODELO,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  let dotsCount = 0
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      htmlAcumulado += event.delta.text
      dotsCount++
      if (dotsCount % 150 === 0) process.stdout.write('.')
    }
  }

  const finalMsg = await stream.finalMessage()
  const tokensUsados = finalMsg.usage.input_tokens + finalMsg.usage.output_tokens
  console.log(`\n✅ ${htmlAcumulado.length} chars | ${tokensUsados} tokens (in:${finalMsg.usage.input_tokens} / out:${finalMsg.usage.output_tokens})`)

  // Extraer HTML limpio
  let html = htmlAcumulado
  const matchCode = html.match(/```html\n?([\s\S]*?)```/)
  if (matchCode) html = matchCode[1].trim()
  const matchDoctype = html.match(/(<!DOCTYPE[\s\S]*)/i)
  if (matchDoctype) html = matchDoctype[1].trim()

  if (!html.includes('<html') && !html.includes('<!DOCTYPE')) {
    throw new Error('HTML inválido — no tiene DOCTYPE ni <html>')
  }

  // Verificar logo en HTML
  const tieneLogoEnHTML = html.includes('cloudinary') || html.includes(datos.logo?.substring(0, 40) || 'NO-LOGO')
  console.log(`   Logo en HTML: ${tieneLogoEnHTML ? '✅' : '⚠️ no encontrado'}`)
  console.log(`   <img> tags: ${(html.match(/<img/gi) || []).length}`)
  console.log(`   Unsplash: ${html.includes('unsplash') ? '✅' : '❌'}`)
  console.log(`   AOS: ${html.includes('aos') ? '✅' : '❌'}`)

  // Guardar versión
  await pool.query("UPDATE versiones_sitio SET es_actual = false WHERE sitio_id = $1", [SITIO_ID])
  await pool.query(
    `INSERT INTO versiones_sitio (sitio_id, numero_version, html_completo, es_actual, modelo_usado, tokens_usados)
     VALUES ($1, $2, $3, true, $4, $5)`,
    [SITIO_ID, nuevaVersion, html, MODELO, tokensUsados]
  )

  await pool.query(
    "UPDATE sitios SET estado = 'borrador', total_ediciones = $1, ultima_edicion = NOW(), updated_at = NOW() WHERE id = $2",
    [nuevaVersion, SITIO_ID]
  )

  console.log(`\n🚀 UPERLAND regenerado. Versión ${nuevaVersion}.`)
  console.log(`   → https://app.weblynow.com/dashboard/sitios/${SITIO_ID}`)
  await pool.end()
}

main().catch(async e => {
  console.error('❌ Error:', e.message)
  await pool.query("UPDATE sitios SET estado = 'error', updated_at = NOW() WHERE id = $1", [SITIO_ID]).catch(() => {})
  await pool.end()
  process.exit(1)
})
