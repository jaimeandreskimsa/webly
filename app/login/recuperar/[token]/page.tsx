'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Zap, Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react'

export default function NuevaPasswordPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [exito, setExito] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/recuperar/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setExito(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch (err: any) {
      setError(err.message || 'Error al cambiar contraseña')
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
          <h1 className="text-2xl font-bold mb-2">Nueva contraseña</h1>
          <p className="text-muted-foreground text-sm">Elige una contraseña segura para tu cuenta</p>
        </div>

        <div className="glass rounded-2xl border border-white/5 p-8">
          {exito ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-green-500/15 border border-green-500/25 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-green-400" />
              </div>
              <div>
                <p className="font-bold text-lg">¡Contraseña actualizada!</p>
                <p className="text-sm text-muted-foreground mt-2">Redirigiendo al login...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">Nueva contraseña</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirmar contraseña</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={confirmar}
                  onChange={e => setConfirmar(e.target.value)}
                  placeholder="Repite la contraseña"
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
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                  : <>Guardar nueva contraseña</>
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
