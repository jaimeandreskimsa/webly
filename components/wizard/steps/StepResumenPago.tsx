'use client'

import { Check, Globe, Sparkles, Crown, Building2, Shield, CreditCard, Zap, ArrowRight } from 'lucide-react'
import { formatCLP, PLAN_PRECIOS } from '@/lib/utils'
import type { DatosWizard } from '../WizardCreacion'

const planDetalles = {
  basico: {
    icon: Globe,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/30',
    gradient: 'from-blue-500/20 to-indigo-500/20',
    label: 'Básico',
    descripcion: 'Ideal para emprendedores que recién comienzan',
    features: [
      '1 Landing page profesional',
      '4-6 secciones optimizadas',
      'Imágenes de stock con IA',
      'Formulario de contacto',
      'SEO básico incluido',
      'Descarga ZIP',
      '1 revisión incluida',
    ],
  },
  pro: {
    icon: Sparkles,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/30',
    gradient: 'from-violet-500/25 to-purple-500/25',
    label: 'Pro',
    descripcion: 'Para negocios que quieren destacar',
    features: [
      '3-5 páginas completas',
      'Hasta 10 imágenes propias',
      'GSAP + animaciones scroll',
      'Formulario + WhatsApp',
      'Deploy en 1 click',
      '3 revisiones/mes',
      'Google Analytics incluido',
    ],
  },
  premium: {
    icon: Crown,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30',
    gradient: 'from-amber-500/20 to-orange-500/20',
    label: 'Premium',
    descripcion: 'Experiencia de agencia, velocidad de IA',
    features: [
      '10+ páginas a medida',
      'Three.js / efectos 3D',
      'Locomotive Scroll',
      'Dominio propio + CDN',
      'Revisiones ilimitadas 30 días',
      'SEO avanzado + analytics',
      '2 idiomas',
    ],
  },
  broker: {
    icon: Building2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    label: 'Broker',
    descripcion: 'Portal inmobiliario con gestión de propiedades',
    features: [
      'Portal inmobiliario completo',
      'Carga y gestión de propiedades',
      'Filtros avanzados (tipo, precio, ciudad)',
      'Deploy automático en Vercel',
      'SEO: schema RealEstateAgent',
      'Ediciones ilimitadas',
      'Panel de administración',
    ],
  },
}

interface Props {
  datos: DatosWizard
}

export function StepResumenPago({ datos }: Props) {
  const plan = datos.plan
  const detalle = planDetalles[plan]
  const PlanIcon = detalle.icon
  const precio = PLAN_PRECIOS[plan]

  return (
    <div className="space-y-5">
      {/* Plan card */}
      <div className={`rounded-2xl border p-6 bg-gradient-to-br ${detalle.gradient} ${detalle.bg}`}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${detalle.bg} border flex items-center justify-center`}>
              <PlanIcon className={`w-6 h-6 ${detalle.color}`} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Plan {detalle.label}</h3>
              <p className="text-xs text-muted-foreground">{detalle.descripcion}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black">{formatCLP(precio)}</div>
            <div className="text-xs text-muted-foreground">Pago único</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-5">
          {detalle.features.map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
              <span className="text-foreground/80">{f}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total a pagar al finalizar</span>
          <span className="text-xl font-black text-white">{formatCLP(precio)}</span>
        </div>
      </div>

      {/* Flow explainer */}
      <div className="glass rounded-xl p-4 border border-indigo-500/20 bg-indigo-500/5">
        <div className="flex items-start gap-3">
          <ArrowRight className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-indigo-300 mb-1">¿Cómo funciona?</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Completa los siguientes pasos con la información de tu negocio. Al finalizar, serás redirigido
              a <span className="text-white font-medium">Flow.cl</span> para completar el pago de forma
              segura. Una vez confirmado, tu sitio web se generará automáticamente con IA en minutos.
            </p>
          </div>
        </div>
      </div>

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-8 text-xs text-muted-foreground py-2">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-green-400" />
          Pago 100% seguro
        </div>
        <div className="flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-blue-400" />
          Flow.cl
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-yellow-400" />
          Sitio en 5 minutos
        </div>
      </div>
    </div>
  )
}
