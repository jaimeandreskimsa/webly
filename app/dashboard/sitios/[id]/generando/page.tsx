'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Loader2, Zap, CheckCircle2, AlertCircle } from 'lucide-react'

// Estimación de chars totales por plan (tokens × 4 chars aprox.)
const CHARS_ESPERADOS: Record<string, number> = {
  basico: 30_000,
  pro: 60_000,
  premium: 110_000,
  broker: 80_000,
}

const frasesGenerando = [
  'Analizando el contenido de tu negocio...',
  'Diseñando la estructura del sitio...',
  'Aplicando animaciones GSAP...',
  'Optimizando para SEO...',
  'Generando el código HTML...',
  'Agregando los efectos visuales...',
  'Ajustando tipografías y colores...',
  'Revisando responsive design...',
  'Últimos toques de calidad...',
  'Tu sitio está casi listo...',
]

function GenerandoContent() {
  const router = useRouter()
  const params = useParams()
  const sitioId = params.id as string

  const [progreso, setProgreso] = useState(0)
  const [fraseIndex, setFraseIndex] = useState(0)
  const [estado, setEstado] = useState<'generando' | 'listo' | 'error'>('generando')
  const [errorMsg, setErrorMsg] = useState('')
  const [iniciado, setIniciado] = useState(false)
  const charsRef = useRef(0)
  const completedRef = useRef(false)
  const planRef = useRef<string>('pro')

  // Progreso suave base (avanza despacio independientemente de los chunks)
  useEffect(() => {
    if (estado !== 'generando') return
    const iv = setInterval(() => {
      setProgreso(p => {
        if (completedRef.current) return p
        if (p < 30)  return Math.min(30,  p + 1.2)   // llega a 30% en ~50s
        if (p < 60)  return Math.min(60,  p + 0.5)   // llega a 60% en ~60s más
        if (p < 88)  return Math.min(88,  p + 0.18)  // llega a 88% en ~3 min más
        // Después de 88%: micro-movimiento para que no parezca frozen
        return Math.min(96, p + 0.04)
      })
    }, 2000)
    return () => clearInterval(iv)
  }, [estado])

  // Rotar frases mientras genera
  useEffect(() => {
    if (estado !== 'generando') return
    const iv = setInterval(() => {
      setFraseIndex(i => (i + 1) % frasesGenerando.length)
    }, 3000)
    return () => clearInterval(iv)
  }, [estado])

  useEffect(() => {
    if (iniciado) return
    setIniciado(true)

    const es = new EventSource(`/api/generar?sitioId=${sitioId}`)

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)

        // Progreso real por chars: solo avanza si supera el progreso actual
        if (data.chunk) {
          charsRef.current += data.chunk.length
          const esperado = CHARS_ESPERADOS[planRef.current] ?? 60_000
          const pctReal = Math.min(88, (charsRef.current / esperado) * 100)
          setProgreso(p => Math.max(p, pctReal))
        }

        if (data.plan) {
          planRef.current = data.plan
        }

        if (data.done) {
          completedRef.current = true
          setProgreso(100)
          setEstado('listo')
          es.close()
          setTimeout(() => router.push(`/dashboard/sitios/${sitioId}`), 2000)
        }

        if (data.error) {
          completedRef.current = true
          setErrorMsg(data.error)
          setEstado('error')
          es.close()
        }
      } catch {}
    }

    es.onerror = () => {
      // EventSource dispara onerror cuando el server cierra la conexión limpiamente.
      // Esperamos 300ms para que onmessage (done/error) se procese primero.
      setTimeout(() => {
        if (!completedRef.current) {
          es.close()
          setErrorMsg('La conexión con el servidor fue interrumpida. Intenta de nuevo.')
          setEstado('error')
        }
      }, 300)
    }

    return () => {
      if (!completedRef.current) es.close()
    }
  }, [sitioId, iniciado, router])

  return (
    <div className="min-h-screen bg-[#080B14] bg-grid flex items-center justify-center">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="orb absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15" />
        <div className="orb absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/15" style={{ animationDelay: '3s' }} />
      </div>

      <div className="relative z-10 max-w-lg w-full mx-4 text-center">
        {estado === 'generando' && (
          <>
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-8 glow-purple">
              <Zap className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-3xl font-black mb-3">
              <span className="gradient-text">Claude está creando</span>
              <br />tu sitio web
            </h1>
            <p className="text-muted-foreground mb-10">
              La IA está trabajando en tu sitio. Esto puede tomar entre 1 y 3 minutos.
            </p>

            {/* Progress bar */}
            <div className="glass rounded-2xl border border-white/5 p-6 mb-6">
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-muted-foreground">{frasesGenerando[fraseIndex]}</span>
                <span className="font-mono text-indigo-400">{Math.round(progreso)}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${progreso}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              No cierres esta ventana
            </div>
          </>
        )}

        {estado === 'listo' && (
          <>
            <div className="w-20 h-20 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-3xl font-black gradient-text mb-3">¡Tu sitio está listo!</h1>
            <p className="text-muted-foreground">
              Redirigiendo a tu sitio...
            </p>
          </>
        )}

        {estado === 'error' && (
          <>
            <div className="w-20 h-20 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-8">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Hubo un error</h1>
            <p className="text-muted-foreground mb-3">
              No pudimos generar tu sitio. Por favor intenta nuevamente.
            </p>
            {errorMsg && (
              <p className="text-xs text-red-400/80 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6 font-mono break-all">
                {errorMsg}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="btn-gradient text-white font-semibold px-6 py-3 rounded-xl"
              >
                Intentar de nuevo
              </button>
              <button
                onClick={() => router.push(`/dashboard/sitios/${sitioId}`)}
                className="text-muted-foreground hover:text-white border border-white/10 hover:border-white/20 px-6 py-3 rounded-xl transition-colors text-sm"
              >
                Ver sitio de todas formas
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function GenerandoPage() {
  return (
    <Suspense>
      <GenerandoContent />
    </Suspense>
  )
}
