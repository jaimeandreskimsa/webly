'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, AlertCircle, CreditCard, RefreshCw, Zap, Shield } from 'lucide-react'

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
      // Redirigir a Flow directamente
      window.location.href = data.checkoutUrl
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el sistema de pago')
      setIntentando(false)
    }
  }

  // Auto-disparar pago al montar
  useEffect(() => {
    iniciarPago()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const planNombre = planNombres[plan] || 'Pro'
  const planPrecio = planPrecios[plan] || '$100.000'

  // Estado de carga (normal)
  if (!error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
        </div>
        <div>
          <h2 className="text-xl font-black mb-1">
            {plan === 'demo' ? 'Creando sitio demo...' : 'Preparando tu pago...'}
          </h2>
          <p className="text-muted-foreground text-sm">
            Plan <span className="text-white font-semibold">{planNombre}</span>{' '}
            — {plan === 'demo' ? 'sin costo · todas las funcionalidades' : `${planPrecio} pago único`}
          </p>
        </div>
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
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
            Sitio en 5 min
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Serás redirigido a Flow.cl en un momento...
        </p>
      </div>
    )
  }

  // Estado de error con botón de reintento
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center max-w-md mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
      <div>
        <h2 className="text-xl font-black mb-2">Error al iniciar el pago</h2>
        <p className="text-muted-foreground text-sm mb-4">{error}</p>
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
          <><RefreshCw className="w-4 h-4" /> Reintentar pago</>
        )}
      </button>
      <a href="/" className="text-xs text-muted-foreground hover:text-white transition-colors">
        ← Volver al inicio
      </a>
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
