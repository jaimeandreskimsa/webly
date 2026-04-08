/**
 * Regenera UPERLAND con el SYSTEM_PROMPT_BASICO real de WeblyNow.
 * Usa 12k tokens y claude-haiku-4-5 para que el logo y AOS funcionen.
 * Ejecutar: node scripts/regenerar-uperland.mjs
 */
import Anthropic from '@anthropic-ai/sdk'
import pg from 'pg'
const { Pool } = pg

const DB_URL    = 'postgresql://postgres:czlDYMmQOAIHousOibUhsMmAQDYVleWD@maglev.proxy.rlwy.net:23088/railway'
const API_KEY   = process.env.ANTHROPIC_API_KEY
const SITIO_ID  = '31d2a035-170a-477b-927e-05d28067f847'
const MODELO    = 'claude-sonnet-4-6'
const MAX_TOKENS = 60000

// ─── SYSTEM_PROMPT_BASICO (copiado exacto de lib/claude/prompts.ts) ──────────
const SYSTEM_PROMPT_BASICO = `
Eres un experto desarrollador web frontend especializado en crear landing pages modernas y efectivas para pequeñas y medianas empresas de Chile y Latinoamérica.

## STACK OBLIGATORIO
- HTML5 semántico
- CSS3 con variables CSS, Flexbox y Grid
- JavaScript vanilla (ES6+)
- AOS.js 2.3.1 para animaciones de scroll
- Swiper.js 11 para sliders (si aplica)
- Google Fonts: selecciona 2 fuentes apropiadas para el rubro
- Lucide Icons via CDN para iconografía

## CDNs A INCLUIR
\`\`\`html
<link rel="stylesheet" href="https://unpkg.com/aos@2.3.1/dist/aos.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css">
<script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
<script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
\`\`\`

## ESTRUCTURA OBLIGATORIA (1 página)
1. **Header** sticky con logo y navegación suave
2. **Hero** con headline impactante, subtítulo y 2 CTAs
3. **Sobre nosotros** con propuesta de valor
4. **Servicios** en grid de cards (3 cols desktop)
5. **Por qué elegirnos** con íconos y datos
6. **Contacto** con formulario funcional (validación JS) + mapa embed
7. **Footer** completo con links y redes sociales

## REGLAS DE ANIMACIÓN (AOS)
- Cada sección revela contenido con data-aos="fade-up"
- Cards con data-aos="zoom-in" y data-aos-delay escalonado
- Inicializar con: AOS.init({ duration: 800, once: true })

## REGLAS DE DISEÑO
- Mobile-first siempre (responsive perfecto)
- Paleta coherente con los colores del cliente
- Spacing generoso: padding mínimo 80px en secciones desktop
- Tipografía fluida con clamp()
- Imágenes: usa Unsplash (https://images.unsplash.com/) para stock de alta calidad
- Selecciona imágenes relevantes al rubro con keywords específicas
- Header sticky con backdrop-filter: blur
- Hover effects suaves en todos los elementos interactivos
- Scroll suave con scroll-behavior: smooth

## SISTEMA DE TOKENS CSS (OBLIGATORIO — define en :root al inicio del <style>)
\`\`\`css
:root {
  --primary: #[color-primario];
  --primary-rgb: R, G, B;
  --secondary: #[color-secundario];
  --accent: #[color-acento-CTAs];
  --bg: #ffffff;
  --bg-alt: #f8f9fa;
  --bg-dark: #111827;
  --text: #111827;
  --text-muted: #6b7280;
  --font-display: '[fuente-elegida]', sans-serif;
  --font-body: '[fuente-cuerpo]', sans-serif;
  --text-hero: clamp(2.5rem, 6vw, 4rem);
  --text-h2: clamp(1.75rem, 4vw, 2.75rem);
  --text-h3: clamp(1.25rem, 2.5vw, 1.6rem);
  --text-body: clamp(0.95rem, 1.8vw, 1.1rem);
  --section-py: clamp(60px, 8vw, 100px);
  --container: min(1200px, 90vw);
  --radius-card: 16px;
  --shadow-card: 0 4px 20px rgba(0,0,0,0.08);
  --shadow-colored: 0 8px 24px rgba(var(--primary-rgb), 0.22);
}
[data-theme="dark"] { --bg: #0f172a; --bg-alt: #1e293b; --text: #f1f5f9; --text-muted: #94a3b8; }
\`\`\`

## VARIACIÓN DE FONDOS OBLIGATORIA
Alterna los fondos de las secciones para crear contraste visual:
- **Header + Hero**: fondo oscuro o imagen de fondo
- **Sobre nosotros**: var(--bg) blanco
- **Servicios**: var(--bg-alt) gris muy claro
- **Por qué elegirnos**: sección oscura (var(--bg-dark) o var(--primary) con texto blanco)
- **Contacto**: var(--bg) o var(--bg-alt)
- **Footer**: fondo muy oscuro (#0a0a0f)

## ANTI-PATRONES PROHIBIDOS ❌
- ❌ Hero con fondo blanco liso y texto negro — siempre imagen de fondo, gradiente o color oscuro
- ❌ Ignorar la paleta del cliente y usar azul/gris por defecto — USA los colores exactos provistos
- ❌ Todas las secciones con el mismo fondo blanco
- ❌ Botones sin transición ni efecto :hover
- ❌ Texto genérico "Servicio 1", "Descripción aquí", "Lorem ipsum"
- ❌ Footer vacío
- ❌ Imágenes con URL genérica
- ❌ Una sola tipografía uniforme
- ❌ Cards sin hover state
- ❌ Inputs sin estado :focus visible ni validación visual
- ❌ Secciones sin separación visual

## LOGO DEL CLIENTE
- Si se proporciona una URL de logo, SIEMPRE úsala en el <img> del header y en el footer.
- El logo debe mostrarse con max-height: 50px en el header y max-height: 40px en el footer.
- No uses texto como logo si hay URL disponible.

## IMÁGENES UNSPLASH
- En el hero, usa una imagen de Unsplash relevante al rubro (construcción / inmobiliaria / bienes raíces).
- Para cada sección, usa imágenes de Unsplash con keywords específicos: construction, real estate, luxury property, building architecture, modern home.
- URLs de Unsplash: https://images.unsplash.com/photo-[ID]?w=1600&q=80

## FORMATO DE ENTREGA
- Un único archivo index.html completo y autocontenido
- Todo el CSS dentro de <style> en el <head>
- Todo el JS dentro de <script> al final del <body>
- NO uses frameworks como React/Vue/Angular
- El HTML debe funcionar abriendo el archivo directamente en el navegador
`

// ─── Construir user prompt para UPERLAND ─────────────────────────────────────
function construirPromptUperland(datos) {
  const servicios = (datos.servicios || [])
    .filter(s => s && s.nombre)
    .map((s, i) => `${i + 1}. **${s.nombre}**: ${s.descripcion || ''}${s.precio ? ` — Precio: ${s.precio}` : ''}`)
    .join('\n')

  const redes = Object.entries(datos.redesSociales || {})
    .filter(([, v]) => v)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n') || 'No proporcionadas'

  const whatsapp = datos.redesSociales?.whatsapp || datos.telefono || ''

  const logoTexto = datos.logo
    ? `Logo del cliente (OBLIGATORIO — usar en <img src="..."> en header y footer): ${datos.logo}`
    : 'Sin logo — crear tipográfico con las iniciales de la empresa'

  return `
Crea una landing page profesional y moderna para esta empresa de construcción e inmobiliaria en Orlando, Florida.

## DATOS DE LA EMPRESA

**Nombre:** ${datos.nombreEmpresa}
**Rubro:** ${datos.rubro} — Construcción e Inmobiliaria en USA
**Ciudad:** ${datos.ciudad || 'Orlando, Florida, USA'}
**Descripción:** ${datos.descripcion || `Empresa líder en construcción y bienes raíces en ${datos.ciudad || 'Orlando, Florida'}`}
**Propuesta de valor:** ${datos.propuestaValor || 'Construcción de alta calidad y gestión inmobiliaria profesional en Florida'}

## DATOS DE CONTACTO
- Teléfono / WhatsApp: ${datos.telefono || datos.redesSociales?.whatsapp || 'No proporcionado'}
- Email: ${datos.email || 'No proporcionado'}
- Dirección: ${datos.direccion || datos.ciudad || 'Orlando, Florida, USA'}
- Horario: ${datos.horario || 'Lunes a Viernes 9:00 AM - 6:00 PM EST'}

## REDES SOCIALES
${redes}

## SERVICIOS (usar todos en la sección de servicios)
${servicios || 'Construcción residencial, Remodelación, Inversión inmobiliaria, Consultoría de proyectos'}

## PREFERENCIAS VISUALES
- Colores primarios: ${datos.coloresPrimarios || '#1a3c5e'}
- Colores secundarios: ${datos.coloresSecundarios || '#c9a84c'}
- Estilo de diseño: ${datos.tipoDiseno || 'moderno'} — ${datos.estilo || 'profesional y elegante'}
- Tipografía: ${datos.tipografia || 'Moderna y profesional'}

## LOGO E IMÁGENES
${logoTexto}
Sin imágenes propias adicionales — usa Unsplash con keywords de construcción y bienes raíces en Florida: "construction site", "luxury real estate florida", "modern building architecture", "new home construction", "property investment"

## BOTÓN WHATSAPP FLOTANTE
Número WhatsApp: ${whatsapp.replace(/\D/g, '') || '17863672343'} (sin espacios ni +)
Incluir botón flotante fijo bottom-right con animación pulse verde (#25D366)

## INSTRUCCIONES ESPECIALES
1. El hero debe tener una imagen de fondo de alta calidad de Unsplash (construcción / bienes raíces), oscurecida con overlay, con el logo del cliente visible en el header
2. El mercado objetivo es USA (inglés-americano puede mezclarse con español si aplica, ya que el dueño es latinoamericano en USA)
3. Los precios y medidas en USD y pies cuadrados
4. Sección "Sobre Nosotros" mencionando que son una empresa latina operando en Florida con estándares USA
5. Incluir sección de proceso de trabajo: Consulta → Diseño → Construcción → Entrega
6. CTA final con botón de WhatsApp y formulario de contacto

## INSTRUCCIONES ANTI-PATRONES
- NO usar cursor personalizado que siga al mouse
- NO usar efectos tilt 3D en cards
- Hovers simples: scale, sombra, cambio de color
`
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const pool = new Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } })

async function main() {
  console.log('🔍 Obteniendo datos del sitio UPERLAND...')
  const { rows } = await pool.query('SELECT * FROM sitios WHERE id = $1', [SITIO_ID])
  const sitio = rows[0]
  if (!sitio) throw new Error('Sitio no encontrado')

  const datos = sitio.contenido_json
  console.log(`📋 ${datos.nombreEmpresa} | Plan: ${datos.plan}`)
  console.log(`   Ciudad: ${datos.ciudad}`)
  console.log(`   Logo: ${datos.logo ? '✅ ' + datos.logo.substring(0, 60) + '...' : '❌ Sin logo'}`)
  console.log(`   Servicios: ${(datos.servicios || []).filter(s => s?.nombre).length}`)
  console.log(`   WhatsApp: ${datos.redesSociales?.whatsapp || datos.telefono || 'N/A'}`)

  const userPrompt = construirPromptUperland(datos)
  console.log(`\n📝 System prompt: ${SYSTEM_PROMPT_BASICO.length} chars`)
  console.log(`📝 User prompt: ${userPrompt.length} chars`)
  console.log(`   Logo en user prompt: ${userPrompt.includes(datos.logo?.substring(0, 40) || 'NO') ? '✅' : '❌'}`)

  // Marcar como generando
  await pool.query("UPDATE sitios SET estado = 'generando', updated_at = NOW() WHERE id = $1", [SITIO_ID])
  console.log('\n⚡ Estado → generando')

  const { rows: vRows } = await pool.query(
    'SELECT COALESCE(MAX(numero_version), 0) as max_v FROM versiones_sitio WHERE sitio_id = $1',
    [SITIO_ID]
  )
  const nuevaVersion = parseInt(vRows[0].max_v) + 1
  console.log(`📦 Nueva versión: ${nuevaVersion}`)

  const client = new Anthropic({ apiKey: API_KEY })
  console.log(`\n🤖 Generando con ${MODELO} (max ${MAX_TOKENS} tokens)...`)

  let htmlAcumulado = ''
  const stream = client.messages.stream({
    model: MODELO,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT_BASICO,
    messages: [{ role: 'user', content: userPrompt }],
  })

  let chars = 0
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      htmlAcumulado += event.delta.text
      chars += event.delta.text.length
      if (chars % 3000 < event.delta.text.length) process.stdout.write('.')
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
    console.error('⚠️ HTML incompleto — primeros 200 chars:')
    console.error(html.substring(0, 200))
    throw new Error('HTML inválido — no tiene DOCTYPE ni <html>')
  }

  // Diagnóstico del HTML generado
  const imgTags = (html.match(/<img/gi) || []).length
  const hasLogo = html.includes('cloudinary') || html.includes('res.cloudinary')
  const hasUnsplash = html.includes('unsplash')
  const hasAOS = html.includes('aos')
  const hasSwiper = html.includes('swiper')
  const hasWhatsApp = html.includes('wa.me')
  console.log(`\n📊 Análisis del HTML generado:`)
  console.log(`   Logo (cloudinary): ${hasLogo ? '✅' : '⚠️ no encontrado'}`)
  console.log(`   <img> tags: ${imgTags}`)
  console.log(`   Unsplash: ${hasUnsplash ? '✅' : '❌'}`)
  console.log(`   AOS.js: ${hasAOS ? '✅' : '❌'}`)
  console.log(`   Swiper: ${hasSwiper ? '✅' : 'N/A'}`)
  console.log(`   WhatsApp float: ${hasWhatsApp ? '✅' : '❌'}`)

  if (!hasLogo) {
    console.log(`   ⚠️ Logo no insertado por Claude. Inyectando manualmente...`)
    // Inyectar logo en el header si Claude no lo incluyó
    const logoUrl = datos.logo
    html = html.replace(
      /<header[^>]*>([\s\S]*?)<\/header>/i,
      (match) => {
        if (match.includes('cloudinary')) return match
        // Insertar img tag con el logo al inicio del header
        return match.replace(
          /(<header[^>]*>)/i,
          `$1\n    <!-- Logo inyectado por script -->\n    <img src="${logoUrl}" alt="${datos.nombreEmpresa}" style="max-height:50px;display:block;">`
        )
      }
    )
    console.log(`   Logo inyectado manualmente ✅`)
  }

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
  console.error('\n❌ Error:', e.message)
  await pool.query("UPDATE sitios SET estado = 'error', updated_at = NOW() WHERE id = $1", [SITIO_ID]).catch(() => {})
  await pool.end()
  process.exit(1)
})
