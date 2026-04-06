'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Clock, Mail, MessageSquare, Trash2, Eye } from 'lucide-react'
import { formatFecha } from '@/lib/utils'

interface Solicitud {
  id: string
  tipo: string | null
  mensaje: string | null
  leida: boolean | null
  atendida: boolean | null
  createdAt: Date
  userId: string
  usuarioNombre: string | null
  usuarioEmail: string | null
}

export function SolicitudesAdminClient({ solicitudes: inicial }: { solicitudes: Solicitud[] }) {
  const router = useRouter()
  const [solicitudes, setSolicitudes] = useState(inicial)
  const [loading, setLoading] = useState<string | null>(null)

  async function accion(id: string, tipo: 'marcar_leida' | 'marcar_atendida' | 'eliminar') {
    setLoading(id + tipo)
    try {
      if (tipo === 'eliminar') {
        await fetch(`/api/admin/solicitudes/${id}`, { method: 'DELETE' })
        setSolicitudes(prev => prev.filter(s => s.id !== id))
      } else {
        await fetch(`/api/admin/solicitudes/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accion: tipo }),
        })
        setSolicitudes(prev => prev.map(s => {
          if (s.id !== id) return s
          if (tipo === 'marcar_leida') return { ...s, leida: true }
          if (tipo === 'marcar_atendida') return { ...s, leida: true, atendida: true }
          return s
        }))
      }
    } finally {
      setLoading(null)
      router.refresh()
    }
  }

  if (solicitudes.length === 0) {
    return (
      <div className="bg-white/3 border border-white/5 rounded-2xl p-12 text-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
        <p className="text-white font-medium">Todo al día</p>
        <p className="text-slate-500 text-sm mt-1">No hay solicitudes de ayuda registradas</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {solicitudes.map(s => (
        <div
          key={s.id}
          className={`rounded-2xl border p-5 transition-all ${
            s.atendida
              ? 'bg-white/2 border-white/5 opacity-60'
              : s.leida
              ? 'bg-white/3 border-white/8'
              : 'bg-indigo-500/5 border-indigo-500/25'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            {/* Info usuario */}
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {(s.usuarioNombre || '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-white text-sm">{s.usuarioNombre || 'Usuario'}</p>
                  {!s.leida && (
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium">
                      Nueva
                    </span>
                  )}
                  {s.atendida && (
                    <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                      Atendida
                    </span>
                  )}
                </div>
                <a
                  href={`mailto:${s.usuarioEmail}`}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-0.5"
                >
                  <Mail className="w-3 h-3" />
                  {s.usuarioEmail}
                </a>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatFecha(s.createdAt.toString())}
                </p>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-2 shrink-0">
              {!s.leida && (
                <button
                  onClick={() => accion(s.id, 'marcar_leida')}
                  disabled={loading === s.id + 'marcar_leida'}
                  title="Marcar como leída"
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}
              {!s.atendida && (
                <button
                  onClick={() => accion(s.id, 'marcar_atendida')}
                  disabled={loading === s.id + 'marcar_atendida'}
                  title="Marcar como atendida"
                  className="p-2 rounded-lg hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => accion(s.id, 'eliminar')}
                disabled={loading === s.id + 'eliminar'}
                title="Eliminar"
                className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mensaje del cliente */}
          {s.mensaje && (
            <div className="mt-4 flex items-start gap-2 bg-white/5 rounded-xl p-3">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-300 leading-relaxed">{s.mensaje}</p>
            </div>
          )}

          {/* Botón responder por email */}
          {!s.atendida && (
            <div className="mt-4 flex items-center gap-3">
              <a
                href={`mailto:${s.usuarioEmail}?subject=Ayuda con Vercel y dominio - WeblyNow&body=Hola ${s.usuarioNombre},%0D%0A%0D%0ARecibimos tu solicitud de ayuda para configurar Vercel y tu dominio.%0D%0A%0D%0ASaludos,%0D%0AEquipo WeblyNow`}
                onClick={() => accion(s.id, 'marcar_leida')}
                className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                Responder por email
              </a>
              <span className="text-slate-700">·</span>
              <button
                onClick={() => accion(s.id, 'marcar_atendida')}
                className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Marcar como atendida
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
