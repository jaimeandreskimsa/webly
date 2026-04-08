'use client'

import { useEffect, useState, useRef, useCallback, Suspense } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Loader2, Zap, CheckCircle2, AlertCircle, ChevronRight, Terminal } from 'lucide-react'

// Estimación de chars totales por plan (tokens × 4 chars aprox.)
const CHARS_ESPERADOS: Record<string, number> = {
  basico: 30_000,
  pro: 60_000,
  premium: 110_000,
  broker: 80_000,
}

// Mensaje real basado en el porcentaje de progreso
function fraseSegunProgreso(p: number): string {
  if (p >= 100) return 'Sitio generado exitosamente'
  if (p < 5)  return 'Conectando con Claude AI...'
  if (p < 15) return 'Analizando los datos de tu negocio...'
  if (p < 25) return 'Definiendo la estructura de páginas...'
  if (p < 38) return 'Generando el HTML y semántica...'
  if (p < 52) return 'Escribiendo los estilos CSS...'
  if (p < 65) return 'Aplicando animaciones y efectos...'
  if (p < 75) return 'Agregando JavaScript e interactividad...'
  if (p < 85) return 'Optimizando para SEO y mobile...'
  if (p < 95) return 'Revisando el código final...'
  return 'Guardando tu sitio...'
}

function GenerandoContent() {
  const router = useRouter()
  const params = useParams()
  const sitioId = params.id as string

  const [progreso, setProgreso] = useState(0)
  const [estado, setEstado] = useState<'generando' | 'listo' | 'error'>('generando')
  const [errorMsg, setErrorMsg] = useState('')
  const [iniciado, setIniciado] = useState(false)
  const [htmlOutput, setHtmlOutput] = useState('')
  const [promptText, setPromptText] = useState('')
  const [showPrompt, setShowPrompt] = useState(false)
  const [modeloInfo, setModeloInfo] = useState('claude-sonnet-4-6')
  const charsRef = useRef(0)
  const completedRef = useRef(false)
  const planRef = useRef<string>('pro')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const terminalRef = useRef<HTMLDivElement>(null)
  const lastChunkTimeRef = useRef<number>(Date.now())
  const hasReceivedChunksRef = useRef(false)

  // Marcar como completado: anima suavemente hasta 100% y redirige
  const marcarCompletado = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    // Animar progreso hasta 100% suavemente
    const animateToComplete = () => {
      setProgreso(prev => {
        if (prev >= 100) {
          setEstado('listo')
          setTimeout(() => router.push(`/dashboard/sitios/${sitioId}`), 1800)
          return 100
        }
        const step = Math.max(1, (100 - prev) * 0.3)
        requestAnimationFrame(animateToComplete)
        return Math.min(100, prev + step)
      })
    }
    requestAnimationFrame(animateToComplete)
  }, [router, sitioId])

  // Restaurar progreso de sessionStorage al montar (persiste entre navegaciones).
  useEffect(() => {
    const key = `gen_progress_${sitioId}`
    const stored = sessionStorage.getItem(key)
    if (stored) {
      const p = parseFloat(stored)
      if (p > 0 && p < 100) {
        setProgreso(p)
        // Marcar que ya recibimos chunks si el progreso guardado era significativo
        if (p > 10) hasReceivedChunksRef.current = true
      }
    }
  }, [sitioId])

  // Persistir progreso en sessionStorage mientras genera
  useEffect(() => {
    const key = `gen_progress_${sitioId}`
    if (progreso > 1 && estado === 'generando') {
      sessionStorage.setItem(key, String(Math.round(progreso * 10) / 10))
    } else if (estado === 'listo') {
      sessionStorage.removeItem(key)
    }
  }, [progreso, estado, sitioId])

  // Auto-scroll terminal al recibir nuevo código
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [htmlOutput])

  // Safety net: si los chunks dejaron de llegar pero done nunca llegó,
  // polleamos DB directamente para detectar la finalización.
  useEffect(() => {
    if (estado !== 'generando') return
    const check = setInterval(() => {
      if (completedRef.current) return
      // Si no hemos recibido chunks aún, solo pollear después de 15s (tolerancia de arranque)
      if (!hasReceivedChunksRef.current) {
        const sinceStart = Date.now() - lastChunkTimeRef.current
        if (sinceStart < 15000) return
      } else {
        const sinceChunk = Date.now() - lastChunkTimeRef.current
        if (sinceChunk < 5000) return // chunks recientes — esperar
      }
      // Pollear DB para detectar finalización
      fetch(`/api/sitios/${sitioId}`)
        .then(r => { if (!r.ok) throw new Error(); return r.json() })
        .then(({ sitio: s }) => {
          if (completedRef.current) return
          if (s?.estado === 'borrador' || s?.estado === 'publicado') {
            marcarCompletado()
          } else if (s?.estado === 'error') {
            completedRef.current = true
            setErrorMsg('El servidor encontró un error al guardar el sitio.')
            setEstado('error')
          }
        })
        .catch(() => {})
    }, 2500)
    return () => clearInterval(check)
  }, [estado, sitioId, marcarCompletado])

  // Progreso suave base (avanza despacio independientemente de los chunks)
  useEffect(() => {
    if (estado !== 'generando') return
    const iv = setInterval(() => {
      setProgreso(p => {
        if (completedRef.current) return p
        if (p < 20)  return Math.min(20,  p + 0.8)   // llega a 20% en ~50s
        if (p < 50)  return Math.min(50,  p + 0.4)    // llega a 50% en ~2.5 min
        if (p < 80)  return Math.min(80,  p + 0.15)   // llega a 80% en ~4 min
        if (p < 92)  return Math.min(92,  p + 0.08)   // llega a 92% lentamente
        // Después de 92%: avanza muy lento hacia 98% máx (nunca 99 para que no parezca pegado)
        return Math.min(98, p + 0.04)
      })
    }, 2000)
    return () => clearInterval(iv)
  }, [estado])

  useEffect(() => {
    if (iniciado) return
    setIniciado(true)

    const es = new EventSource(`/api/generar?sitioId=${sitioId}`)

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)

        // Catch-up al reconectar: un solo mensaje con todo el HTML acumulado
        if (data.catchup) {
          const len = (data.catchup as string).length
          charsRef.current = len
          hasReceivedChunksRef.current = true
          lastChunkTimeRef.current = Date.now()
          setHtmlOutput(data.catchup)
          const esperado = CHARS_ESPERADOS[planRef.current] ?? 60_000
          setProgreso(prev => Math.max(prev, Math.min(88, (len / esperado) * 100)))
        }

        if (data.chunk) {
          charsRef.current += data.chunk.length
          hasReceivedChunksRef.current = true
          lastChunkTimeRef.current = Date.now()
          const esperado = CHARS_ESPERADOS[planRef.current] ?? 60_000
          const pctReal = Math.min(88, (charsRef.current / esperado) * 100)
          setProgreso(p => Math.max(p, pctReal))
          setHtmlOutput(prev => {
            const next = prev + data.chunk
            return next.length > 120_000 ? next.slice(-120_000) : next
          })
        }

        if (data.prompt) {
          setPromptText(data.prompt)
        }

        if (data.plan) {
          planRef.current = data.plan
        }

        if (data.done) {
          es.close()
          marcarCompletado()
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
      // EventSource se desconectó. La generación sigue en background.
      // Cambiamos a polling HTTP.
      setTimeout(() => {
        if (completedRef.current) return
        es.close()
        if (pollRef.current) clearInterval(pollRef.current)
        pollRef.current = setInterval(async () => {
          try {
            const res = await fetch(`/api/sitios/${sitioId}`)
            if (!res.ok) return
            const { sitio: s } = await res.json()
            if (s?.estado === 'borrador' || s?.estado === 'publicado') {
              clearInterval(pollRef.current!)
              marcarCompletado()
            } else if (s?.estado === 'error') {
              clearInterval(pollRef.current!)
              completedRef.current = true
              setErrorMsg('El servidor encontró un error generando el sitio.')
              setEstado('error')
            }
          } catch {}
        }, 2500)
      }, 300)
    }

    return () => {
      if (!completedRef.current) es.close()
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [sitioId, iniciado, router, marcarCompletado])

  return (
    <div className="min-h-screen bg-[#080B14] bg-grid flex items-center justify-center">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="orb absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15" />
        <div className="orb absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/15" style={{ animationDelay: '3s' }} />
      </div>

      <div className="relative z-10 max-w-2xl w-full mx-4 text-center">
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
                <span className="text-muted-foreground">{fraseSegunProgreso(progreso)}</span>
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
              Puedes navegar — el proceso sigue en segundo plano
            </div>

            {/* ── Terminal constructor en tiempo real ── */}
            <div className="mt-6 rounded-2xl overflow-hidden border border-white/8 shadow-2xl text-left">
              {/* Barra de título estilo Mac */}
              <div className="flex items-center gap-2 px-4 py-3 bg-[#1a1d2e] border-b border-white/6">
                <span className="w-3 h-3 rounded-full bg-red-500/90" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/90" />
                <span className="w-3 h-3 rounded-full bg-green-500/90" />
                <div className="ml-3 flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400/70" />
                  <span className="text-xs text-white/40 font-mono">
                    {modeloInfo} · plan {planRef.current}
                  </span>
                </div>
                {/* Toggle prompt */}
                {promptText && (
                  <button
                    onClick={() => setShowPrompt(p => !p)}
                    className="ml-auto flex items-center gap-1 text-[11px] text-indigo-400/60 hover:text-indigo-300 transition-colors"
                  >
                    <ChevronRight className={`w-3 h-3 transition-transform ${showPrompt ? 'rotate-90' : ''}`} />
                    {showPrompt ? 'Ocultar prompt' : 'Ver prompt'}
                  </button>
                )}
              </div>

              {/* Prompt colapsable */}
              {showPrompt && promptText && (
                <div className="bg-[#0e1118] border-b border-white/5 px-4 py-3 max-h-40 overflow-auto">
                  <p className="text-[10px] text-indigo-300/50 font-mono uppercase tracking-wider mb-2">Prompt enviado a Claude</p>
                  <pre className="text-[11px] text-white/35 font-mono whitespace-pre-wrap leading-relaxed">
                    {promptText}
                  </pre>
                </div>
              )}

              {/* Output de código en vivo */}
              <div
                ref={terminalRef}
                className="h-72 overflow-auto bg-[#090c14] px-4 py-3"
              >
                {htmlOutput ? (
                  <pre className="text-[11px] font-mono leading-relaxed whitespace-pre-wrap break-all">
                    {/* Colorear por tokens HTML de forma simple */}
                    {htmlOutput.split(/(<[^>]+>)/g).map((part, i) =>
                      part.startsWith('<') ? (
                        <span key={i} className="text-indigo-300/80">{part}</span>
                      ) : (
                        <span key={i} className="text-emerald-300/60">{part}</span>
                      )
                    )}
                    {estado === 'generando' && (
                      <span className="animate-pulse text-indigo-400 font-bold">▌</span>
                    )}
                  </pre>
                ) : (
                  <div className="flex items-center gap-2 h-full text-white/20 font-mono text-xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Esperando respuesta de Claude AI...
                  </div>
                )}
              </div>
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
