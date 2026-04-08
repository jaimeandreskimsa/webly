'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  CreditCard, Shield, Zap, Globe, Sparkles, Crown, Building2,
  Check, Loader2, ArrowLeft, AlertCircle
} from 'lucide-react'

const planDetalles = {
  basico: {
    nombre: 'Básico',
    precio: 50000,
    precioStr: '50.000',
    icon: Globe,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    gradient: 'from-blue-500/20 to-indigo-500/20',
    descripcion: 'Ideal para emprendedores que recién comienzan',
    features: [
      '1 Landing page profesional',
      '4-6 secciones optimizadas',
      'Imágenes de stock con IA',
      'Formulario de contacto',
      'SEO básico incluido',
      'Descarga ZIP',
    ],
  },
  pro: {
    nombre: 'Pro',
    precio: 100000,
    precioStr: '100.000',
    icon: Sparkles,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    gradient: 'from-violet-500/25 to-purple-500/25',
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
    nombre: 'Premium',
    precio: 300000,
    precioStr: '300.000',
    icon: Crown,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    gradient: 'from-amber-500/20 to-orange-500/20',
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
    nombre: 'Broker',
    precio: 700000,
    precioStr: '700.000',
    icon: Building2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    descripcion: 'Portal inmobiliario con gestión de propiedades',
    features: [
      'Portal inmobiliario completo',
      'Carga y gestión de propiedades',
      'Filtros avanzados (tipo, precio, ciudad)',
      'Deploy automático en Vercel',
      'SEO: schema RealEstateAgent',
      'Ediciones ilimitadas',
    ],
  },
} as const

type PlanKey = keyof typeof planDetalles

function NuevoPagoContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const planParam = (searchParams.get('plan') || 'pro') as PlanKey
  const plan = planDetalles[planParam] ?? planDetalles.pro
  const PlanIcon = plan.icon

  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState('')

  async function iniciarPago() {
    setProcesando(true)
    setError('')
    try {
      const res = await fetch('/api/pagos/crear-express', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planParam }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Error al iniciar el pago')
      window.location.href = data.checkoutUrl
    } catch (err: any) {
      setError(err.message || 'Error al procesar. Intenta de nuevo.')
      setProcesando(false)
    }
  }

  const formatCLP = (n: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(n)

  return (
    <div className="min-h-screen bg-[#060810] flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-5">

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-black mb-1">Confirma tu plan</h1>
          <p className="text-muted-foreground text-sm">
            Paga ahora y en 5 minutos tendrás tu sitio web
          </p>
        </div>

        {/* Plan card */}
        <div className={`rounded-2xl border p-6 bg-gradient-to-br ${plan.gradient} ${plan.border}`}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${plan.bg} border ${plan.border} flex items-center justify-center`}>
                <PlanIcon className={`w-6 h-6 ${plan.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Plan seleccionado</p>
                <h2 className="text-xl font-black">{plan.nombre}</h2>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black">CLP$<br />{plan.precioStr}</div>
              <div className="text-xs text-muted-foreground">Pago único</div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">{plan.descripcion}</p>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {plan.features.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                <span className="text-foreground/80 text-xs">{f}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 pt-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total a pagar ahora</span>
            <span className="text-xl font-black">{formatCLP(plan.precio)}</span>
          </div>
        </div>

        {/* Flujo de pasos */}
        <div className="glass rounded-xl border border-white/5 p-4">
          <p className="text-xs text-muted-foreground font-semibold mb-3 uppercase tracking-wide">¿Cómo funciona?</p>
          <div className="space-y-2">
            {[
              { n: '1', label: 'Pagas de forma segura con Flow.cl' },
              { n: '2', label: 'Rellenas los datos de tu negocio (5 min)' },
              { n: '3', label: 'Claude AI genera tu sitio web automáticamente' },
            ].map(({ n, label }) => (
              <div key={n} className="flex items-center gap-3 text-sm">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xs font-bold shrink-0">
                  {n}
                </div>
                <span className="text-foreground/80">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={iniciarPago}
          disabled={procesando}
          className="w-full btn-gradient text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 text-lg disabled:opacity-50 hover:scale-[1.02] transition-transform glow-purple"
        >
          {procesando ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Procesando...</>
          ) : (
            <><CreditCard className="w-5 h-5" /> Pagar {formatCLP(plan.precio)}</>
          )}
        </button>

        {/* Trust */}
        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
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

        <p className="text-center text-xs text-muted-foreground">
          Serás redirigido a Flow.cl. Tras confirmar el pago, completarás los datos de tu negocio.
        </p>
      </div>
    </div>
  )
}

export default function NuevoPage() {
  return (
    <Suspense>
      <NuevoPagoContent />
    </Suspense>
  )
}
