'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Crown, Zap, Globe, Plus, CreditCard, Receipt,
  Check, ArrowRight, X, Loader2, Building2,
  Sparkles, RotateCcw, ExternalLink,
} from 'lucide-react'
import { cn, formatCLP, formatFecha, PLAN_NOMBRES, PLAN_PRECIOS } from '@/lib/utils'

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface SitioConSub {
  id: string
  nombre: string
  plan: string
  estado: string | null
  deployUrl: string | null
  createdAt: string
  suscripcion: {
    id: string
    plan: string
    activa: boolean
    edicionesUsadasEsteMes: number
    limiteEdiciones: number
    fechaRenovacion: string | null
  } | null
}

export interface PagoHistorial {
  id: string
  plan: string
  monto: number
  estado: string | null
  createdAt: string
}

// ─── Constantes ────────────────────────────────────────────────────────────────
const PLANES_DISPONIBLES = [
  {
    id: 'basico',
    icon: Globe,
    color: 'border-blue-500/30 bg-blue-500/5',
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    features: ['1 Landing page', 'Formulario contacto', 'Descarga ZIP'],
  },
  {
    id: 'pro',
    icon: Sparkles,
    color: 'border-violet-500/30 bg-violet-500/5',
    badge: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    features: ['4 páginas multipágina', 'GSAP + animaciones', 'Deploy automático'],
  },
  {
    id: 'premium',
    icon: Crown,
    color: 'border-amber-500/30 bg-amber-500/5',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    features: ['Todo Pro +', 'Locomotive Scroll', 'SEO avanzado + dark mode'],
  },
  {
    id: 'broker',
    icon: Building2,
    color: 'border-emerald-500/30 bg-emerald-500/5',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    features: ['Portal inmobiliario', 'Gestión de propiedades', 'Deploy automático'],
  },
]

const PLANES_EDICION = [
  {
    id: 'pro',
    nombre: 'Pro',
    precio: 15000,
    ediciones: '3 ediciones / mes',
    color: 'border-violet-500/30',
    badge: 'bg-violet-500/10 text-violet-400',
    features: ['3 revisiones mensuales', 'Regeneración completa', 'Historial 3 versiones'],
  },
  {
    id: 'premium',
    nombre: 'Premium',
    precio: 35000,
    ediciones: 'Ilimitadas',
    color: 'border-amber-500/30',
    badge: 'bg-amber-500/10 text-amber-400',
    features: ['Ediciones ilimitadas', 'Historial 10 versiones', 'Soporte WhatsApp'],
  },
]

const PLAN_BADGE: Record<string, string> = {
  basico:  'bg-blue-500/10    text-blue-400    border-blue-500/20',
  pro:     'bg-violet-500/10  text-violet-400  border-violet-500/20',
  premium: 'bg-amber-500/10   text-amber-400   border-amber-500/20',
  broker:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
}

const ESTADO_COLOR: Record<string, string> = {
  publicado:      'text-green-400',
  borrador:       'text-yellow-400',
  generando:      'text-indigo-400',
  error:          'text-red-400',
  pendiente_pago: 'text-orange-400',
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function FacturacionClient({
  sitios,
  historial,
}: {
  sitios: SitioConSub[]
  historial: PagoHistorial[]
}) {
  const router = useRouter()
  const [modalCambiarPlan, setModalCambiarPlan] = useState<string | null>(null)
  const [modalEdicion, setModalEdicion] = useState<string | null>(null)
  const [loadingAction, setLoadingAction] = useState(false)
  const [error, setError] = useState('')

  const sitioById = (id: string | null) => sitios.find(s => s.id === id)

  async function iniciarCambioPlan(sitioId: string, nuevoPlan: string) {
    setLoadingAction(true)
    setError('')
    try {
      const res = await fetch('/api/pagos/cambiar-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sitioId, plan: nuevoPlan }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al procesar')
      if (data.checkoutUrl) window.location.href = data.checkoutUrl
    } catch (e: any) {
      setError(e.message)
      setLoadingAction(false)
    }
  }

  async function activarEdicion(sitioId: string, plan: string) {
    setLoadingAction(true)
    setError('')
    try {
      const res = await fetch('/api/suscripciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, sitioId }),
      })
      if (!res.ok) throw new Error('Error al activar')
      setModalEdicion(null)
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoadingAction(false)
    }
  }

  async function cancelarEdicion(sitioId: string) {
    setLoadingAction(true)
    try {
      await fetch('/api/suscripciones', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sitioId }),
      })
      router.refresh()
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingAction(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-indigo-400" />
          Facturación
        </h1>
        <p className="text-muted-foreground text-sm">
          Gestiona tus planes activos, suscripciones de edición e historial de pagos
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm flex items-center gap-2">
          <X className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* ── Planes activos ───────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Crown className="w-5 h-5 text-indigo-400" />
            Mis planes activos
          </h2>
          <Link
            href="/dashboard/nuevo"
            className="flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Agregar otro sitio
          </Link>
        </div>

        {sitios.length === 0 ? (
          <div className="glass rounded-2xl border border-white/5 p-12 text-center">
            <Globe className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No tienes sitios creados aún</p>
            <Link
              href="/dashboard/nuevo"
              className="btn-gradient text-white text-sm font-semibold px-6 py-2.5 rounded-xl inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Crear mi primer sitio
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sitios.map(sitio => (
              <SitioCard
                key={sitio.id}
                sitio={sitio}
                loadingAction={loadingAction}
                onCambiarPlan={() => setModalCambiarPlan(sitio.id)}
                onAgregarEdicion={() => setModalEdicion(sitio.id)}
                onCancelarEdicion={() => cancelarEdicion(sitio.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Historial de pagos ───────────────────────────────────────────── */}
      <section>
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-indigo-400" />
          Historial de pagos
        </h2>
        {historial.length === 0 ? (
          <div className="glass rounded-2xl border border-white/5 p-8 text-center text-muted-foreground text-sm">
            No tienes pagos registrados aún
          </div>
        ) : (
          <div className="glass rounded-2xl border border-white/5 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Plan</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Fecha</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Monto</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {historial.map(p => (
                  <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3 font-medium capitalize">
                      {PLAN_NOMBRES[p.plan as keyof typeof PLAN_NOMBRES] || p.plan}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatFecha(new Date(p.createdAt))}
                    </td>
                    <td className="px-4 py-3 font-mono">{formatCLP(p.monto)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.estado === 'aprobado'  ? 'bg-green-500/10  text-green-400'  :
                        p.estado === 'pendiente' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>{p.estado}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Modal: Cambiar Plan ───────────────────────────────────────────── */}
      {modalCambiarPlan && (
        <Modal onClose={() => !loadingAction && setModalCambiarPlan(null)}>
          <div className="p-6">
            <h3 className="font-bold text-xl mb-1">Cambiar plan</h3>
            <p className="text-slate-400 text-sm mb-6">
              <span className="text-white font-medium">{sitioById(modalCambiarPlan)?.nombre}</span>
              {' · '}Plan actual:{' '}
              <span className="font-semibold text-white">
                {PLAN_NOMBRES[sitioById(modalCambiarPlan)?.plan as keyof typeof PLAN_NOMBRES]}
              </span>
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {PLANES_DISPONIBLES.map(p => {
                const esActual = p.id === sitioById(modalCambiarPlan)?.plan
                const Icon = p.icon
                return (
                  <button
                    key={p.id}
                    onClick={() => !esActual && !loadingAction && iniciarCambioPlan(modalCambiarPlan, p.id)}
                    disabled={esActual || loadingAction}
                    className={cn(
                      'text-left rounded-2xl border p-4 transition-all relative',
                      esActual
                        ? 'opacity-50 cursor-not-allowed border-white/10 bg-white/3'
                        : `${p.color} hover:scale-[1.02] cursor-pointer`,
                    )}
                  >
                    {esActual && (
                      <div className="absolute top-2.5 right-2.5 text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/50">
                        actual
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-2.5">
                      <Icon className="w-4 h-4 text-slate-400" />
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${p.badge}`}>
                        {PLAN_NOMBRES[p.id as keyof typeof PLAN_NOMBRES]}
                      </span>
                      <span className="ml-auto font-bold text-sm">
                        {formatCLP(PLAN_PRECIOS[p.id as keyof typeof PLAN_PRECIOS])}
                      </span>
                    </div>
                    <ul className="space-y-1 mb-3">
                      {p.features.map((f, i) => (
                        <li key={i} className="text-xs text-slate-400 flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-green-400 shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                    {!esActual && (
                      <p className="text-xs text-indigo-400 font-medium flex items-center gap-1">
                        Cambiar a este plan <ArrowRight className="w-3 h-3" />
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
            {loadingAction && (
              <div className="flex items-center justify-center gap-2 mt-5 text-slate-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Redirigiendo a Flow.cl…
              </div>
            )}
            <p className="text-xs text-slate-600 text-center mt-4">
              Se cobrará el precio del nuevo plan. Luego podrás regenerar tu sitio con el nuevo diseño desde el editor.
            </p>
          </div>
        </Modal>
      )}

      {/* ── Modal: Plan de edición ────────────────────────────────────────── */}
      {modalEdicion && (
        <Modal onClose={() => !loadingAction && setModalEdicion(null)}>
          <div className="p-6">
            <h3 className="font-bold text-xl mb-1">Plan de edición mensual</h3>
            <p className="text-slate-400 text-sm mb-6">
              Para:{' '}
              <span className="text-white font-medium">{sitioById(modalEdicion)?.nombre}</span>
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {PLANES_EDICION.map(p => (
                <div key={p.id} className={`rounded-2xl border ${p.color} bg-white/3 p-5`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-sm font-semibold px-2.5 py-1 rounded-full ${p.badge}`}>
                      {p.nombre}
                    </span>
                    <div className="text-right">
                      <span className="text-xl font-black">{formatCLP(p.precio)}</span>
                      <span className="text-muted-foreground text-xs">/mes</span>
                    </div>
                  </div>
                  <p className="text-sm font-semibold mb-3">{p.ediciones}</p>
                  <ul className="space-y-1.5 mb-5">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-slate-300">
                        <Check className="w-3 h-3 text-green-400 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => activarEdicion(modalEdicion, p.id)}
                    disabled={loadingAction}
                    className="w-full py-2.5 rounded-xl btn-gradient text-white text-sm font-semibold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-60"
                  >
                    {loadingAction
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Zap className="w-4 h-4" />}
                    Activar {p.nombre}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── SitioCard ─────────────────────────────────────────────────────────────────
function SitioCard({
  sitio,
  loadingAction,
  onCambiarPlan,
  onAgregarEdicion,
  onCancelarEdicion,
}: {
  sitio: SitioConSub
  loadingAction: boolean
  onCambiarPlan: () => void
  onAgregarEdicion: () => void
  onCancelarEdicion: () => void
}) {
  const planNombre = PLAN_NOMBRES[sitio.plan as keyof typeof PLAN_NOMBRES] || sitio.plan
  const badge = PLAN_BADGE[sitio.plan] || PLAN_BADGE.basico
  const sub = sitio.suscripcion
  const subNombre = sub ? PLAN_NOMBRES[sub.plan as keyof typeof PLAN_NOMBRES] || sub.plan : null

  return (
    <div className="glass rounded-2xl border border-white/8 p-5">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">

        {/* Info del sitio */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white truncate">{sitio.nombre}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${badge}`}>
                  Plan {planNombre}
                </span>
                <span className={`text-xs ${ESTADO_COLOR[sitio.estado || ''] || 'text-slate-500'}`}>
                  · {(sitio.estado || '').replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Info suscripción */}
          {sub && sub.activa ? (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-1.5">
                <Zap className="w-3 h-3 text-green-400" />
                <span className="text-green-300 font-medium">Edición {subNombre}</span>
              </div>
              <span className="text-slate-500">
                {sub.edicionesUsadasEsteMes}/{sub.limiteEdiciones === -1 ? '∞' : sub.limiteEdiciones} ediciones este mes
              </span>
              {sub.fechaRenovacion && (
                <span className="text-slate-500">
                  · Renueva {formatFecha(new Date(sub.fechaRenovacion))}
                </span>
              )}
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-600">Sin plan de edición mensual</p>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {sitio.deployUrl && (
            <a
              href={sitio.deployUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors border border-white/8"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Ver sitio
            </a>
          )}
          <Link
            href={`/dashboard/sitios/${sitio.id}/editar`}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors border border-white/8"
          >
            Editar
          </Link>
          <button
            onClick={onCambiarPlan}
            disabled={loadingAction}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Cambiar plan
          </button>
          {sub?.activa ? (
            <button
              onClick={onCancelarEdicion}
              disabled={loadingAction}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-400 transition-colors disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" /> Cancelar edición
            </button>
          ) : (
            <button
              onClick={onAgregarEdicion}
              disabled={loadingAction}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 transition-colors disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" /> Plan de edición
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl glass rounded-2xl border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        {children}
      </div>
    </div>
  )
}
