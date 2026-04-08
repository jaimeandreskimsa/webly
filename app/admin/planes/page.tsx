'use client'

import { useEffect, useState } from 'react'
import {
  Package, Plus, Trash2, Save, Loader2, Check,
  Globe, Sparkles, Crown, Building2, AlertCircle, RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PlanConfig } from '@/app/api/admin/planes/route'

const planMeta: Record<string, { icon: any; color: string; border: string; bg: string }> = {
  basico:  { icon: Globe,      color: 'text-blue-400',    border: 'border-blue-500/30',   bg: 'bg-blue-500/10' },
  pro:     { icon: Sparkles,   color: 'text-violet-400',  border: 'border-violet-500/30', bg: 'bg-violet-500/10' },
  premium: { icon: Crown,      color: 'text-amber-400',   border: 'border-amber-500/30',  bg: 'bg-amber-500/10' },
  broker:  { icon: Building2,  color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
}

export default function PlanesAdminPage() {
  const [planes, setPlanes] = useState<PlanConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/planes')
      .then(r => r.json())
      .then((data: PlanConfig[]) => {
        setPlanes(data)
        setLoading(false)
      })
      .catch(() => {
        setError('Error al cargar los planes')
        setLoading(false)
      })
  }, [])

  function actualizarPlan(id: string, cambios: Partial<PlanConfig>) {
    setPlanes(prev => prev.map(p => p.id === id ? { ...p, ...cambios } : p))
    setGuardado(false)
  }

  function agregarFeature(planId: string) {
    const plan = planes.find(p => p.id === planId)
    if (!plan) return
    actualizarPlan(planId, { features: [...plan.features, ''] })
  }

  function editarFeature(planId: string, idx: number, valor: string) {
    const plan = planes.find(p => p.id === planId)
    if (!plan) return
    const features = [...plan.features]
    features[idx] = valor
    actualizarPlan(planId, { features })
  }

  function eliminarFeature(planId: string, idx: number) {
    const plan = planes.find(p => p.id === planId)
    if (!plan) return
    actualizarPlan(planId, { features: plan.features.filter((_, i) => i !== idx) })
  }

  function agregarLimitacion(planId: string) {
    const plan = planes.find(p => p.id === planId)
    if (!plan) return
    actualizarPlan(planId, { limitaciones: [...(plan.limitaciones || []), ''] })
  }

  function editarLimitacion(planId: string, idx: number, valor: string) {
    const plan = planes.find(p => p.id === planId)
    if (!plan) return
    const limitaciones = [...(plan.limitaciones || [])]
    limitaciones[idx] = valor
    actualizarPlan(planId, { limitaciones })
  }

  function eliminarLimitacion(planId: string, idx: number) {
    const plan = planes.find(p => p.id === planId)
    if (!plan) return
    actualizarPlan(planId, { limitaciones: (plan.limitaciones || []).filter((_, i) => i !== idx) })
  }

  async function guardarCambios() {
    setGuardando(true)
    setError('')
    try {
      const res = await fetch('/api/admin/planes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planes),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error al guardar')
      }
      setGuardado(true)
      setTimeout(() => setGuardado(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Error al guardar los planes')
    } finally {
      setGuardando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Package className="w-6 h-6 text-red-400" />
            Planes y Precios
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestiona los planes disponibles en la plataforma
          </p>
        </div>
        <button
          onClick={guardarCambios}
          disabled={guardando}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
            guardado
              ? 'bg-green-500/20 border border-green-500/30 text-green-300'
              : 'bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30',
            guardando && 'opacity-60 cursor-not-allowed'
          )}
        >
          {guardando ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
          ) : guardado ? (
            <><Check className="w-4 h-4" /> Guardado</>
          ) : (
            <><Save className="w-4 h-4" /> Guardar cambios</>
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {planes.map((plan) => {
          const meta = planMeta[plan.id] || planMeta.pro
          const Icon = meta.icon

          return (
            <div
              key={plan.id}
              className={cn(
                'rounded-2xl border p-6 space-y-5 transition-all',
                meta.bg, meta.border,
                !plan.activo && 'opacity-60'
              )}
            >
              {/* Plan header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', meta.bg, 'border', meta.border)}>
                    <Icon className={cn('w-5 h-5', meta.color)} />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">{plan.id}</span>
                    <div className="flex items-center gap-2">
                      <input
                        value={plan.nombre}
                        onChange={e => actualizarPlan(plan.id, { nombre: e.target.value })}
                        className="text-lg font-bold bg-transparent border-b border-transparent hover:border-white/20 focus:border-white/40 outline-none transition-colors w-32"
                        placeholder="Nombre"
                      />
                    </div>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-muted-foreground">{plan.activo ? 'Activo' : 'Inactivo'}</span>
                  <div
                    onClick={() => actualizarPlan(plan.id, { activo: !plan.activo })}
                    className={cn(
                      'w-10 h-6 rounded-full transition-colors cursor-pointer relative',
                      plan.activo ? 'bg-green-500/40' : 'bg-white/10'
                    )}
                  >
                    <div className={cn(
                      'absolute top-1 w-4 h-4 rounded-full transition-all',
                      plan.activo ? 'right-1 bg-green-400' : 'left-1 bg-white/30'
                    )} />
                  </div>
                </label>
              </div>

              {/* Descripción */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Descripción</label>
                <input
                  value={plan.descripcion}
                  onChange={e => actualizarPlan(plan.id, { descripcion: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/30 transition-colors"
                  placeholder="Descripción del plan"
                />
              </div>

              {/* Precio y Badge */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Precio (CLP)</label>
                  <input
                    type="number"
                    value={plan.precio}
                    onChange={e => actualizarPlan(plan.id, { precio: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/30 transition-colors font-mono"
                    placeholder="0"
                    min={0}
                    step={1000}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Badge (opcional)</label>
                  <input
                    value={plan.badge || ''}
                    onChange={e => actualizarPlan(plan.id, { badge: e.target.value || null })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/30 transition-colors"
                    placeholder="ej. MÁS POPULAR"
                  />
                </div>
              </div>

              {/* Precio formateado */}
              <div className="text-xs text-muted-foreground">
                Precio: <span className="text-white font-semibold">
                  {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(plan.precio)}
                </span>
              </div>

              {/* Features */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-muted-foreground font-semibold">✅ Incluye</label>
                  <button
                    onClick={() => agregarFeature(plan.id)}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Agregar
                  </button>
                </div>
                <div className="space-y-1.5">
                  {plan.features.map((f, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        value={f}
                        onChange={e => editarFeature(plan.id, idx, e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-white/30 transition-colors"
                        placeholder="Feature del plan"
                      />
                      <button
                        onClick={() => eliminarFeature(plan.id, idx)}
                        className="text-red-400/50 hover:text-red-400 transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Limitaciones */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-muted-foreground font-semibold">❌ Limitaciones</label>
                  <button
                    onClick={() => agregarLimitacion(plan.id)}
                    className="flex items-center gap-1 text-xs text-red-400/70 hover:text-red-400 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Agregar
                  </button>
                </div>
                <div className="space-y-1.5">
                  {(plan.limitaciones || []).map((l, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        value={l}
                        onChange={e => editarLimitacion(plan.id, idx, e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-white/30 transition-colors"
                        placeholder="Limitación del plan"
                      />
                      <button
                        onClick={() => eliminarLimitacion(plan.id, idx)}
                        className="text-red-400/50 hover:text-red-400 transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {(plan.limitaciones || []).length === 0 && (
                    <p className="text-xs text-muted-foreground italic">Sin limitaciones</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Save button bottom */}
      <div className="flex justify-end pt-2 pb-6">
        <button
          onClick={guardarCambios}
          disabled={guardando}
          className={cn(
            'flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all',
            guardado
              ? 'bg-green-500/20 border border-green-500/30 text-green-300'
              : 'bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30',
            guardando && 'opacity-60 cursor-not-allowed'
          )}
        >
          {guardando ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
          ) : guardado ? (
            <><Check className="w-4 h-4" /> ¡Cambios guardados!</>
          ) : (
            <><Save className="w-4 h-4" /> Guardar todos los cambios</>
          )}
        </button>
      </div>
    </div>
  )
}
