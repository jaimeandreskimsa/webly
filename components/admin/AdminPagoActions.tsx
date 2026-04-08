'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Loader2 } from 'lucide-react'

interface AdminPagoActionsProps {
  pagoId: string
  estado: string
}

export function AdminPagoActions({ pagoId, estado }: AdminPagoActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (estado !== 'pendiente') return null

  async function aprobar() {
    if (!confirm('Aprobar este pago manualmente?')) return
    setLoading(true)
    await fetch('/api/admin/pagos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pagoId, accion: 'aprobar' }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={aprobar}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
    >
      {loading
        ? <Loader2 className="w-3 h-3 animate-spin" />
        : <CheckCircle className="w-3 h-3" />
      }
      Aprobar
    </button>
  )
}
