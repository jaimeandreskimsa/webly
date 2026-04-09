'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, AlertCircle, CreditCard, Zap, Shield, FlaskConical, CheckCircle2, Sparkles } from 'lucide-react'

const planNombres: Record<string, string> = {
  prueba: 'Prueba',
  basico: 'Básico',
  pro: 'Pro',
  premium: 'Premium',
  broker: 'Broker',
  demo: 'Demo (Admin)',
}

const planPrecios: Record<string, string> = {
  prueba: '$1.000',
  basico: '$50.000',
  pro: '$100.000',
  premium: '$300.000',
  broker: '$700.000',
  demo: 'Gratis',
}

const planDescripciones: Record<string, string[]> = {
  prueba: ['1 sitio web de prueba', 'Generación con IA', 'Ideal para probar la plataforma'],
  basico: ['1 sitio web', 'Dominio personalizado', 'Soporte por email'],
  pro: ['3 sitios web', 'Dominio personalizado', 'Generación con IA', 'Soporte prioritario'],
  premium: ['Sitios ilimitados', 'Dominio personalizado', 'Generación con IA avanzada', 'Soporte 24/7', 'Analíticas'],
  broker: ['Todo Premium', 'Multi-cliente', 'White label', 'API access', 'Manager dedicado'],
  demo: ['Plan Premium completo', 'Sin costo', 'Solo para administradores'],
}

interface Props {
  planPagado: string | null
  isAdmin: boolean
}

export function NuevoSitioClient({ planPagado, isAdmin }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const plan = searchParams.get('plan') || 'pro'

  const [error, setError] = useState('')
  const [intentando, setIntentando] = useState(false)

  async function iniciarPago() {
    setIntentando(true)
    setError('')
    try {
      const res = await fetch('/api/pagos/crear-express', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Error al iniciar el pago')
      window.location.href = data.checkoutUrl
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el sistema de pago')
      setIntentando(false)
    }
  }

  // Estado: procesando
  if (intentando && !error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
        </div>
        <div>
          <h2 className="text-xl font-black mb-1">Creando tu sitio...</h2>
          <p className="text-muted-foreground text-sm">Preparando el asistente de configuración...</p>
        </div>
      </div>
    )
  }

  // Estado de error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <div>
          <h2 className="text-xl font-black mb-2">Error al iniciar</h2>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-xs text-left">
            {error}
          </div>
        </div>
        <button
          onClick={iniciarPago}
          className="flex items-center gap-2 px-6 py-3 rounded-xl btn-gradient text-white font-semibold text-sm"
        >
          <Loader2 className="w-4 h-4" /> Reintentar
        </button>
        <a href="/dashboard" className="text-xs text-muted-foreground hover:text-white transition-colors">
          ← Volver al dashboard
        </a>
      </div>
    )
  }

  // ── Usuario ya tiene plan pagado: crear sitio sin pago ────────────────────
  if (planPagado) {
    const planNombre = planNombres[planPagado] || planPagado
    const features = planDescripciones[planPagado] || []

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-6">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Plan {planNombre} activo · Sin costo adicional
            </span>
          </div>

          <div className="glass border border-white/10 rounded-2xl p-8 text-center">
            <h1 className="text-3xl font-black mb-1">Crear nuevo sitio</h1>
            <p className="text-muted-foreground text-sm mt-2 mb-6">
              Ya tienes el plan <span className="text-white font-semibold">{planNombre}</span> activo.
              Puedes crear otro sitio sin costo adicional.
            </p>

            <ul className="space-y-2.5 mb-8 text-left">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={iniciarPago}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl btn-gradient text-white font-bold text-base hover:scale-[1.02] transition-transform"
            >
              <Sparkles className="w-5 h-5" />
              Crear sitio con plan {planNombre}
            </button>
          </div>

          <div className="text-center mt-5">
            <a href="/dashboard" className="text-xs text-muted-foreground hover:text-white transition-colors">
              ← Volver al dashboard
            </a>
          </div>
        </div>
      </div>
    )
  }

  // ── Usuario sin plan: flujo de pago normal ────────────────────────────────
  const isDemo = plan === 'demo'
  const planNombre = planNombres[plan] || 'Pro'
  const planPrecio = planPrecios[plan] || '$100.000'
  const planFeatures = planDescripciones[plan] || planDescripciones['pro']

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
      <div className="w-full max-w-md">
        {isDemo ? (
          <div className="flex justify-center mb-6">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-400 text-xs font-semibold">
              <FlaskConical className="w-3.5 h-3.5" />
              Modo Demo — Solo administradores
            </span>
          </div>
        ) : (
          <div className="flex justify-center mb-6">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
              <CreditCard className="w-3.5 h-3.5" />
              Pago único · Sin suscripción
            </span>
          </div>
        )}

        <div className="glass border border-white/10 rounded-2xl p-8 text-center">
          <h1 className="text-3xl font-black mb-1">Plan {planNombre}</h1>
          <p className="text-4xl font-black text-indigo-400 mt-3 mb-6">{planPrecio}</p>

          <ul className="space-y-2.5 mb-8 text-left">
            {planFeatures.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <button
            onClick={iniciarPago}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl btn-gradient text-white font-bold text-base hover:scale-[1.02] transition-transform"
          >
            {isDemo ? (
              <><FlaskConical className="w-5 h-5" /> Crear sitio demo</>
            ) : (
              <><CreditCard className="w-5 h-5" /> Pagar con Flow</>
            )}
          </button>
        </div>

        {!isDemo && (
          <div className="flex items-center justify-center gap-6 mt-5 text-xs text-muted-foreground">
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
              Sitio en minutos
            </div>
          </div>
        )}

        <div className="text-center mt-5">
          <a href="/dashboard" className="text-xs text-muted-foreground hover:text-white transition-colors">
            ← Volver al dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
