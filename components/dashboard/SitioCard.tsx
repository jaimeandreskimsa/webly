'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Globe, ExternalLink, Edit2, Download, Clock,
  CheckCircle2, Loader2, AlertCircle, Trash2, Rocket, X, CreditCard,
} from 'lucide-react'
import { formatFecha } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Sitio } from '@/lib/db/schema'

const estadoConfig = {
  publicado: {
    label: 'Publicado',
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
    icon: CheckCircle2,
  },
  borrador: {
    label: 'Borrador',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
    icon: Clock,
  },
  generando: {
    label: 'Generando...',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
    icon: Loader2,
  },
  error: {
    label: 'Error',
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
    icon: AlertCircle,
  },
  pendiente_pago: {
    label: 'Pendiente de pago',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
    icon: CreditCard,
  },
}

const planColors = {
  basico: 'text-blue-400',
  pro: 'text-violet-400',
  premium: 'text-amber-400',
  broker: 'text-emerald-400',
}

function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative group/tip">
      {children}
      <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-900 border border-white/10 px-2 py-1 text-[10px] font-medium text-white opacity-0 group-hover/tip:opacity-100 transition-opacity z-20 shadow-lg">
        {label}
      </span>
    </div>
  )
}

interface SitioCardProps {
  sitio: Sitio
}

export function SitioCard({ sitio }: SitioCardProps) {
  const router = useRouter()
  const estado = estadoConfig[sitio.estado as keyof typeof estadoConfig] ?? estadoConfig.borrador
  const planColor = planColors[sitio.plan as keyof typeof planColors] ?? planColors.basico
  const contenido = (sitio.contenidoJson as any) ?? {}

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [deployError, setDeployError] = useState('')
  const [reanudando, setReanudando] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/sitios/${sitio.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      router.refresh()
    } catch {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  async function handleDeploy(e: React.MouseEvent) {
    e.stopPropagation()
    setDeploying(true)
    setDeployError('')
    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sitioId: sitio.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al desplegar')
      if (data.url) window.open(data.url, '_blank')
      router.refresh()
    } catch (err: any) {
      setDeployError(err.message)
    } finally {
      setDeploying(false)
    }
  }

  async function handleReanudarPago(e: React.MouseEvent) {
    e.stopPropagation()
    setReanudando(true)
    try {
      const res = await fetch('/api/pagos/reanudar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sitioId: sitio.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al reanudar pago')
      window.location.href = data.checkoutUrl
    } catch (err: any) {
      console.error('[reanudar pago]', err)
      setReanudando(false)
    }
  }

  return (
    <>
      <div className="glass rounded-2xl border border-white/5 p-5 group flex flex-col gap-4 hover:border-indigo-500/30 transition-all">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate">{sitio.nombre}</h3>
              <span className={cn('text-xs', planColor)}>Plan {sitio.plan}</span>
            </div>
          </div>

          {/* Status badge — clickable si está pendiente de pago */}
          {sitio.estado === 'pendiente_pago' ? (
            <button
              onClick={handleReanudarPago}
              disabled={reanudando}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border cursor-pointer hover:brightness-125 transition-all active:scale-95',
                estado.bg, estado.color
              )}
            >
              {reanudando
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <CreditCard className="w-3 h-3" />
              }
              {reanudando ? 'Iniciando...' : 'Pagar ahora →'}
            </button>
          ) : (
            <div className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border',
              estado.bg, estado.color
            )}>
              <estado.icon className={cn('w-3 h-3', sitio.estado === 'generando' && 'animate-spin')} />
              {estado.label}
            </div>
          )}
        </div>

        {/* Info */}
        {contenido.rubro && (
          <p className="text-xs text-muted-foreground bg-white/3 rounded-lg px-3 py-2">
            {contenido.rubro} · {contenido.ciudad || 'Chile'}
          </p>
        )}

        {/* Deploy URL */}
        {sitio.deployUrl && (
          <a
            href={sitio.deployUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            {sitio.deployUrl.replace('https://', '').slice(0, 35)}
          </a>
        )}

        {deployError && (
          <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{deployError}</p>
        )}

        {/* Footer — acciones */}
        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatFecha(sitio.updatedAt)}
          </span>

          <div className="flex items-center gap-1">
            <Tip label="Descargar ZIP">
              <a
                href={`/api/sitios/${sitio.id}/download`}
                onClick={e => e.stopPropagation()}
                className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-all"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            </Tip>

            <Tip label="Editar contenido">
              <Link
                href={`/dashboard/sitios/${sitio.id}/editar`}
                onClick={e => e.stopPropagation()}
                className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-all"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </Link>
            </Tip>

            <Tip label="Desplegar en Vercel">
              <button
                onClick={handleDeploy}
                disabled={deploying || sitio.estado === 'generando' || sitio.estado === 'pendiente_pago'}
                className="p-1.5 rounded-lg hover:bg-indigo-500/20 text-muted-foreground hover:text-indigo-400 transition-all disabled:opacity-40"
              >
                {deploying
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Rocket className="w-3.5 h-3.5" />
                }
              </button>
            </Tip>

            <Tip label="Eliminar sitio">
              <button
                onClick={e => { e.stopPropagation(); setConfirmDelete(true) }}
                className="p-1.5 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </Tip>
          </div>
        </div>
      </div>

      {/* Modal de confirmación de eliminación */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => !deleting && setConfirmDelete(false)}
        >
          <div
            className="glass rounded-2xl border border-red-500/30 p-6 max-w-sm w-full space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="text-muted-foreground hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h3 className="font-bold text-base mb-1">¿Eliminar este sitio?</h3>
              <p className="text-sm text-muted-foreground">
                <span className="text-white font-semibold">"{sitio.nombre}"</span> se eliminará
                permanentemente junto con todas sus versiones. Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl glass border border-white/10 text-sm font-medium hover:bg-white/10 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Eliminando...</>
                  : 'Sí, eliminar'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
