'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Zap, Eye, EyeOff, ArrowRight, Loader2, Check } from 'lucide-react'

const planesInfo = {
  basico:  { nombre: 'Básico',  precio: '$50.000',   color: 'text-blue-400'    },
  pro:     { nombre: 'Pro',     precio: '$100.000',  color: 'text-violet-400'  },
  premium: { nombre: 'Premium', precio: '$300.000',  color: 'text-amber-400'  },
  broker:  { nombre: 'Broker',  precio: '$700.000',  color: 'text-emerald-400' },
}

function RegistroContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planParam = (searchParams.get('plan') || 'pro') as keyof typeof planesInfo
  const planInfo = planesInfo[planParam] ?? planesInfo['pro']

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ nombre: '', email: '', password: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // 1. Crear cuenta
    const res = await fetch('/api/auth/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Error al crear la cuenta')
      setLoading(false)
      return
    }

    // 2. Auto login
    const loginResult = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    })

    if (loginResult?.error) {
      router.push('/login')
      return
    }

    // 3. Redirigir al pago o dashboard
    router.push(`/dashboard/nuevo?plan=${planParam}`)
  }

  return (
    <div className="min-h-screen bg-[#080B14] bg-grid flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="orb absolute top-1/4 -left-20 w-72 h-72 bg-purple-600/15" />
        <div className="orb absolute bottom-1/4 -right-20 w-72 h-72 bg-indigo-600/15" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-black gradient-text">WeblyNow</span>
          </Link>
          <h1 className="text-2xl font-bold mb-2">Crea tu cuenta</h1>
          <p className="text-muted-foreground text-sm">
            Plan seleccionado:{' '}
            <span className={`font-semibold ${planInfo.color}`}>
              {planInfo.nombre} ({planInfo.precio})
            </span>
          </p>
        </div>

        <div className="glass rounded-2xl border border-white/5 p-8">
          {/* Benefits reminder */}
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-400 shrink-0" />
              <span className="text-foreground/80">Cuenta creada → pago → sitio en minutos</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nombre completo</label>
              <input
                type="text"
                required
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Tu nombre"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="tu@email.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gradient text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 mt-2 hover:scale-[1.02] transition-transform"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creando cuenta...</>
              ) : (
                <>Crear cuenta y continuar <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            <p className="text-center text-xs text-muted-foreground">
              Al registrarte aceptas nuestros{' '}
              <a href="#" className="underline hover:text-white">Términos de servicio</a>
            </p>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function RegistroPage() {
  return (
    <Suspense>
      <RegistroContent />
    </Suspense>
  )
}
