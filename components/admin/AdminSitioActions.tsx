'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Trash2, MoreVertical, Eye, RotateCcw } from 'lucide-react'

interface AdminSitioActionsProps {
  sitioId: string
  estado: string
}

export function AdminSitioActions({ sitioId, estado }: AdminSitioActionsProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function regenerar() {
    setLoading(true)
    setOpen(false)
    await fetch('/api/admin/sitios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sitioId, accion: 'regenerar' }),
    })
    setLoading(false)
    router.refresh()
  }

  async function resetear() {
    setLoading(true)
    setOpen(false)
    await fetch('/api/admin/sitios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sitioId, accion: 'resetear' }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={loading}
        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all"
      >
        {loading
          ? <RefreshCw className="w-4 h-4 animate-spin" />
          : <MoreVertical className="w-4 h-4" />
        }
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-50 w-44 rounded-xl border border-slate-700 shadow-2xl overflow-hidden" style={{ backgroundColor: '#111827' }}>
            <div className="p-1">
              <a
                href={`/admin/sitios/${sitioId}`}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-white/10 text-slate-300 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                Ver sitio
              </a>
              {estado === 'generando' && (
                <button
                  onClick={resetear}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-white/10 text-amber-400 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Resetear estado
                </button>
              )}
              <button
                onClick={regenerar}
                disabled={estado === 'generando'}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-white/10 text-slate-300 transition-colors disabled:opacity-40"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                Regenerar con IA
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
