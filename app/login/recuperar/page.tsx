'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Zap, ArrowLeft, Loader2, CheckCircle2, Mail } from 'lucide-react'

export default function RecuperarPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await fetch('/api/auth/recuperar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setEnviado(true)
    } catch {
      setError('Error al enviar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#080B14] bg-grid flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="orb absolute top-1/4 -left-20 w-72 h-72 bg-indigo-600/15" />
        <div className="orb absolute bottom-1/4 -right-20 w-72 h-72 bg-purple-600/15" style={{ animationDelay: '3s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-black gradient-text">WeblyNow</span>
          </Link>
          <h1 className="text-2xl font-bold mb-2">Recuperar contraseña</h1>
          <p className="text-muted-foreground text-sm">
            Ingresa tu email y te enviamos un enlace para restablecer tu contraseña
          </p>
        </div>

        <div className="glass rounded-2xl border border-white/5 p-8">
          {enviado ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-green-500/15 border border-green-500/25 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-green-400" />
              </div>
              <div>
                <p className="font-bold text-lg">¡Revisa tu bandeja!</p>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Si <span className="text-white">{email}</span> tiene una cuenta activa, recibirás un correo con el enlace en los próximos minutos.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white/3 rounded-lg px-3 py-2.5">
                <Mail className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                <p>Revisa también la carpeta de spam si no lo encuentras.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">Tu email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 transition-all"
                />
              </div>
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-gradient text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.02] transition-transform"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                  : <>Enviar enlace de recuperación</>
                }
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center justify-center gap-1.5 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al login
          </Link>
        </p>
      </div>
    </div>
  )
}
