import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { configuracion } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { PLAN_PRECIOS } from '@/lib/utils'

export interface PlanConfig {
  id: 'basico' | 'pro' | 'premium' | 'broker' | 'restaurante'
  nombre: string
  precio: number
  descripcion: string
  badge: string | null
  activo: boolean
  features: string[]
  limitaciones: string[]
}

const CONFIG_KEY = 'planes_config'

const DEFAULTS: PlanConfig[] = [
  {
    id: 'basico',
    nombre: 'Básico',
    precio: 1000,
    descripcion: 'Ideal para emprendedores que recién comienzan',
    badge: null,
    activo: true,
    features: [
      '1 Landing page profesional',
      '4-6 secciones optimizadas',
      'Imágenes de stock con IA',
      'Formulario de contacto',
      'SEO básico incluido',
      'Descarga ZIP',
      '1 revisión incluida',
      'Soporte por email',
    ],
    limitaciones: ['Sin imágenes propias', 'Sin deploy automático'],
  },
  {
    id: 'pro',
    nombre: 'Pro',
    precio: PLAN_PRECIOS.pro,
    descripcion: 'Para negocios que quieren destacar',
    badge: 'MÁS POPULAR',
    activo: true,
    features: [
      '3-5 páginas completas',
      '8-10 secciones elegibles',
      'Hasta 10 imágenes propias',
      'GSAP + animaciones scroll',
      'Formulario + WhatsApp',
      'Subdominio gratis + SSL',
      'Deploy en 1 click',
      '3 revisiones/mes',
      'Soporte prioritario',
      'Google Analytics incluido',
    ],
    limitaciones: [],
  },
  {
    id: 'premium',
    nombre: 'Premium',
    precio: PLAN_PRECIOS.premium,
    descripcion: 'Experiencia de agencia, velocidad de IA',
    badge: 'MÁXIMO IMPACTO',
    activo: true,
    features: [
      '10+ páginas a medida',
      'Secciones ilimitadas',
      'Imágenes y videos propios',
      'Three.js / efectos 3D',
      'Locomotive Scroll',
      'Blog con 5 posts',
      'Dominio propio + CDN',
      'Deploy + hosting incluido',
      'Revisiones ilimitadas 30 días',
      'SEO avanzado + analytics',
      '2 idiomas',
    ],
    limitaciones: [],
  },
  {
    id: 'broker',
    nombre: 'Broker',
    precio: PLAN_PRECIOS.broker,
    descripcion: 'Portal inmobiliario con gestión de propiedades',
    badge: 'INMOBILIARIAS',
    activo: true,
    features: [
      'Portal inmobiliario completo',
      '4 páginas (inicio, propiedades, nosotros, contacto)',
      'Carga y gestión de propiedades',
      'Filtros avanzados (tipo, precio, ciudad)',
      'Modal de detalle con galería',
      'WhatsApp CTA por propiedad',
      'Deploy automático en Vercel',
      'SEO: schema RealEstateAgent',
      'Hasta 10 imágenes IA incluidas',
      'Ediciones ilimitadas',
    ],
    limitaciones: [],
  },
  {
    id: 'restaurante',
    nombre: 'Restaurante',
    precio: PLAN_PRECIOS.restaurante,
    descripcion: 'Menú digital para restaurantes y cafeterías',
    badge: 'GASTRONOMÍA',
    activo: true,
    features: [
      'Sitio SPA de 4 páginas',
      'Menú digital interactivo',
      'Filtros por categoría',
      'Carta editable desde dashboard',
      'WhatsApp flotante',
      'Deploy automático en Vercel',
      'SEO: schema Restaurant',
      'Hasta 20 imágenes IA',
      '5 ediciones incluidas',
      'Publicación de carta con 1 click',
    ],
    limitaciones: [],
  },
]

export async function GET() {
  try {
    const [row] = await db
      .select()
      .from(configuracion)
      .where(eq(configuracion.clave, CONFIG_KEY))
      .limit(1)

    if (row?.valor) {
      return NextResponse.json(JSON.parse(row.valor))
    }
    return NextResponse.json(DEFAULTS)
  } catch (err) {
    console.error('[admin/planes] GET error:', err)
    return NextResponse.json(DEFAULTS)
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as any).rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const planes: PlanConfig[] = await req.json()

    // Validar mínimamente
    if (!Array.isArray(planes) || planes.length === 0) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const valor = JSON.stringify(planes)

    await db
      .insert(configuracion)
      .values({
        clave: CONFIG_KEY,
        valor,
        descripcion: 'Configuración de planes y precios',
        tipo: 'json',
      })
      .onConflictDoUpdate({
        target: configuracion.clave,
        set: { valor, updatedAt: new Date() },
      })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[admin/planes] PUT error:', err)
    return NextResponse.json({ error: err.message || 'Error al guardar' }, { status: 500 })
  }
}
