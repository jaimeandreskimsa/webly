'use client'

import Link from 'next/link'
import {
  Globe, ExternalLink, Edit2, Download, Clock,
  CheckCircle2, Loader2, AlertCircle, ArrowRight
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
    label: 'Pendiente pago',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
    icon: Clock,
  },
}

const planColors = {
  basico: 'text-blue-400',
  pro: 'text-violet-400',
  premium: 'text-amber-400',
}

interface SitioCardProps {
  sitio: Sitio
}

export function SitioCard({ sitio }: SitioCardProps) {
  const estado = estadoConfig[sitio.estado as keyof typeof estadoConfig] ?? estadoConfig.borrador
  const planColor = planColors[sitio.plan as keyof typeof planColors] ?? planColors.basico
  const contenido = (sitio.contenidoJson as any) ?? {}

  return (
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

        {/* Status badge */}
        <div className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border',
          estado.bg, estado.color
        )}>
          <estado.icon className={cn('w-3 h-3', sitio.estado === 'generando' && 'animate-spin')} />
          {estado.label}
        </div>
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
          {sitio.deployUrl.replace('https://', '').slice(0, 35)}...
        </a>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-white/5">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatFecha(sitio.updatedAt)}
        </span>

        <div className="flex items-center gap-1">
          {/* Descargar ZIP */}
          <a
            href={`/api/sitios/${sitio.id}/download`}
            onClick={e => e.stopPropagation()}
            className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-all"
            title="Descargar ZIP"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
          {/* Editar */}
          <Link
            href={`/dashboard/sitios/${sitio.id}/editar`}
            onClick={e => e.stopPropagation()}
            className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-all"
            title="Editar contenido"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Link>
          {/* Ver detalle */}
          <Link
            href={`/dashboard/sitios/${sitio.id}`}
            onClick={e => e.stopPropagation()}
            className="p-1.5 rounded-lg hover:bg-indigo-500/20 text-muted-foreground hover:text-indigo-400 transition-all"
            title="Ver detalle"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
