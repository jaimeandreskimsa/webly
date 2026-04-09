'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, Clock, RefreshCw, CheckCircle2 } from 'lucide-react'

export default function EsperandoPagoPage() {
  const params = useParams()
  const router = useRouter()
  const sitioId = params.id as string
  const [intentos, setIntentos] = useState(0)
  const [verificando, setVerificando] = useState(false)

  async function verificarPago() {
    try {
      // Consultar Flow directamente
      const res = await fetch('/api/pagos/verificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sitioId }),
      })
      const data = await res.json()
      if (data.aprobado) {
        router.push(`/dashboard/sitios/${sitioId}/configurar`)
        return true
      }
    } catch {}
    return false
  }

  useEffect(() => {
    // Poll cada 3s, máximo 20 intentos (60 segundos)
    const interval = setInterval(async () => {
      setIntentos(prev => {
        if (prev >= 20) { clearInterval(interval); return prev }
        return prev + 1
      })
      if (intentos < 20) await verificarPago()
    }, 3000)

    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sitioId])

  async function handleContinuar() {
    setVerificando(true)
    const ok = await verificarPago()
    if (!ok) {
      // Si Flow no confirma, ir igual al wizard (el pago pudo haberse confirmado)
      router.push(`/dashboard/sitios/${sitioId}/configurar`)
    }
    setVerificando(false)
  }

  return (
    <div className="min-h-screen bg-[#060810] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
          <Clock className="w-10 h-10 text-indigo-400 animate-pulse" />
        </div>

        <div>
          <h1 className="text-2xl font-black mb-2">Confirmando tu pago...</h1>
          <p className="text-muted-foreground text-sm">
            Verificando la transacción con Flow.cl. Esto puede tardar unos segundos.
          </p>
        </div>

        <div className="glass rounded-xl border border-white/5 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Verificando con Flow directamente...</span>
          </div>
          {intentos > 0 && (
            <p className="text-xs text-muted-foreground">
              {intentos} verificación{intentos !== 1 ? 'es' : ''} realizadas
            </p>
          )}
        </div>

        <button
          onClick={handleContinuar}
          disabled={verificando}
          className="flex items-center gap-2 mx-auto text-sm text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
        >
          {verificando
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <CheckCircle2 className="w-4 h-4" />
          }
          {verificando ? 'Verificando...' : 'Mi banco confirmó el pago, continuar →'}
        </button>

        <p className="text-xs text-muted-foreground">
          Si tu banco ya confirmó el pago, haz click arriba para continuar.
        </p>
      </div>
    </div>
  )
}
