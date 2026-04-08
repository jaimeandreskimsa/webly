#!/usr/bin/env node
// Script para generar sitio demo directamente via Claude API y guardar en DB producción
import Anthropic from '@anthropic-ai/sdk'
import pg from 'pg'

const SITIO_ID = 'a619a256-5d6c-4efe-be29-4f2cfe31e04c'
const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:czlDYMmQOAIHousOibUhsMmAQDYVleWD@maglev.proxy.rlwy.net:23088/railway'
const API_KEY = process.env.ANTHROPIC_API_KEY

const pool = new pg.Pool({ connectionString: DB_URL, ssl: false })

// Obtener contenidoJson del sitio
const { rows: [sitio] } = await pool.query(
  'SELECT contenido_json FROM sitios WHERE id = $1', [SITIO_ID]
)
if (!sitio) { console.error('Sitio no encontrado'); process.exit(1) }

const datos = sitio.contenido_json
console.log(`Generando sitio para: ${datos.nombreEmpresa} (plan ${datos.plan})`)
console.log('Llamando a Claude API con streaming...\n')

// System prompt (premium)
const systemPrompt = `Eres un experto desarrollador web frontend de nivel internacional y experto en SEO técnico. Creas sitios web que compiten con las mejores agencias del mundo: multipágina, ultra-rápidos visualmente, con animaciones de cine y completamente optimizados para posicionarse en Google.

## STACK OBLIGATORIO
- HTML5 semántico con Schema.org microdata
- CSS3 avanzado: custom properties, animations, clip-path, filters, mix-blend-mode
- JavaScript ES6+ avanzado
- **GSAP 3.12** + **ScrollTrigger** + **CustomEase** para animaciones cinematográficas
- **Locomotive Scroll 4** para scroll ultra suave con parallax nativo
- Partículas CSS puras en hero (sin librería extra — más ligero)
- Swiper.js 11 con efectos creative/coverflow
- Google Fonts: 2 fuentes premium (display + body)
- Phosphor Icons

## CDNs A INCLUIR
\`\`\`html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/locomotive-scroll@4.1.4/dist/locomotive-scroll.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/CustomEase.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/locomotive-scroll@4.1.4/dist/locomotive-scroll.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
<script src="https://unpkg.com/@phosphor-icons/web"></script>
\`\`\`

## ARQUITECTURA MULTIPÁGINA OBLIGATORIA
4 páginas manejadas con router SPA (hash + history.pushState):
- **inicio** → Home épico
- **servicios** → Servicios / Productos detallados
- **nosotros** → Historia, equipo, valores
- **contacto** → Formulario avanzado + mapa

El menú resalta la página activa. Al cambiar de página: transición suave con GSAP (fade + translateY). window.scrollTo(0,0) + ScrollTrigger.refresh() al navegar.

## FORMATO DE ENTREGA
Un único archivo index.html completo, autocontenido.
CSS en <style> en <head>, JS al final del <body>.
El sitio debe funcionar abriendo directamente en el navegador.
No uses markdown code blocks. Devuelve SOLO el HTML.`

// User prompt
const serviciosTexto = datos.servicios
  .filter(s => s.nombre)
  .map(s => `- ${s.nombre}${s.precio ? ` (${s.precio})` : ''}: ${s.descripcion}`)
  .join('\n')

const redesTexto = Object.entries(datos.redesSociales)
  .filter(([_, v]) => v)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join('\n') || 'No proporcionadas'

const userPrompt = `
Crea un sitio web de NIVEL AGENCIA PREMIUM para este negocio chileno. El resultado debe verse tan profesional que el cliente no pueda creer que lo generó una IA.

## DATOS DEL NEGOCIO
**Empresa:** ${datos.nombreEmpresa}
**Rubro:** ${datos.rubro}
**Ciudad:** ${datos.ciudad || 'Chile'}
**Descripción:** ${datos.descripcion}
**Propuesta de valor:** ${datos.propuestaValor || 'Calidad y profesionalismo'}

## SERVICIOS
${serviciosTexto}

## CONTACTO
- Teléfono: ${datos.telefono}
- Email: ${datos.email}
- Dirección: ${datos.direccion}
- Horario: ${datos.horario}

## REDES SOCIALES
${redesTexto}

## PREFERENCIAS VISUALES
- Colores primarios: ${datos.coloresPrimarios}
- Colores secundarios: ${datos.coloresSecundarios}
- Estilo: ${datos.tipoDiseno}
- Tipografía: ${datos.tipografia}

## INSTRUCCIONES
- Usa la paleta EXACTA del cliente
- WhatsApp: ${datos.redesSociales?.whatsapp || datos.telefono} en botón flotante y CTAs
- Haz el sitio responsive perfecto: mobile, tablet, desktop
- Imágenes de Unsplash relevantes al rubro cafetería/pastelería
- Sin logo → crear tipográfico con las iniciales

Genera el HTML COMPLETO. Que sea absolutamente impresionante.
`

const client = new Anthropic({ apiKey: API_KEY })
let html = ''
let chars = 0

const stream = client.messages.stream({
  model: 'claude-sonnet-4-6',
  max_tokens: 64000,
  system: systemPrompt,
  messages: [{ role: 'user', content: userPrompt }],
})

for await (const event of stream) {
  if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
    html += event.delta.text
    chars += event.delta.text.length
    process.stdout.write(`\r  Generando... ${chars.toLocaleString()} chars`)
  }
}

const finalMsg = await stream.finalMessage()
const tokens = finalMsg.usage.input_tokens + finalMsg.usage.output_tokens
console.log(`\n\n  Generación completa: ${chars.toLocaleString()} chars, ${tokens.toLocaleString()} tokens`)

// Extraer HTML limpio
let cleanHtml = html
const matchCode = html.match(/```html\n?([\s\S]*?)```/)
if (matchCode) cleanHtml = matchCode[1].trim()
else {
  const matchDoctype = html.match(/(<!DOCTYPE[\s\S]*)/i)
  if (matchDoctype) cleanHtml = matchDoctype[1].trim()
}

// Guardar en DB
console.log('  Guardando en DB de producción...')

const { rows: [{ maxv }] } = await pool.query(
  'SELECT COALESCE(MAX(numero_version), 0) as maxv FROM versiones_sitio WHERE sitio_id = $1', [SITIO_ID]
)
const nuevaVersion = maxv + 1

await pool.query(
  'UPDATE versiones_sitio SET es_actual = false WHERE sitio_id = $1', [SITIO_ID]
)

await pool.query(
  `INSERT INTO versiones_sitio (sitio_id, numero_version, html_completo, es_actual, modelo_usado, tokens_usados)
   VALUES ($1, $2, $3, true, 'claude-sonnet-4-6', $4)`,
  [SITIO_ID, nuevaVersion, cleanHtml, tokens]
)

await pool.query(
  `UPDATE sitios SET estado = 'borrador', total_ediciones = $1, ultima_edicion = NOW(), updated_at = NOW()
   WHERE id = $2`,
  [nuevaVersion, SITIO_ID]
)

console.log(`  Version ${nuevaVersion} guardada. Estado: borrador`)
console.log(`\n  Listo! Ve a: https://app.weblynow.com/dashboard/sitios/${SITIO_ID}`)

await pool.end()
