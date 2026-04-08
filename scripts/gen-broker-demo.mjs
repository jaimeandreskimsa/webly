#!/usr/bin/env node
// Script para generar sitio broker demo con 3 propiedades de ejemplo
import Anthropic from '@anthropic-ai/sdk'
import pg from 'pg'
import crypto from 'crypto'

const USER_ID = '57636aaf-3858-48ab-a151-01c3d775ee71'
const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:czlDYMmQOAIHousOibUhsMmAQDYVleWD@maglev.proxy.rlwy.net:23088/railway'
const API_KEY = process.env.ANTHROPIC_API_KEY

const pool = new pg.Pool({ connectionString: DB_URL, ssl: false })

// ─── Datos del sitio broker ──────────────────────────────────────────────────

const contenidoJson = {
  plan: 'broker',
  nombreEmpresa: 'Kimsa Propiedades',
  rubro: 'Corredora de propiedades',
  descripcion: 'Corredora de propiedades premium en Santiago. Especialistas en departamentos, casas y oficinas en las mejores comunas de la Región Metropolitana. Asesoría integral en compra, venta y arriendo.',
  ciudad: 'Santiago',
  estilo: 'moderno y elegante',
  propuestaValor: 'Encontramos tu propiedad ideal con asesoría personalizada y transparente',
  servicios: [
    { nombre: 'Venta de propiedades', descripcion: 'Gestión completa del proceso de venta, desde la tasación hasta la escritura', precio: '' },
    { nombre: 'Arriendo', descripcion: 'Administración integral de arriendos: búsqueda de arrendatario, contratos y seguimiento', precio: '' },
    { nombre: 'Tasaciones', descripcion: 'Tasaciones comerciales y bancarias con informes detallados', precio: 'Desde 3 UF' },
    { nombre: 'Asesoría hipotecaria', descripcion: 'Te ayudamos a conseguir el mejor crédito hipotecario para tu compra', precio: 'Gratis' },
  ],
  coloresPrimarios: '#1e3a5f',
  coloresSecundarios: '#c9a84c',
  tipoDiseno: 'moderno y elegante',
  tipografia: 'inter',
  logo: '',
  imagenes: [],
  imagenesIA: [],
  videoUrl: '',
  telefono: '+56912345678',
  email: 'contacto@kimsapropiedades.cl',
  direccion: 'Av. Apoquindo 4500, Of. 802, Las Condes',
  horario: 'Lunes a Viernes 9:00 - 18:30, Sábados 10:00 - 14:00',
  redesSociales: {
    instagram: '@kimsapropiedades',
    facebook: 'kimsapropiedades',
    whatsapp: '56912345678',
    linkedin: 'kimsa-propiedades',
  },
  sitiosReferencia: [],
  propiedadesIniciales: [
    {
      titulo: 'Departamento 3D/2B con terraza en Providencia',
      descripcion: 'Espectacular departamento de 95m² en el corazón de Providencia. Piso 12 con vista panorámica a la cordillera. Living-comedor amplio, cocina americana equipada, 3 dormitorios (1 en suite), 2 baños completos, terraza de 15m². Edificio con piscina, gimnasio, salón multiuso y conserjería 24/7. Cerca de metro Pedro de Valdivia.',
      precio: '5200',
      moneda: 'UF',
      tipo: 'venta',
      tipoPropiedad: 'departamento',
      superficie: '95',
      habitaciones: '3',
      banos: '2',
      estacionamientos: '1',
      ubicacion: 'Pedro de Valdivia',
      ciudad: 'Providencia',
      imagenes: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      ],
      destacada: true,
    },
    {
      titulo: 'Casa 4D/3B con jardín en La Reina',
      descripcion: 'Hermosa casa de 180m² construidos en terreno de 350m² en barrio residencial de La Reina. 4 dormitorios amplios, 3 baños, living doble altura, comedor independiente, cocina grande con isla, quincho techado con parrilla, jardín con riego automático. Estacionamiento para 3 autos. Alarma y cámaras de seguridad. A pasos del Parque Intercomunal.',
      precio: '12500',
      moneda: 'UF',
      tipo: 'venta',
      tipoPropiedad: 'casa',
      superficie: '180',
      habitaciones: '4',
      banos: '3',
      estacionamientos: '3',
      ubicacion: 'Príncipe de Gales',
      ciudad: 'La Reina',
      imagenes: [
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      ],
      destacada: true,
    },
    {
      titulo: 'Oficina premium 120m² en Las Condes',
      descripcion: 'Moderna oficina en edificio corporativo clase A en el eje El Bosque. 120m² útiles con 4 privados, sala de reuniones con vidrio templado, open space para 6 puestos, kitchenette equipada, 2 baños. Piso 15 con vista al Costanera Center. Edificio con control de acceso, cafetería, sala de conferencias compartida. Ideal para empresas de servicios profesionales.',
      precio: '65',
      moneda: 'UF',
      tipo: 'arriendo',
      tipoPropiedad: 'oficina',
      superficie: '120',
      habitaciones: '4',
      banos: '2',
      estacionamientos: '2',
      ubicacion: 'El Bosque Norte',
      ciudad: 'Las Condes',
      imagenes: [
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
        'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800',
        'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800',
      ],
      destacada: false,
    },
  ],
}

// ─── 1. Crear el sitio en la DB ──────────────────────────────────────────────

const sitioId = crypto.randomUUID()
const slug = 'kimsa-propiedades'

console.log('📦 Creando sitio broker en DB...')
console.log(`   ID: ${sitioId}`)
console.log(`   Plan: broker`)
console.log(`   Empresa: ${contenidoJson.nombreEmpresa}`)

await pool.query(`
  INSERT INTO sitios (id, user_id, nombre, slug, plan, estado, contenido_json, created_at, updated_at)
  VALUES ($1, $2, $3, $4, 'broker', 'generando', $5, NOW(), NOW())
`, [sitioId, USER_ID, contenidoJson.nombreEmpresa, slug, JSON.stringify(contenidoJson)])

console.log('   ✅ Sitio creado en estado "generando"')

// ─── 2. Generar HTML con Claude API ─────────────────────────────────────────

// System prompt para broker (importado de prompts.ts conceptualmente)
const systemPrompt = `Eres un experto desarrollador web especializado en portales inmobiliarios modernos. Creas sitios web de bienes raíces de alto impacto con gestión dinámica de propiedades, filtros avanzados y experiencia de usuario premium.

## CARACTERÍSTICA CLAVE: PROPIEDADES DINÁMICAS
El sitio usa window.PROPIEDADES como fuente de datos. DEBES incluir exactamente este marcador en el JS:
window.PROPIEDADES = /* PROPERTIES_DATA_START */[]/* PROPERTIES_DATA_END */;

Cada propiedad tiene esta estructura:
{ id, titulo, descripcion, precio, moneda (CLP|UF), tipo (venta|arriendo), tipoPropiedad (casa|departamento|local|terreno|oficina|bodega), superficie, habitaciones, banos, estacionamientos, ubicacion, ciudad, imagenes[], destacada }

## STACK OBLIGATORIO
- HTML5 semántico + CSS3 avanzado + JavaScript ES6+ vanilla
- GSAP 3.12 + ScrollTrigger para animaciones
- Swiper.js 11 para sliders de propiedades y hero
- Google Fonts: 2 fuentes (una seria/elegante para titulares, una limpia para texto)
- Phosphor Icons

## CDNs
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
<script src="https://unpkg.com/@phosphor-icons/web"></script>

## ARQUITECTURA MULTIPÁGINA (SPA con router hash)
4 páginas:
- inicio → Hero + propiedades destacadas + buscador rápido + por qué elegirnos
- propiedades → Grid completo + filtros sidebar + paginación
- nosotros → Historia + equipo + valores
- contacto → Formulario + mapa + datos

## CARD DE PROPIEDAD
- Imagen principal con overlay al hover
- Badge VENTA (verde) / ARRIENDO (azul), Badge DESTACADA si aplica
- Precio formateado: CLP → "$ 150.000.000" | UF → "UF 3.500"
- Íconos: superficie m², habitaciones, baños, estacionamientos
- Botón "Ver detalles" → modal

## MODAL DE DETALLE
- Swiper con imágenes, badges, título, precio, descripción, grid de características
- Botón "WhatsApp — Consultar" y "Llamar ahora"

## SISTEMA DE FILTRADO EN JS
Filtros: texto, tipo (venta/arriendo), tipoPropiedad, rango precio, habitaciones, ciudad, orden.
Paginación de 9 por página.

## DISEÑO
- Paleta del cliente + blanco + grises claros para cards
- Cards con sombra suave, border-radius 16px, hover translateY(-4px)
- Mobile-first responsive
- Animaciones GSAP: reveal secciones, counter stats, cards stagger
- NO cursor personalizado, NO botones magnetic, NO 3D tilt
- Hovers simples: scale, sombra, cambio de color

## FORMATO
Un único archivo index.html completo. CSS en <style>, JS al final del <body>.
No uses markdown code blocks. Devuelve SOLO el HTML.`

// Construir propiedades JSON para inyectar
const propiedadesJson = JSON.stringify(contenidoJson.propiedadesIniciales.map((p, i) => ({
  id: `prop-${i + 1}`,
  titulo: p.titulo,
  descripcion: p.descripcion,
  precio: Number(p.precio),
  moneda: p.moneda,
  tipo: p.tipo,
  tipoPropiedad: p.tipoPropiedad,
  superficie: Number(p.superficie),
  habitaciones: Number(p.habitaciones),
  banos: Number(p.banos),
  estacionamientos: Number(p.estacionamientos),
  ubicacion: p.ubicacion,
  ciudad: p.ciudad,
  imagenes: p.imagenes,
  destacada: p.destacada,
  activa: true,
  createdAt: new Date().toISOString(),
})))

const userPrompt = `
Crea un PORTAL INMOBILIARIO PROFESIONAL completo para esta corredora de propiedades chilena.

## DATOS DE LA INMOBILIARIA
**Nombre:** ${contenidoJson.nombreEmpresa}
**Ciudad principal:** ${contenidoJson.ciudad}
**Descripción:** ${contenidoJson.descripcion}
**Propuesta de valor:** ${contenidoJson.propuestaValor}

## DATOS DE CONTACTO
- Teléfono / WhatsApp: ${contenidoJson.telefono}
- Email: ${contenidoJson.email}
- Dirección: ${contenidoJson.direccion}
- Horario: ${contenidoJson.horario}

## REDES SOCIALES
- Instagram: ${contenidoJson.redesSociales.instagram}
- Facebook: ${contenidoJson.redesSociales.facebook}
- WhatsApp: ${contenidoJson.redesSociales.whatsapp}
- LinkedIn: ${contenidoJson.redesSociales.linkedin}

## PREFERENCIAS VISUALES
- Colores primarios: ${contenidoJson.coloresPrimarios} (azul oscuro elegante)
- Colores secundarios: ${contenidoJson.coloresSecundarios} (dorado)
- Estilo: ${contenidoJson.tipoDiseno}
- Tipografía: Inter + Playfair Display

Sin logo — crear logotipo tipográfico elegante con "KP" y un ícono de edificio

## PROPIEDADES REALES DEL CLIENTE (3 propiedades):
Inyecta estos datos directamente en el marcador window.PROPIEDADES:
window.PROPIEDADES = /* PROPERTIES_DATA_START */${propiedadesJson}/* PROPERTIES_DATA_END */;
NO generes propiedades de ejemplo porque el cliente ya tiene las suyas.

## SERVICIOS
${contenidoJson.servicios.map(s => `- ${s.nombre}: ${s.descripcion}${s.precio ? ` (${s.precio})` : ''}`).join('\n')}

## INSTRUCCIONES
- WhatsApp: 56912345678 en botón flotante y CTAs
- Responsive perfecto: mobile, tablet, desktop
- Imágenes de Unsplash para hero y secciones generales (inmobiliaria, edificios, Santiago)
- NO cursor personalizado, NO botones magnetic, NO 3D tilt en cards

Genera el HTML COMPLETO del portal inmobiliario. Que sea impresionante y funcional.
`

console.log('\n🤖 Llamando a Claude API con streaming...')

const client = new Anthropic({ apiKey: API_KEY })
let html = ''
let chars = 0

const stream = client.messages.stream({
  model: 'claude-sonnet-4-6',
  max_tokens: 48000,
  system: systemPrompt,
  messages: [{ role: 'user', content: userPrompt }],
})

for await (const event of stream) {
  if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
    html += event.delta.text
    chars += event.delta.text.length
    process.stdout.write(`\r   Generando... ${chars.toLocaleString()} chars`)
  }
}

const finalMsg = await stream.finalMessage()
const tokens = finalMsg.usage.input_tokens + finalMsg.usage.output_tokens
console.log(`\n   ✅ Generación completa: ${chars.toLocaleString()} chars, ${tokens.toLocaleString()} tokens`)

// Limpiar HTML
let cleanHtml = html
const matchCode = html.match(/```html\n?([\s\S]*?)```/)
if (matchCode) cleanHtml = matchCode[1].trim()
else {
  const matchDoctype = html.match(/(<!DOCTYPE[\s\S]*)/i)
  if (matchDoctype) cleanHtml = matchDoctype[1].trim()
}

// ─── 3. Guardar versión en DB ────────────────────────────────────────────────

console.log('\n💾 Guardando en DB...')

await pool.query(`
  INSERT INTO versiones_sitio (sitio_id, numero_version, html_completo, es_actual, modelo_usado, tokens_usados)
  VALUES ($1, 1, $2, true, 'claude-sonnet-4-6', $3)
`, [sitioId, cleanHtml, tokens])

await pool.query(`
  UPDATE sitios SET estado = 'borrador', total_ediciones = 1, ultima_edicion = NOW(), updated_at = NOW()
  WHERE id = $1
`, [sitioId])

console.log('   ✅ Versión 1 guardada. Estado: borrador')
console.log(`\n🎉 Listo! Ve a: https://app.weblynow.com/dashboard/sitios/${sitioId}`)

await pool.end()
