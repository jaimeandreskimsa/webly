'use client'

import { useState, useEffect } from 'react'
import { User, Lock, Puzzle, Eye, EyeOff, CheckCircle2, AlertCircle, ExternalLink, Trash2, HelpCircle, MessageCircle, Send } from 'lucide-react'

// ── Vercel icon (inline SVG) ──────────────────────────────────────────────────
function VercelIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 22.525H0l12-21.05 12 21.05z" />
    </svg>
  )
}

// ── Sección Perfil ────────────────────────────────────────────────────────────
function SeccionPerfil() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  useEffect(() => {
    fetch('/api/usuario/perfil')
      .then(r => r.json())
      .then(d => { setNombre(d.nombre || ''); setEmail(d.email || '') })
      .catch(() => {})
  }, [])

  async function guardar() {
    setGuardando(true); setMsg(null)
    try {
      const res = await fetch('/api/usuario/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre }),
      })
      if (res.ok) setMsg({ tipo: 'ok', texto: 'Perfil actualizado' })
      else setMsg({ tipo: 'error', texto: 'Error al guardar' })
    } finally { setGuardando(false) }
  }

  return (
    <div className="glass rounded-2xl border border-white/5 p-6">
      <h2 className="font-semibold mb-4 flex items-center gap-2">
        <User className="w-4 h-4 text-indigo-400" />
        Perfil
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-muted-foreground cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground mt-1">El email no se puede cambiar</p>
        </div>
        {msg && (
          <p className={`text-sm flex items-center gap-1.5 ${msg.tipo === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
            {msg.tipo === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {msg.texto}
          </p>
        )}
        <button
          onClick={guardar}
          disabled={guardando}
          className="btn-gradient text-white font-medium px-5 py-2.5 rounded-xl text-sm disabled:opacity-50"
        >
          {guardando ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}

// ── Sección Contraseña ────────────────────────────────────────────────────────
function SeccionContrasena() {
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  async function cambiar() {
    if (!actual || !nueva) return setMsg({ tipo: 'error', texto: 'Completa ambos campos' })
    setGuardando(true); setMsg(null)
    try {
      const res = await fetch('/api/usuario/contrasena', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actual, nueva }),
      })
      if (res.ok) { setMsg({ tipo: 'ok', texto: 'Contraseña actualizada' }); setActual(''); setNueva('') }
      else { const d = await res.json(); setMsg({ tipo: 'error', texto: d.error || 'Error al cambiar' }) }
    } finally { setGuardando(false) }
  }

  return (
    <div className="glass rounded-2xl border border-white/5 p-6">
      <h2 className="font-semibold mb-4 flex items-center gap-2">
        <Lock className="w-4 h-4 text-indigo-400" />
        Contraseña
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Contraseña actual</label>
          <input
            type="password"
            value={actual}
            onChange={e => setActual(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Nueva contraseña</label>
          <input
            type="password"
            value={nueva}
            onChange={e => setNueva(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50"
          />
        </div>
        {msg && (
          <p className={`text-sm flex items-center gap-1.5 ${msg.tipo === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
            {msg.tipo === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {msg.texto}
          </p>
        )}
        <button
          onClick={cambiar}
          disabled={guardando}
          className="glass glass-hover text-white font-medium px-5 py-2.5 rounded-xl text-sm disabled:opacity-50"
        >
          {guardando ? 'Guardando…' : 'Cambiar contraseña'}
        </button>
      </div>
    </div>
  )
}

// ── Sección Integraciones ─────────────────────────────────────────────────────
function SeccionIntegraciones() {
  const [token, setToken] = useState('')
  const [teamId, setTeamId] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [conectado, setConectado] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [desconectando, setDesconectando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  const [mensajeAyuda, setMensajeAyuda] = useState('')
  const [enviandoAyuda, setEnviandoAyuda] = useState(false)
  const [ayudaEnviada, setAyudaEnviada] = useState(false)
  const [errorAyuda, setErrorAyuda] = useState('')

  useEffect(() => {
    fetch('/api/usuario/integraciones')
      .then(r => r.json())
      .then(d => {
        setToken(d.vercelToken || '')
        setTeamId(d.vercelTeamId || '')
        setConectado(d.vercelConectado || false)
      })
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [])

  async function guardar() {
    setGuardando(true); setMsg(null)
    try {
      const res = await fetch('/api/usuario/integraciones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vercelToken: token, vercelTeamId: teamId }),
      })
      if (res.ok) {
        setMsg({ tipo: 'ok', texto: 'Integración guardada correctamente' })
        setConectado(true)
        // Re-fetch para obtener el token enmascarado
        const data = await fetch('/api/usuario/integraciones').then(r => r.json())
        setToken(data.vercelToken || '')
      } else {
        setMsg({ tipo: 'error', texto: 'Error al guardar la integración' })
      }
    } finally { setGuardando(false) }
  }

  async function desconectar() {
    if (!confirm('¿Desconectar Vercel? Tus deploys futuros usarán el token del sistema.')) return
    setDesconectando(true); setMsg(null)
    try {
      await fetch('/api/usuario/integraciones', { method: 'DELETE' })
      setToken(''); setTeamId(''); setConectado(false)
      setMsg({ tipo: 'ok', texto: 'Cuenta Vercel desconectada' })
    } finally { setDesconectando(false) }
  }

  async function solicitarAyuda() {
    setEnviandoAyuda(true); setErrorAyuda('')
    try {
      const res = await fetch('/api/usuario/solicitar-ayuda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: mensajeAyuda }),
      })
      if (res.ok) {
        setAyudaEnviada(true)
        setMensajeAyuda('')
      } else {
        const data = await res.json()
        setErrorAyuda(data.error || 'Error al enviar la solicitud')
      }
    } catch {
      setErrorAyuda('Error de conexión')
    } finally { setEnviandoAyuda(false) }
  }

  return (
    <div className="glass rounded-2xl border border-white/5 p-6">
      <h2 className="font-semibold mb-1 flex items-center gap-2">
        <Puzzle className="w-4 h-4 text-indigo-400" />
        Integraciones
      </h2>
      <p className="text-xs text-muted-foreground mb-5">
        Conecta servicios externos para publicar tus sitios con tu propia cuenta.
      </p>

      {/* ── Card Vercel ─────────────────────────────────────────── */}
      <div className="border border-white/10 rounded-xl p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              <VercelIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-medium text-sm">Vercel</p>
              <p className="text-xs text-muted-foreground">Publica sitios en tu cuenta personal</p>
            </div>
          </div>
          {!cargando && (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
              conectado
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-white/5 text-muted-foreground border-white/10'
            }`}>
              {conectado ? '● Conectado' : '○ No conectado'}
            </span>
          )}
        </div>

        {/* Guía */}
        <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
          <p className="text-indigo-300 font-medium mb-1.5">¿Cómo obtener tu token?</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>Ingresa a <span className="text-white/70">vercel.com</span> → tu avatar → <strong>Settings</strong></li>
            <li>Ve a <strong>Tokens</strong> → <strong>Create Token</strong></li>
            <li>Dale un nombre (ej: <em>WEBLYNOW</em>) y scope <strong>Full Account</strong></li>
            <li>Copia el token y pégalo aquí</li>
          </ol>
          <a
            href="https://vercel.com/account/tokens"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 mt-2"
          >
            Abrir configuración de tokens <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Campos */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Vercel Token <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11 text-sm text-white font-mono focus:outline-none focus:border-indigo-500/50 placeholder:text-white/20"
              />
              <button
                type="button"
                onClick={() => setShowToken(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Team ID <span className="text-muted-foreground text-xs font-normal">(opcional, solo si usas un equipo)</span>
            </label>
            <input
              type="text"
              value={teamId}
              onChange={e => setTeamId(e.target.value)}
              placeholder="team_xxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-indigo-500/50 placeholder:text-white/20"
            />
          </div>
        </div>

        {/* Mensaje */}
        {msg && (
          <p className={`text-sm flex items-center gap-1.5 ${msg.tipo === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
            {msg.tipo === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {msg.texto}
          </p>
        )}

        {/* Acciones */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={guardar}
            disabled={guardando || !token}
            className="btn-gradient text-white font-medium px-5 py-2.5 rounded-xl text-sm disabled:opacity-40"
          >
            {guardando ? 'Guardando…' : conectado ? 'Actualizar token' : 'Conectar Vercel'}
          </button>

          {conectado && (
            <button
              onClick={desconectar}
              disabled={desconectando}
              className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {desconectando ? 'Desconectando…' : 'Desconectar'}
            </button>
          )}
        </div>
      </div>

      {/* ── Solicitar Ayuda ───────────────────────────────────── */}
      <div className="mt-5 border border-indigo-500/20 rounded-xl p-5 bg-indigo-500/5 space-y-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
          <p className="font-medium text-sm text-white">¿Necesitas ayuda con Vercel o tu dominio?</p>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Si tienes dificultades para configurar Vercel o conectar tu dominio personalizado, puedes solicitar asistencia. Te contactaremos a tu email registrado.
        </p>
        {ayudaEnviada ? (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-sm text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            ¡Solicitud enviada! Te contactaremos a la brevedad.
          </div>
        ) : (
          <>
            <textarea
              value={mensajeAyuda}
              onChange={e => setMensajeAyuda(e.target.value)}
              placeholder="Cuéntanos brevemente qué problema tienes (opcional)…"
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 resize-none"
            />
            {errorAyuda && (
              <p className="text-xs text-red-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {errorAyuda}
              </p>
            )}
            <button
              onClick={solicitarAyuda}
              disabled={enviandoAyuda}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              {enviandoAyuda
                ? <><MessageCircle className="w-4 h-4 animate-pulse" /> Enviando…</>
                : <><Send className="w-4 h-4" /> Solicitar ayuda</>
              }
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function ConfiguracionPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground text-sm mt-1">Gestiona tu cuenta e integraciones</p>
      </div>

      <SeccionPerfil />
      <SeccionContrasena />
      <SeccionIntegraciones />
    </div>
  )
}

