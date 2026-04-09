'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, AlertCircle, CreditCard, Zap, Shield, FlaskConical, CheckCircle2, Sparkles, Crown, Building2 } from 'lucide-react'

const PLANES_GRID = [
  {
    id: 'basico',
    nombre: 'Básico',
    precio: '$1.000',
    descripcion: 'Para empezar rápido',
    icon: Zap,
    color: 'text-blue-400',
    border: 'border-blue-500/40',
    bg: 'bg-blue-500/10',
    ring: 'ring-blue-500',
    features: ['1 sitio web', 'Dominio personalizado', 'Soporte por email'],
  },
  {
    id: 'pro',
    nombre: 'Pro',
    precio: '$100.000',
    descripcion: 'El más popular',
    icon: Sparkles,
    color: 'text-indigo-400',
    border: 'border-indigo-500/40',
    bg: 'bg-indigo-500/10',
    ring: 'ring-indigo-500',
    popular: true,
    features: ['3 sitios web', 'Generación con IA', 'Dominio personalizado', 'Soporte prioritario'],
  },
  {
    id: 'premium',
    nombre: 'Premium',
    precio: '$300.000',
    descripcion: 'Máximo potencial',
    icon: Crown,
    color: 'text-violet-400',
    border: 'border-violet-500/40',
    bg: 'bg-violet-500/10',
    ring: 'ring-violet-500',
    features: ['Sitios ilimitados', 'IA avanzada', 'Soporte 24/7', 'Analíticas'],
  },
  {
    id: 'broker',
    nombre: 'Broker',
    precio: '$700.000',
    descripcion: 'Para agencias',
    icon: Building2,
    color: 'text-amber-400',
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/10',
    ring: 'ring-amber-500',
    features: ['Todo Premium', 'Multi-cliente', 'White label', 'API access'],
  },
]

interface Props {
  isAdmin: boolean
  precios: Record<string, number>
}

export function NuevoSitioClient({ isAdmin, precios }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Formatea un precio desde DB o usa el fallback hardcodeado
  const precioFmt = (id: string, fallback: string) =>
    precios[id] ? `$${precios[id].toLocaleString('es-CL')}` : fallback

  const [planSeleccionado, setPlanSeleccionado] = useState(searchParams.get('plan') || 'pro')
  const [error, setError] = useState('')
  const [intentando, setIntentando] = useState(false)

  async function iniciarPago() {
    setIntentando(true)
    setError('')
    try {
      const res = await fetch('/api/pagos/crear-express', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planSeleccionado }),
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

  // ── Usuario sin plan: selector de planes ───────────────────────────────────
  const isDemo = planSeleccionado === 'demo'
  const planActual = PLANES_GRID.find(p => p.id === planSeleccionado) ?? PLANES_GRID[1]

  return (
    <div className="py-10">
      {/* Título */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black mb-2">Elige tu plan</h1>
        <p className="text-muted-foreground text-sm">Pago único · Sin suscripción mensual</p>
      </div>

      {isDemo ? (
        // Modo demo solo para admin
        <div className="max-w-md mx-auto">
          <div className="glass border border-violet-500/30 rounded-2xl p-8 text-center">
            <FlaskConical className="w-12 h-12 text-violet-400 mx-auto mb-4" />
            <h2 className="text-xl font-black mb-2">Modo Demo</h2>
            <p className="text-muted-foreground text-sm mb-6">Solo para administradores. Sin costo.</p>
            <button
              onClick={iniciarPago}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl btn-gradient text-white font-bold"
            >
              <FlaskConical className="w-5 h-5" /> Crear sitio demo
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Grid de planes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {PLANES_GRID.map((p) => {
              const Icon = p.icon
              const seleccionado = planSeleccionado === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => setPlanSeleccionado(p.id)}
                  className={
                    `relative text-left w-full rounded-2xl border p-4 transition-all duration-200 ` +
                    (seleccionado
                      ? `glass ring-2 ${p.ring} border-transparent`
                      : `glass border-white/10 hover:border-white/20`)
                  }
                >
                  {p.popular && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
                      Popular
                    </span>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-xl ${p.bg} border ${p.border} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4.5 h-4.5 ${p.color}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-base">{p.nombre}</span>
                        {seleccionado && <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{p.descripcion}</p>
                    </div>
                    {/* Precio alineado a la derecha en la misma fila del nombre */}
                    <p className={`text-lg font-black ${p.color} ml-auto shrink-0`}>
                      {precioFmt(p.id, p.precio)}
                    </p>
                  </div>
                  <ul className="space-y-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              )
            })}
          </div>

          {/* CTA */}
          <div className="max-w-md mx-auto">
            <button
              onClick={iniciarPago}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl btn-gradient text-white font-bold text-base hover:scale-[1.02] transition-transform"
            >
              <CreditCard className="w-5 h-5" />
              Pagar plan {planActual.nombre} · {precioFmt(planActual.id, planActual.precio)}
            </button>

            <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
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
          </div>
        </>
      )}

      <div className="text-center mt-6">
        <a href="/dashboard" className="text-xs text-muted-foreground hover:text-white transition-colors">
          ← Volver al dashboard
        </a>
      </div>
    </div>
  )
}
