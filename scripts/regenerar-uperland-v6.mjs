/**
 * UPERLAND v6 — 60k tokens, claude-sonnet-4-6, sin dependencias externas
 * Uso: ANTHROPIC_API_KEY="sk-ant-..." node scripts/regenerar-uperland-v6.mjs
 */
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { Pool } = require('pg')

const DB_URL = 'postgresql://postgres:czlDYMmQOAIHousOibUhsMmAQDYVleWD@maglev.proxy.rlwy.net:23088/railway'
const SITIO_ID = '31d2a035-170a-477b-927e-05d28067f847'
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY.includes('xxxx')) {
  console.error('❌ Falta ANTHROPIC_API_KEY'); process.exit(1)
}

const pool = new Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } })

const SYSTEM_PROMPT = `Eres un experto desarrollador web frontend especializado en landing pages modernas y efectivas para empresas de inversión inmobiliaria premium. Tu trabajo produce sitios que compiten con Fundrise, CrowdStreet o Arrived Homes en calidad visual.

## STACK
- HTML5 semántico + CSS3 variables + JS vanilla ES6+
- AOS.js 2.3.1 (animaciones scroll): <link rel="stylesheet" href="https://unpkg.com/aos@2.3.1/dist/aos.css"><script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
- Swiper.js 11 (testimonios): <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css"><script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
- Google Fonts: Montserrat + Inter
- Lucide Icons CDN: <script src="https://unpkg.com/lucide@latest"></script>

## TOKENS CSS OBLIGATORIOS
:root {
  --primary: #6366f1; --primary-rgb: 99,102,241;
  --secondary: #a855f7; --secondary-rgb: 168,85,247;
  --bg-dark: #0a0a1a; --bg-darker: #060612;
  --bg: #fff; --bg-alt: #f8f9fa;
  --text: #111827; --text-light: #f1f5f9; --text-muted: #94a3b8;
  --font-display: 'Montserrat',sans-serif; --font-body: 'Inter',sans-serif;
  --radius: 16px; --shadow: 0 4px 24px rgba(0,0,0,.12);
  --shadow-colored: 0 8px 32px rgba(99,102,241,.3);
  --section-py: clamp(70px,9vw,110px);
  --container: min(1200px,90vw);
}

## ESTRUCTURA (1 sola página, secciones alternas en fondo)
1. Header sticky glassmorphism + logo + nav + CTA
2. Hero ÉPICO fondo oscuro imagen+overlay+gradiente indigo
3. Stats oscuro (contadores JS animados)
4. About blanco 2 cols
5. Services fondo claro 3 cards detalladas
6. Why Us gradiente oscuro indigo→púrpura glassmorphism cards
7. Process blanco timeline 4 pasos
8. Testimonios fondo claro Swiper
9. Contact fondo claro formulario 2 cols + mapa
10. Footer muy oscuro 3 cols

## ANTI-PATRONES PROHIBIDOS
❌ Hero blanco ❌ Colores genéricos ❌ Secciones iguales ❌ Botones sin hover ❌ Texto placeholder ❌ Footer vacío ❌ Cards sin hover

## ENTREGA
Un solo index.html completo. CSS en <style>. JS al final del <body>. Sin frameworks.`

const USER_PROMPT = `Crea el sitio completo para UPERLAND — inversión inmobiliaria en Florida orientada a latinoamericanos.

EMPRESA: UPERLAND
LOGO: https://res.cloudinary.com/dtpvykrc7/image/upload/v1775657428/weblynow/51f24019-e19f-4bbc-b8e9-cd79b772a379/logo/kgmtyihgjwhlnhr6rdow.png
RUBRO: Real Estate Investment Florida, USA
CIUDAD: Orlando, Florida
EMAIL: leo@uperland.com
TELÉFONO/WHATSAPP: 7863672343 (formato wa.me: 17863672343)
DIRECCIÓN: 1743 Park Center Dr. Orlando Florida 32835
REDES: Instagram/Facebook @leosotorealtor | LinkedIn: linkedin.com/in/leonardo-soto-r-76734656

DESCRIPCIÓN: Uperland es una plataforma de inversión inmobiliaria para inversores latinoamericanos que buscan dolarizar su patrimonio en Florida, USA. Opera en tres líneas: terrenos accesibles con alta proyección (desde $15K en Interlachen e Inverness), modelos de construcción para generar ingresos pasivos, y propiedades en mercados consolidados como Orlando y Miami. Diferencial: filtra oportunidades reales, acompaña todo el proceso de forma remota, reduce complejidad y riesgo.

SERVICIOS:
1. LAND INVESTMENT desde $15,000 — Terrenos en zonas de alto crecimiento (Interlachen, Inverness). 100% remoto. Inversión pasiva, plusvalía de largo plazo.
2. BUILD & EARN — Modelos de construcción para ingresos pasivos. Uperland construye, el cliente recibe rentabilidad.
3. PREMIUM PROPERTIES — Propiedades en Orlando y Miami. Mercados consolidados, retorno estable.

COLORES: primario #6366f1 (indigo), secundario #a855f7 (púrpura)
TIPOGRAFÍA: Montserrat bold (títulos), Inter regular (cuerpo)
ESTILO: dark premium, confianza financiera, corporativo

==== SECCIONES DETALLADAS ====

### HEADER
- Logo UPERLAND: <img src="[URL logo]" alt="UPERLAND" height="44">
- Nav: Home | Services | About | Process | Contact
- Botón "Get Started" color indigo
- Hamburguesa en mobile
- Al scroll: backdrop-filter:blur(20px) + fondo rgba(10,10,26,0.9)

### HERO
- Fondo oscuro: imagen https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1920&q=80 con overlay gradient rgba(10,10,26,0.82) + toque indigo
- Headline H1: "Build Your Dollar Future in Florida Real Estate"
- Subtítulo: "Invest remotely in high-growth Florida land and properties. Simple. Secure. Dollar-denominated."
- Tagline español: "Para inversores latinoamericanos que quieren dolarizar su patrimonio"
- CTA1: "Explore Investments →" (bg indigo, hover scale 1.05 + sombra)
- CTA2: "Schedule Free Call" (border blanco, hover bg blanco texto oscuro) → wa.me/17863672343
- Partículas CSS: 15 puntos de luz flotando animados con keyframes random
- Scroll indicator pulsando abajo

### STATS (fondo #060612)
- $2.5M+ Invested Capital
- 150+ Happy Investors
- 8+ Years Experience
- 3 Active Markets
- Contadores animados con IntersectionObserver + requestAnimationFrame al entrar en viewport
- Números gigantes color indigo/púrpura, labels blancos

### ABOUT (fondo blanco)
- H2: "Your Bridge to U.S. Real Estate"
- 2 columnas: texto izq + imagen der https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80
- Descripción completa de UPERLAND
- 3 checkmarks: "100% Remote Process" | "All-Inclusive Service" | "Pre-Screened Properties"
- Botón "Learn More →" color indigo

### SERVICES (fondo #f8f9fa)
- H2: "Investment Opportunities"
- 3 cards grandes con imagen, badge, precio, descripción, beneficio clave, CTA

Card 1 — LAND INVESTMENT
- Badge "Most Popular" (bg indigo)
- Img: https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80
- Precio: "From $15,000"
- Descripción completa del servicio de terrenos
- Zonas: Interlachen, Inverness
- Beneficio: "Passive appreciation, zero management"
- CTA "Learn More →" → wa.me/17863672343

Card 2 — BUILD & EARN
- Img: https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80
- Precio: "Custom Plans"
- Descripción del modelo build & earn
- Beneficio: "We build, you earn"
- CTA "Get Quote →" → wa.me/17863672343

Card 3 — PREMIUM PROPERTIES
- Img: https://images.unsplash.com/photo-1582407947304-fd86f28f3b4b?w=600&q=80
- Precio: "Market Value"
- Descripción propiedades Orlando y Miami
- Beneficio: "Consolidated markets, stable returns"
- CTA "View Properties →" → wa.me/17863672343

Hover en cards: translateY(-8px) + shadow-colored + borde top indigo

### WHY UPERLAND (fondo gradiente lineal 135deg desde #0a0a1a a #1a0a2e)
- H2 blanco: "Why Investors Choose UPERLAND"
- 4 cards glassmorphism (bg rgba(255,255,255,0.06), border rgba(255,255,255,0.12), blur):
  1. 🌎 100% Remote Process — Invest from anywhere in Latin America
  2. 🛡 All-Inclusive Service — Due diligence, legal, title transfer — we handle everything
  3. 🎯 Pre-Screened Opportunities — Only properties with real appreciation potential
  4. 💵 Dollar-Denominated Returns — Protect your wealth from currency devaluation

### PROCESS (fondo blanco)
- H2: "How It Works"
- 4 pasos con conector visual (línea horizontal desktop, vertical mobile):
  1. "Free Strategy Call" — "30-min call to understand your goals, budget and timeline"
  2. "Property Selection" — "We present 2-3 pre-screened properties matching your profile"
  3. "Legal & Documentation" — "Our team handles all US legal requirements and closing docs"
  4. "Secure Your Investment" — "Sign remotely, transfer funds, start building your portfolio"
- Cada paso: círculo grande numerado (color indigo), ícono Lucide, título, descripción

### TESTIMONIALS (fondo #f8f9fa)
- H2: "What Investors Say"
- Swiper con 3 slides, loop:true, autoplay:{delay:4000}, pagination clickable:
  1. "Carlos M., Santiago, Chile ⭐x5" — "UPERLAND made it incredibly simple to buy land in Florida from Chile. 100% remote, 100% transparent."
  2. "Andrea R., Bogotá, Colombia ⭐x5" — "I was skeptical about investing in the US, but Leo guided me step by step. My land has appreciated 18% already."
  3. "Roberto V., Ciudad de México ⭐x5" — "Finally a company that speaks my language — literally. Got my first property in Orlando in just 6 weeks."
- Avatars: foto Unsplash random personas

### CONTACT (fondo #f1f5f9)
- H2: "Start Your Investment Journey"
- 2 columnas: formulario izq + info+mapa der

Formulario campos:
- Full Name (required)
- Email Address (required, validar formato)
- Phone / WhatsApp (required)
- Country (select: Chile, Colombia, México, Argentina, Perú, Venezuela, USA, Otro)
- Budget (select: Under $20K, $20K–$50K, $50K–$100K, $100K+)
- Message (textarea)
- Botón "Send Message →" indigo
- Al submit: validar todos los campos, mostrar div success verde con "✓ Message sent! We'll contact you within 24 hours."

Info contacto:
- 📍 1743 Park Center Dr. Orlando, FL 32835
- 📞 +1 (786) 367-2343
- ✉ leo@uperland.com
- 🕐 Available 24/7
- Botón grande WhatsApp verde: "Chat on WhatsApp →"
- Mapa Google Maps iframe de Orlando Florida:
  <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d224166.06527326688!2d-81.5158149!3d28.4811786!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88e773d8fecdbc77%3A0xac3b2063ca5bf9e!2sOrlando%2C%20FL!5e0!3m2!1ses!2sus!4v1" width="100%" height="300" style="border:0;border-radius:12px" allowfullscreen loading="lazy"></iframe>

### FOOTER (fondo #060612)
- Logo UPERLAND + tagline "Your Bridge to U.S. Real Estate"
- Borde top: gradiente indigo→púrpura 1px
- 3 columnas:
  - Company: Home, Services, About, Process, Contact
  - Services: Land Investment, Build & Earn, Premium Properties
  - Contact: dirección, tel, email + íconos redes (Instagram, Facebook, LinkedIn, WhatsApp)
- Copyright: "© 2026 UPERLAND. All rights reserved. | 1743 Park Center Dr. Orlando, FL 32835"

### WHATSAPP FLOAT
- Botón fijo bottom:28px right:28px, 58x58px, bg #25D366, border-radius:50%
- href="https://wa.me/17863672343?text=Hello%2C%20I'm%20interested%20in%20investing%20with%20UPERLAND"
- Tooltip "Chat with us!" al hover
- Animación pulse en box-shadow

==== JS REQUERIDO ====
1. IntersectionObserver para contadores animados (requestAnimationFrame, easing)
2. Header glassmorphism al scroll > 80px
3. Hamburguesa mobile animada
4. Formulario: validación + mensaje éxito
5. AOS.init({ duration: 800, once: true, offset: 80 })
6. Swiper testimonios
7. lucide.createIcons() al final

Genera el index.html COMPLETO con TODO implementado. Nada pendiente.`

async function run() {
  console.log('🚀 UPERLAND v6 — claude-sonnet-4-6 — 60k tokens')
  console.log('⏳ Generando... (~4-6 min)\n')

  const { rows } = await pool.query(
    'SELECT COALESCE(MAX(numero_version),0) as v FROM versiones_sitio WHERE sitio_id=$1',
    [SITIO_ID]
  )
  const ver = parseInt(rows[0].v) + 1
  console.log(`📋 Versión ${ver}`)

  await pool.query("UPDATE sitios SET estado='generando',updated_at=NOW() WHERE id=$1", [SITIO_ID])

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 60000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: USER_PROMPT }],
      }),
    })

    if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`)

    const data = await res.json()
    let html = data.content?.[0]?.text || ''
    const tokens = data.usage?.output_tokens || 0

    if (html.includes('```html')) html = html.replace(/^```html\n?/,'').replace(/\n?```$/,'').trim()
    else if (html.startsWith('```')) html = html.replace(/^```\n?/,'').replace(/\n?```$/,'').trim()

    console.log(`✅ ${html.length.toLocaleString()} chars | ${tokens.toLocaleString()} tokens`)

    await pool.query('UPDATE versiones_sitio SET es_actual=false WHERE sitio_id=$1', [SITIO_ID])
    await pool.query(
      `INSERT INTO versiones_sitio(sitio_id,numero_version,html_completo,es_actual,modelo_usado,tokens_usados,prompt_usado)
       VALUES($1,$2,$3,true,'claude-sonnet-4-6',$4,$5)`,
      [SITIO_ID, ver, html, tokens, USER_PROMPT.slice(0,2000)]
    )
    await pool.query("UPDATE sitios SET estado='borrador',updated_at=NOW() WHERE id=$1", [SITIO_ID])

    console.log(`\n🎉 UPERLAND v${ver} lista!`)
    console.log(`   Tokens: ${tokens.toLocaleString()} | HTML: ${html.length.toLocaleString()} chars`)
    console.log(`   https://weblynow.com/dashboard/sitios/${SITIO_ID}`)
  } catch(e) {
    await pool.query("UPDATE sitios SET estado='borrador',updated_at=NOW() WHERE id=$1",[SITIO_ID])
    throw e
  } finally {
    await pool.end()
  }
}

run().catch(e => { console.error('❌', e.message); process.exit(1) })
