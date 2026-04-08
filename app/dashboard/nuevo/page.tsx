'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, AlertCircle, CreditCard, Zap, Shield, FlaskConical, CheckCircle2 } from 'lucide-react'

const planNombres: Record<string, string> = {
  basico: 'Básico',
  pro: 'Pro',
  premium: 'Premium',
  broker: 'Broker',
  demo: 'Demo (Admin)',
}

const planPrecios: Record<string, string> = {
  basico: '$50.000',
  pro: '$100.000',
  premium: '$300.000',
  broker: '$700.000',
  demo: 'Gratis',
}

const planDescripciones: Record<string, string[]> = {
  basico: ['1 sitio web', 'Dominio personalizado', 'Soporte por email'],
  pro: ['3 sitios web', 'Dominio personalizado', 'Generación con IA', 'Soporte prioritario'],
  premium: ['Sitios ilimitados', 'Dominio personalizado', 'Generación con IA avanzada', 'Soporte 24/7', 'Analíticas'],
  broker: ['Todo Premium', 'Multi-cliente', 'White label', 'API access', 'Manager dedicado'],
  demo: ['Plan Premium completo', 'Sin costo', 'Solo para administradores'],
}

function NuevoContent() {
  const searchParams = useSearchParams()
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

  const planNombre = planNombres[plan] || 'Pro'
  const planPrecio = planPrecios[plan] || '$100.000'
  const planFeatures = planDescripciones[plan] || planDescripciones['pro']
  const isDemo = plan === 'demo'

  // Estado: procesando (spinner mientras redirige a Flow)
  if (intentando && !error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
        </div>
        <div>
          <h2 className="text-xl font-black mb-1">
            {isDemo ? 'Creando sitio demo...' : 'Conectando con Flow...'}
          </h2>
          <p className="text-muted-foreground text-sm">
            {isDemo ? 'Configurando acceso completo sin costo...' : 'Preparando tu pago seguro...'}
          </p>
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
          <h2 className="text-xl font-black mb-2">Error al iniciar el pago</h2>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-xs text-left">
            {error}
          </div>
        </div>
        <button
          onClick={iniciarPago}
          disabled={intentando}
          className="flex items-center gap-2 px-6 py-3 rounded-xl btn-gradient text-white font-semibold text-sm hover:scale-105 transition-transform disabled:opacity-50"
        >
          {intentando ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Intentando...</>
          ) : (
            <><CreditCard className="w-4 h-4" /> Reintentar pago</>
          )}
        </button>
        <a href="/dashboard" className="text-xs text-muted-foreground hover:text-white transition-colors">
          ← Volver al dashboard
        </a>
      </div>
    )
  }

  // Estado principal: pantalla de confirmación con botón de pago
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
      <div className="w-full max-w-md">
        {/* Badge plan */}
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

        {/* Card principal */}
        <div className="glass border border-white/10 rounded-2xl p-8 text-center">
          <h1 className="text-3xl font-black mb-1">Plan {planNombre}</h1>
          <p className="text-4xl font-black text-indigo-400 mt-3 mb-6">
            {planPrecio}
          </p>

          {/* Features */}
          <ul className="space-y-2.5 mb-8 text-left">
            {planFeatures.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {/* Botón principal */}
          <button
            onClick={iniciarPago}
            disabled={intentando}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl btn-gradient text-white font-bold text-base hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100"
          >
            {isDemo ? (
              <><FlaskConical className="w-5 h-5" /> Crear sitio demo</>
            ) : (
              <><CreditCard className="w-5 h-5" /> Pagar con Flow</>
            )}
          </button>
        </div>

        {/* Trust badges */}
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

export default function NuevoPage() {
  return (
    <Suspense>
      <NuevoContent />
    </Suspense>
  )
}
