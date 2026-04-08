'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, Clock, RefreshCw } from 'lucide-react'

export default function EsperandoPagoPage() {
  const params = useParams()
  const router = useRouter()
  const sitioId = params.id as string
  const [intentos, setIntentos] = useState(0)

  useEffect(() => {
    // Poll cada 3 segundos para ver si el pago fue confirmado
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/sitios/${sitioId}`)
        if (!res.ok) return
        const { sitio } = await res.json()
        // Si el estado ya no es pendiente_pago, el webhook llegó
        if (sitio.estado !== 'pendiente_pago') {
          clearInterval(interval)
          router.push(`/dashboard/sitios/${sitioId}/configurar`)
        }
        setIntentos(p => p + 1)
      } catch { }
    }, 3000)

    return () => clearInterval(interval)
  }, [sitioId, router])

  return (
    <div className="min-h-screen bg-[#060810] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
          <Clock className="w-10 h-10 text-indigo-400 animate-pulse" />
        </div>

        <div>
          <h1 className="text-2xl font-black mb-2">Confirmando tu pago...</h1>
          <p className="text-muted-foreground text-sm">
            Flow.cl está procesando la transacción. Esto puede tardar unos segundos.
          </p>
        </div>

        <div className="glass rounded-xl border border-white/5 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Verificando confirmación de pago...</span>
          </div>
          {intentos > 0 && (
            <p className="text-xs text-muted-foreground">
              Verificando... ({intentos} verificaciones)
            </p>
          )}
        </div>

        <button
          onClick={() => router.push(`/dashboard/sitios/${sitioId}/configurar`)}
          className="flex items-center gap-2 mx-auto text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          El pago ya fue confirmado, continuar →
        </button>

        <p className="text-xs text-muted-foreground">
          Si tu banco confirmó el pago, haz click en "continuar" arriba.
        </p>
      </div>
    </div>
  )
}
