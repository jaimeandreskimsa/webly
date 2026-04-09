'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CreditCard, Shield, Check, Loader2, Zap,
  Globe, Sparkles, Crown, Building2, UtensilsCrossed
} from 'lucide-react'
import { formatCLP, PLAN_PRECIOS } from '@/lib/utils'
import type { DatosWizard } from '../WizardCreacion'

const planDetalles = {
  prueba: {
    icon: Zap,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10 border-pink-500/30',
    features: ['1 Landing page', 'Animaciones incluidas', 'Formulario contacto', 'Descarga ZIP'],
  },
  basico: {
    icon: Globe,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/30',
    features: ['1 Landing page', 'Animaciones AOS', 'Formulario contacto', 'Descarga ZIP'],
  },
  pro: {
    icon: Sparkles,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/30',
    features: ['4 páginas multipágina', 'Animaciones GSAP', 'Deploy automático', 'WhatsApp flotante'],
  },
  premium: {
    icon: Crown,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30',
    features: ['4 páginas + SEO completo', 'Locomotive Scroll 3D', 'Deploy + CDN', 'Revisiones ilimitadas'],
  },
  broker: {
    icon: Building2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    features: ['Portal inmobiliario', 'Gestión de propiedades', 'Filtros y búsqueda', 'Deploy automático'],
  },
  restaurante: {
    icon: UtensilsCrossed,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/30',
    features: ['Sitio para restaurante', 'Menú digital interactivo', 'Gestión de carta', 'Deploy automático'],
  },
}

interface Props {
  datos: DatosWizard
  userId: string
  onError: (e: string) => void
  onLoading: (l: boolean) => void
}

export function StepPago({ datos, userId, onError, onLoading }: Props) {
  const router = useRouter()
  const [procesando, setProcesando] = useState(false)
  const plan = datos.plan
  const detalle = planDetalles[plan]
  const PlanIcon = detalle.icon
  const precio = PLAN_PRECIOS[plan]

  async function generarSinPago() {
    setProcesando(true)
    onLoading(true)
    onError('')

    try {
      // 1. Crear el sitio en BD
      const resSitio = await fetch('/api/sitios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: datos.nombreEmpresa,
          plan: datos.plan,
          contenidoJson: datos,
        }),
      })

      if (!resSitio.ok) {
        const errData = await resSitio.json().catch(() => ({}))
        throw new Error(errData.error || 'Error al crear el sitio')
      }
      const { sitio } = await resSitio.json()

      // 2. Activar sin pago (solo dev)
      const resActivar = await fetch('/api/dev/activar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sitioId: sitio.id }),
      })

      if (!resActivar.ok) throw new Error('Error al activar el sitio')

      // 3. Ir a generación
      router.push(`/dashboard/sitios/${sitio.id}/generando`)
    } catch (err: any) {
      onError(err.message || 'Error al procesar. Intenta de nuevo.')
      setProcesando(false)
      onLoading(false)
    }
  }

  async function iniciarPago() {
    setProcesando(true)
    onLoading(true)
    onError('')

    try {
      // 1. Crear el sitio en BD (estado: pendiente_pago)
      const resSitio = await fetch('/api/sitios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: datos.nombreEmpresa,
          plan: datos.plan,
          contenidoJson: datos,
        }),
      })

      if (!resSitio.ok) {
        const errData = await resSitio.json().catch(() => ({}))
        throw new Error(errData.error || 'Error al crear el sitio')
      }

      const { sitio } = await resSitio.json()

      // 2. Crear preferencia de pago en MercadoPago
      const resPago = await fetch('/api/pagos/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: datos.plan,
          sitioId: sitio.id,
          nombreEmpresa: datos.nombreEmpresa,
        }),
      })

      const dataPago = await resPago.json().catch(() => ({}))
      if (!resPago.ok) {
        throw new Error(dataPago.error || 'Error al procesar el pago')
      }

      const { checkoutUrl } = dataPago

      // 3. Redirigir a MercadoPago
      window.location.href = checkoutUrl
    } catch (err: any) {
      onError(err.message || 'Error al procesar. Intenta de nuevo.')
      setProcesando(false)
      onLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Resumen del pedido */}
      <div className={`rounded-2xl border p-5 ${detalle.bg}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl ${detalle.bg} flex items-center justify-center`}>
            <PlanIcon className={`w-5 h-5 ${detalle.color}`} />
          </div>
          <div>
            <h3 className="font-semibold">Plan {plan.charAt(0).toUpperCase() + plan.slice(1)}</h3>
            <p className="text-xs text-muted-foreground">Pago único · sin mensualidad</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {detalle.features.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs">
              <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
              <span className="text-foreground/80">{f}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total a pagar</span>
          <span className="text-2xl font-black">{formatCLP(precio)}</span>
        </div>
      </div>

      {/* Resumen del sitio */}
      <div className="glass rounded-xl p-4 border border-white/5">
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">Resumen de tu sitio</h4>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Empresa:</span>
            <span className="font-medium">{datos.nombreEmpresa || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rubro:</span>
            <span>{datos.rubro || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Servicios:</span>
            <span>{datos.servicios.filter(s => s.nombre).length} ingresados</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Imágenes:</span>
            <span>{datos.imagenes.length} subidas</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estilo:</span>
            <span className="capitalize">{datos.tipoDiseno}</span>
          </div>
        </div>
      </div>

      {/* Trust badges */}
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
          Sitio en minutos
        </div>
      </div>

      {/* Modo desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <div className="rounded-xl border border-dashed border-yellow-500/40 bg-yellow-500/5 p-4 space-y-3">
          <div className="flex items-center gap-2 text-yellow-400 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5" />
            MODO LOCAL — Saltar pago
          </div>
          <p className="text-xs text-muted-foreground">
            En producción se usa Flow.cl. Aquí puedes generar el sitio directamente sin pagar.
          </p>
          <button
            onClick={generarSinPago}
            disabled={procesando}
            className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-300 font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 text-sm disabled:opacity-50 transition-all"
          >
            {procesando ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
            ) : (
              <><Zap className="w-4 h-4" /> Generar sin pago (modo local)</>
            )}
          </button>
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
          <><CreditCard className="w-5 h-5" /> Pagar {formatCLP(precio)}</>
        )}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        Serás redirigido a Flow.cl para completar el pago.
        Una vez confirmado, tu sitio se generará automáticamente.
      </p>
    </div>
  )
}
