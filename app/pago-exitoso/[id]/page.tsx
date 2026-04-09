'use client'

import { Suspense, useEffect, useState, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

/**
 * Landing público después del redirect de Flow.
 * Flow redirige a: /pago-exitoso/{sitioId}?token=FLOW_TOKEN
 * Leemos ese token y lo usamos para verificar el pago directamente con Flow
 * sin depender del insert async a la DB (que puede tener race condition).
 */
function PagoExitosoContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const sitioId = params.id as string
  // ⬇️ CRÍTICO: Flow incluye el token en la URL de retorno (?token=XXXX)
  const flowToken = searchParams.get('token') || ''

  const [mensaje, setMensaje] = useState('Verificando tu pago...')
  const [error, setError] = useState('')
  const [mostrarBoton, setMostrarBoton] = useState(false)
  const [intentos, setIntentos] = useState(0)
  const stoppedRef = useRef(false)

  useEffect(() => {
    let count = 0

    async function verificar() {
      if (stoppedRef.current) return
      count++
      setIntentos(count)

      try {
        const res = await fetch('/api/pagos/verificar-pago-exitoso', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Pasamos el flowToken de la URL → el endpoint lo usa para llamar Flow directamente
          body: JSON.stringify({ sitioId, flowToken }),
        })
        const data = await res.json()

        if (stoppedRef.current) return

        if (data.sinSesion) {
          stoppedRef.current = true
          // Preservamos el token en el callbackUrl para recuperarlo después del login
          const dest = flowToken
            ? `/pago-exitoso/${sitioId}?token=${flowToken}`
            : `/pago-exitoso/${sitioId}`
          router.replace(`/login?callbackUrl=${encodeURIComponent(dest)}`)
          return
        }

        if (data.listo) {
          stoppedRef.current = true
          setMensaje('¡Pago confirmado! Redirigiendo al wizard...')
          setTimeout(() => router.replace(`/dashboard/sitios/${sitioId}/configurar`), 1000)
          return
        }

        if (data.yaGenerando) {
          stoppedRef.current = true
          setMensaje('Tu sitio ya está generándose...')
          setTimeout(() => router.replace(`/dashboard/sitios/${sitioId}/generando`), 1000)
          return
        }

        if (data.yaPublicado) {
          stoppedRef.current = true
          setMensaje('Tu sitio ya está publicado 🎉')
          setTimeout(() => router.replace(`/dashboard/sitios/${sitioId}`), 1000)
          return
        }

        if (count < 15) {
          setMensaje(`Verificando con Flow... (${count}/15)`)
          setTimeout(verificar, 2500)
        } else {
          stoppedRef.current = true
          setError(
            data.error
              ? `Error: ${data.error}`
              : 'El pago está siendo procesado. Puede tomar unos minutos en confirmarse.'
          )
          setMostrarBoton(true)
        }
      } catch {
        if (!stoppedRef.current && count < 15) {
          setTimeout(verificar, 2500)
        } else if (!stoppedRef.current) {
          stoppedRef.current = true
          setError('No se pudo verificar el pago. Por favor, revisa tu correo de confirmación.')
          setMostrarBoton(true)
        }
      }
    }

    verificar()

    return () => {
      stoppedRef.current = true
    }
  }, [sitioId, flowToken, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="bg-slate-800/60 backdrop-blur border border-slate-700 rounded-2xl p-10 max-w-md w-full text-center shadow-2xl">
        {error ? (
          <>
            <AlertCircle className="w-14 h-14 text-amber-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-3">Pago en proceso</h1>
            <p className="text-slate-300 mb-6 text-sm leading-relaxed">{error}</p>
            {mostrarBoton && (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => router.replace(`/dashboard/sitios/${sitioId}/configurar`)}
                  className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold transition-colors"
                >
                  Continuar de todas formas →
                </button>
                <button
                  onClick={() => router.replace('/dashboard')}
                  className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm transition-colors"
                >
                  Ir al dashboard
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              {intentos === 0 ? (
                <CheckCircle2 className="w-14 h-14 text-violet-400 animate-pulse" />
              ) : (
                <Loader2 className="w-14 h-14 text-violet-400 animate-spin" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">
              {intentos === 0 ? '¡Pago recibido!' : 'Confirmando pago'}
            </h1>
            <p className="text-slate-300 text-sm">{mensaje}</p>
            {intentos > 0 && (
              <div className="mt-6 flex gap-1.5 justify-center">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div
                    key={i}
                    className={"h-1.5 w-5 rounded-full transition-all duration-300 " +
                      (i < intentos ? "bg-violet-500" : "bg-slate-700")}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// useSearchParams() necesita Suspense en Next.js 13+
export default function PagoExitosoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-violet-400 animate-spin" />
        </div>
      }
    >
      <PagoExitosoContent />
    </Suspense>
  )
}
