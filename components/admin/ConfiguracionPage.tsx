'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Key, Brain, DollarSign, Settings, Cpu, Eye, EyeOff,
  Save, RotateCcw, Check, Loader2, AlertTriangle,
  Cloud, Zap, Wifi, WifiOff, CircleDot, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'apis' | 'prompts' | 'modelos' | 'precios' | 'general'
type PromptPlan = 'basico' | 'pro' | 'premium' | 'broker'

export interface DefaultPrompts {
  basico: string
  pro: string
  premium: string
  broker: string
}
type ConfigRow = { clave: string; valor: string; tipo: string; descripcion?: string | null }
type ConfigMap = Record<string, string>

const MODELOS_CLAUDE = [
  'claude-opus-4-5',
  'claude-sonnet-4-6',
  'claude-3-5-haiku-20241022',
  'claude-3-opus-20240229',
  'claude-3-5-sonnet-20241022',
]

// ─── API key sections ─────────────────────────────────────────────────────────
const API_SECTIONS = [
  {
    title: 'Anthropic (Claude AI)',
    icon: Brain,
    color: 'violet',
    fields: [
      { clave: 'anthropic_api_key', label: 'API Key', tipo: 'secret', placeholder: 'sk-ant-api03-...' },
    ],
  },
  {
    title: 'fal.ai (Generación de imágenes IA)',
    icon: Sparkles,
    color: 'pink',
    fields: [
      { clave: 'fal_api_key', label: 'API Key', tipo: 'secret', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:xxxxxxxx...' },
    ],
  },
  {
    title: 'Flow.cl (Pagos)',
    icon: DollarSign,
    color: 'emerald',
    fields: [
      { clave: 'flow_api_key', label: 'API Key', tipo: 'secret', placeholder: 'tu-api-key-de-flow' },
      { clave: 'flow_secret_key', label: 'Secret Key', tipo: 'secret', placeholder: 'tu-secret-key-de-flow' },
      { clave: 'flow_sandbox', label: 'Modo Sandbox (true/false)', tipo: 'string', placeholder: 'false' },
    ],
  },
  {
    title: 'Cloudinary (Imágenes subidas)',
    icon: Cloud,
    color: 'blue',
    fields: [
      { clave: 'cloudinary_cloud_name', label: 'Cloud Name', tipo: 'string', placeholder: 'mi-cloud' },
      { clave: 'cloudinary_api_key', label: 'API Key', tipo: 'secret', placeholder: '123456789012345' },
      { clave: 'cloudinary_api_secret', label: 'API Secret', tipo: 'secret', placeholder: 'abcdefghijklmnop...' },
    ],
  },
  {
    title: 'Vercel (Deploy)',
    icon: Zap,
    color: 'slate',
    fields: [
      { clave: 'vercel_token', label: 'Token', tipo: 'secret', placeholder: 'vercel_pat_...' },
      { clave: 'vercel_team_id', label: 'Team ID', tipo: 'string', placeholder: 'team_...' },
    ],
  },
]

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ConfiguracionAdminPage({ defaultPrompts }: { defaultPrompts: DefaultPrompts }) {
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams.get('tab') as Tab | null
  const validTabs: Tab[] = ['apis', 'prompts', 'modelos', 'precios', 'general']
  const [tab, setTab] = useState<Tab>(
    tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'apis'
  )
  const [config, setConfig] = useState<ConfigMap>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedKey, setSavedKey] = useState('')
  const [error, setError] = useState('')
  const [promptTab, setPromptTab] = useState<PromptPlan>('basico')
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [claudeStatus, setClaudeStatus] = useState<'unknown' | 'testing' | 'ok' | 'error'>('unknown')
  const [claudeError, setClaudeError] = useState('')
  const [falStatus, setFalStatus] = useState<'unknown' | 'testing' | 'ok' | 'error'>('unknown')
  const [falError, setFalError] = useState('')
  const [falBalance, setFalBalance] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/configuracion')
      .then(r => r.json())
      .then((rows: ConfigRow[]) => {
        const map: ConfigMap = {}
        rows.forEach(r => { map[r.clave] = r.valor })
        setConfig(map)
        setLoading(false)
        // Si hay key guardada (enmascarada o visible), marcar como configurada
        const key = map['anthropic_api_key'] ?? ''
        if (key && key.length > 8) setClaudeStatus('ok')
        const falKey = map['fal_api_key'] ?? ''
        if (falKey && falKey.length > 8) setFalStatus('ok')
      })
      .catch(() => setLoading(false))
  }, [])

  const val = (key: string, fallback = '') => config[key] ?? fallback
  const set = (key: string, value: string) =>
    setConfig(prev => ({ ...prev, [key]: value }))

  const save = useCallback(async (
    entries: Array<{ clave: string; valor: string; tipo: string; descripcion?: string }>,
    sectionKey: string,
  ) => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/configuracion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      setSavedKey(sectionKey)
      setTimeout(() => setSavedKey(''), 2500)
      // Si guardaron la key de Anthropic, marcar para re-probar
      const hasAnthropicKey = entries.some(e => e.clave === 'anthropic_api_key' && e.valor && !e.valor.includes('●'))
      if (hasAnthropicKey) {
        setClaudeStatus('unknown')
        setClaudeError('')
      }
      const hasFalKey = entries.some(e => e.clave === 'fal_api_key' && e.valor && !e.valor.includes('●'))
      if (hasFalKey) {
        setFalStatus('unknown')
        setFalError('')
        setFalBalance(null)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }, [])

  const testClaude = async () => {
    setClaudeStatus('testing')
    setClaudeError('')
    try {
      const res = await fetch('/api/admin/test-claude')
      const data = await res.json()
      if (data.ok) {
        setClaudeStatus('ok')
      } else {
        setClaudeStatus('error')
        setClaudeError(data.error || 'Error desconocido')
      }
    } catch {
      setClaudeStatus('error')
      setClaudeError('Sin respuesta del servidor')
    }
  }

  const testFal = async () => {
    setFalStatus('testing')
    setFalError('')
    setFalBalance(null)
    try {
      const res = await fetch('/api/admin/test-fal')
      const data = await res.json()
      if (data.ok) {
        setFalStatus('ok')
        if (data.balance !== null && data.balance !== undefined) {
          setFalBalance(data.balance)
        }
      } else {
        setFalStatus('error')
        setFalError(data.error || 'Error desconocido')
      }
    } catch {
      setFalStatus('error')
      setFalError('Sin respuesta del servidor')
    }
  }

  const tabs = [
    { id: 'apis' as Tab, label: 'APIs & Credenciales', icon: Key },
    { id: 'prompts' as Tab, label: 'Prompts por Plan', icon: Brain },
    { id: 'modelos' as Tab, label: 'Modelos & Tokens', icon: Cpu },
    { id: 'precios' as Tab, label: 'Precios', icon: DollarSign },
    { id: 'general' as Tab, label: 'General', icon: Settings },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-orange-400" />
          Configuración del sistema
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          APIs, prompts de generación, modelos IA, precios y ajustes generales
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white/3 border border-white/5 rounded-xl p-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center',
              tab === t.id
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ─── Tab: APIs ─────────────────────────────────────────────────────── */}
      {tab === 'apis' && (
        <div className="space-y-5">
          {API_SECTIONS.map(section => (
            <div key={section.title} className="bg-white/3 border border-white/5 rounded-2xl p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center',
                  section.color === 'violet' && 'bg-violet-500/20',
                  section.color === 'emerald' && 'bg-emerald-500/20',
                  section.color === 'yellow' && 'bg-yellow-500/20',
                  section.color === 'blue' && 'bg-blue-500/20',
                  section.color === 'slate' && 'bg-slate-500/20',
                  section.color === 'pink' && 'bg-pink-500/20',
                )}>
                  <section.icon className={cn(
                    'w-4 h-4',
                    section.color === 'violet' && 'text-violet-400',
                    section.color === 'emerald' && 'text-emerald-400',
                    section.color === 'yellow' && 'text-yellow-400',
                    section.color === 'blue' && 'text-blue-400',
                    section.color === 'slate' && 'text-slate-400',
                    section.color === 'pink' && 'text-pink-400',
                  )} />
                </div>
                <h3 className="font-semibold text-white text-sm">{section.title}</h3>

                {/* Indicador de estado para Anthropic */}
                {section.title === 'Anthropic (Claude AI)' && (
                  <div className="ml-auto flex items-center gap-2">
                    {claudeStatus === 'ok' && (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                        </span>
                        Conectado
                      </span>
                    )}
                    {claudeStatus === 'error' && (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-red-400">
                        <span className="inline-flex rounded-full h-2.5 w-2.5 bg-red-400" />
                        Error
                      </span>
                    )}
                    {claudeStatus === 'unknown' && (
                      <span className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span className="inline-flex rounded-full h-2.5 w-2.5 bg-slate-600" />
                        Sin probar
                      </span>
                    )}
                    {claudeStatus === 'testing' && (
                      <span className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Probando…
                      </span>
                    )}
                    <button
                      onClick={testClaude}
                      disabled={claudeStatus === 'testing'}
                      className="text-xs px-2.5 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-300 transition-colors disabled:opacity-50"
                    >
                      Probar conexión
                    </button>
                  </div>
                )}

                {/* Indicador de estado para fal.ai */}
                {section.title === 'fal.ai (Generación de imágenes IA)' && (
                  <div className="ml-auto flex items-center gap-2">
                    {falStatus === 'ok' && (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                        </span>
                        Conectado
                        {falBalance !== null && (
                          <span className="ml-1 text-xs text-slate-400 font-normal">· ${Number(falBalance).toFixed(2)} USD</span>
                        )}
                      </span>
                    )}
                    {falStatus === 'error' && (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-red-400">
                        <span className="inline-flex rounded-full h-2.5 w-2.5 bg-red-400" />
                        Error
                      </span>
                    )}
                    {falStatus === 'unknown' && (
                      <span className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span className="inline-flex rounded-full h-2.5 w-2.5 bg-slate-600" />
                        Sin probar
                      </span>
                    )}
                    {falStatus === 'testing' && (
                      <span className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Generando imagen de prueba…
                      </span>
                    )}
                    <button
                      onClick={testFal}
                      disabled={falStatus === 'testing'}
                      className="text-xs px-2.5 py-1 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 text-pink-300 transition-colors disabled:opacity-50"
                    >
                      Probar conexión
                    </button>
                  </div>
                )}
              </div>

              {/* Error de Claude */}
              {section.title === 'Anthropic (Claude AI)' && claudeError && (
                <div className="mb-3 flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-400">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  {claudeError}
                </div>
              )}

              {/* Error de fal.ai */}
              {section.title === 'fal.ai (Generación de imágenes IA)' && falError && (
                <div className="mb-3 flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-400">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  {falError}
                </div>
              )}

              {/* Instrucciones Vercel */}
              {section.title === 'Vercel (Deploy)' && (
                <div className="mb-4 rounded-xl border border-slate-700 bg-slate-800/60 p-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-slate-400" />
                    Token global del sistema
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Este token se usa para hacer deploy de los sitios de <strong className="text-white">todos los clientes</strong> que no hayan conectado su propia cuenta de Vercel. Es obligatorio para que el sistema funcione.
                  </p>
                  <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside leading-relaxed">
                    <li>Entra a <a href="https://vercel.com/account/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">vercel.com/account/tokens</a></li>
                    <li>Haz clic en <strong className="text-white">Create Token</strong></li>
                    <li>Ponle un nombre (ej: <code className="bg-white/10 px-1 rounded">weblynow-system</code>)</li>
                    <li>Scope: <strong className="text-white">Full Account</strong></li>
                    <li>Expiration: <strong className="text-white">No Expiration</strong></li>
                    <li>Copia el token generado y pégalo abajo</li>
                  </ol>
                  <p className="text-xs text-slate-500">
                    <strong className="text-slate-400">Team ID</strong> (opcional): solo si tu cuenta Vercel es de tipo Team. Encuéntralo en <code className="bg-white/10 px-1 rounded">vercel.com/[tu-equipo]/settings</code> → sección General → Team ID.
                  </p>
                  <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-400">Sin este token, los deploys fallarán para los clientes que no tengan cuenta Vercel propia.</p>
                  </div>
                </div>
              )}

              {/* Instrucciones Flow.cl */}
              {section.title === 'Flow.cl (Pagos)' && (
                <div className="mb-4 rounded-xl border border-emerald-700/40 bg-emerald-900/20 p-4 space-y-3">
                  <p className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    Obtener credenciales de Flow.cl
                  </p>
                  <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside leading-relaxed">
                    <li>Ingresa a <a href="https://app.flow.cl" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline hover:text-emerald-300">app.flow.cl</a> con tu cuenta de comercio</li>
                    <li>Ve a <strong className="text-white">Configuración → Datos del comercio</strong></li>
                    <li>Copia el <strong className="text-white">API Key</strong> y el <strong className="text-white">Secret Key</strong></li>
                    <li>Para pruebas usa <a href="https://sandbox.flow.cl" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline hover:text-emerald-300">sandbox.flow.cl</a> y activa Modo Sandbox (<code className="bg-white/10 px-1 rounded">true</code>)</li>
                    <li>En producción pon Modo Sandbox en <code className="bg-white/10 px-1 rounded">false</code></li>
                  </ol>
                  <p className="text-xs text-slate-500">
                    <strong className="text-slate-400">URL de confirmación (webhook):</strong>{' '}
                    <code className="bg-white/10 px-1 rounded text-slate-300">{process.env.NEXT_PUBLIC_APP_URL || 'https://tu-dominio.com'}/api/pagos/webhook</code>
                    {' '}— Flow la llama automáticamente al confirmar un pago.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {section.fields.map(field => (
                  <div key={field.clave}>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      {field.label}
                      {field.tipo === 'secret' && (
                        <span className="ml-2 text-xs text-slate-600">(cifrado)</span>
                      )}
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={field.tipo === 'secret' && !showSecrets[field.clave] ? 'password' : 'text'}
                          value={val(field.clave)}
                          onChange={e => set(field.clave, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 font-mono"
                        />
                        {field.tipo === 'secret' && (
                          <button
                            type="button"
                            onClick={() => setShowSecrets(prev => ({ ...prev, [field.clave]: !prev[field.clave] }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                          >
                            {showSecrets[field.clave]
                              ? <EyeOff className="w-3.5 h-3.5" />
                              : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-end">
                <SaveButton
                  saving={saving}
                  saved={savedKey === section.title}
                  onClick={() => save(
                    section.fields.map(f => ({
                      clave: f.clave,
                      valor: val(f.clave),
                      tipo: f.tipo,
                    })),
                    section.title,
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Tab: Prompts ──────────────────────────────────────────────────── */}
      {tab === 'prompts' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Define el system prompt que recibe Claude para cada plan. Si lo dejas vacío, se usa el prompt por defecto del código.
          </p>

          {/* Plan sub-tabs */}
          <div className="flex gap-2 flex-wrap">
            {(['basico', 'pro', 'premium', 'broker'] as PromptPlan[]).map(p => (
              <button
                key={p}
                onClick={() => setPromptTab(p)}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize',
                  promptTab === p
                    ? p === 'basico' ? 'bg-slate-500/30 text-slate-200 border border-slate-500/40'
                      : p === 'pro' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : p === 'premium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                )}
              >
                {p === 'basico' ? '🟢 Básico' : p === 'pro' ? '🔵 Pro' : p === 'premium' ? '⭐ Premium' : '🏢 Broker'}
              </button>
            ))}
          </div>

          {/* Prompt editor */}
          <div className="bg-white/3 border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-white capitalize">
                System Prompt — Plan {promptTab}
              </label>
              <button
                type="button"
                onClick={() => {
                  const defaults: Record<PromptPlan, string> = defaultPrompts
                  set(`system_prompt_${promptTab}`, defaults[promptTab])
                }}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-orange-400 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Restaurar por defecto
              </button>
            </div>
            <textarea
              value={val(`system_prompt_${promptTab}`)}
              onChange={e => set(`system_prompt_${promptTab}`, e.target.value)}
              rows={22}
              placeholder={`Prompt por defecto del plan ${promptTab} (del código). Escribe aquí para sobreescribirlo.`}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 font-mono resize-y leading-relaxed"
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-slate-600">
                {val(`system_prompt_${promptTab}`).length > 0
                  ? `${val(`system_prompt_${promptTab}`).length.toLocaleString()} caracteres`
                  : 'Usando prompt por defecto del código'}
              </span>
              <SaveButton
                saving={saving}
                saved={savedKey === `prompt-${promptTab}`}
                onClick={() => save([{
                  clave: `system_prompt_${promptTab}`,
                  valor: val(`system_prompt_${promptTab}`),
                  tipo: 'text',
                  descripcion: `System prompt para el plan ${promptTab}`,
                }], `prompt-${promptTab}`)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab: Modelos ─────────────────────────────────────────────────── */}
      {tab === 'modelos' && (
        <div className="space-y-5">
          {/* Modelo Claude */}
          <div className="bg-white/3 border border-white/5 rounded-2xl p-5">
            <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4 text-violet-400" />
              Modelo Claude para generación
            </h3>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Modelo activo</label>
              <select
                value={val('modelo_claude', 'claude-sonnet-4-6')}
                onChange={e => set('modelo_claude', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50"
              >
                {MODELOS_CLAUDE.map(m => (
                  <option key={m} value={m} className="bg-slate-900">{m}</option>
                ))}
              </select>
              <p className="text-xs text-slate-600 mt-1.5">Aplica a todos los planes</p>
            </div>
            <div className="mt-4 flex justify-end">
              <SaveButton
                saving={saving}
                saved={savedKey === 'modelos'}
                onClick={() => save([
                  { clave: 'modelo_claude', valor: val('modelo_claude', 'claude-sonnet-4-6'), tipo: 'string' },
                ], 'modelos')}
              />
            </div>
          </div>

          {/* Max tokens */}
          <div className="bg-white/3 border border-white/5 rounded-2xl p-5">
            <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              Tokens máximos por plan
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {([
                { plan: 'basico', label: '🟢 Básico', default: '8000' },
                { plan: 'pro', label: '🔵 Pro', default: '16000' },
                { plan: 'premium', label: '⭐ Premium', default: '32000' },
                { plan: 'broker', label: '🏢 Broker', default: '24000' },
              ] as const).map(({ plan, label, default: d }) => (
                <div key={plan}>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
                  <input
                    type="number"
                    value={val(`max_tokens_${plan}`, d)}
                    onChange={e => set(`max_tokens_${plan}`, e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50"
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <SaveButton
                saving={saving}
                saved={savedKey === 'tokens'}
                onClick={() => save([
                  { clave: 'max_tokens_basico', valor: val('max_tokens_basico', '8000'), tipo: 'number' },
                  { clave: 'max_tokens_pro', valor: val('max_tokens_pro', '16000'), tipo: 'number' },
                  { clave: 'max_tokens_premium', valor: val('max_tokens_premium', '32000'), tipo: 'number' },
                  { clave: 'max_tokens_broker', valor: val('max_tokens_broker', '24000'), tipo: 'number' },
                ], 'tokens')}
              />
            </div>
          </div>


        </div>
      )}

      {/* ─── Tab: Precios ─────────────────────────────────────────────────── */}
      {tab === 'precios' && (
        <div className="space-y-5">
          <div className="bg-white/3 border border-white/5 rounded-2xl p-5">
            <h3 className="font-semibold text-white text-sm mb-1 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-yellow-400" />
              Precios de planes (CLP)
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Modifica los precios que se muestran en la página de pago y se cobran en MercadoPago.
            </p>
            <div className="space-y-4">
              {([
                { plan: 'basico', label: '🟢 Plan Básico', desc: '1 sitio, 1 página, logo + colores + servicios', default: '29900' },
                { plan: 'pro', label: '🔵 Plan Pro', desc: '3 sitios, animaciones avanzadas, ediciones ilimitadas', default: '69900' },
                { plan: 'premium', label: '⭐ Plan Premium', desc: 'Sitios ilimitados, efectos premium, dominio personalizado', default: '149900' },
                { plan: 'broker', label: '🏢 Plan Broker', desc: 'Portal inmobiliario, gestión de propiedades, deploy automático', default: '700000' },
              ] as const).map(({ plan, label, desc, default: d }) => (
                <div key={plan} className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{label}</p>
                    <p className="text-xs text-slate-500">{desc}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-slate-500 text-sm">$</span>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={val(`precio_${plan}`, d)}
                      onChange={e => set(`precio_${plan}`, e.target.value)}
                      className="w-32 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50 text-right"
                    />
                    <span className="text-slate-500 text-xs">CLP</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-end">
              <SaveButton
                saving={saving}
                saved={savedKey === 'precios'}
                onClick={() => save([
                  { clave: 'precio_basico', valor: val('precio_basico', '29900'), tipo: 'number' },
                  { clave: 'precio_pro', valor: val('precio_pro', '69900'), tipo: 'number' },
                  { clave: 'precio_premium', valor: val('precio_premium', '149900'), tipo: 'number' },
                  { clave: 'precio_broker', valor: val('precio_broker', '700000'), tipo: 'number' },
                ], 'precios')}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab: General ─────────────────────────────────────────────────── */}
      {tab === 'general' && (
        <div className="space-y-5">
          <div className="bg-white/3 border border-white/5 rounded-2xl p-5">
            <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4 text-orange-400" />
              Configuración general
            </h3>
            <div className="space-y-4">
              <Field
                label="Nombre de la app"
                value={val('nombre_app', 'WeblyNow')}
                onChange={v => set('nombre_app', v)}
                placeholder="WeblyNow"
              />
              <Field
                label="Tagline / Slogan"
                value={val('tagline', 'Crea tu web con IA en minutos')}
                onChange={v => set('tagline', v)}
                placeholder="Crea tu web con IA en minutos"
              />
              <Field
                label="Email de soporte"
                value={val('email_soporte', '')}
                onChange={v => set('email_soporte', v)}
                placeholder="soporte@weblynow.com"
                type="email"
              />
            </div>
            <div className="mt-4 flex justify-end">
              <SaveButton
                saving={saving}
                saved={savedKey === 'general-info'}
                onClick={() => save([
                  { clave: 'nombre_app', valor: val('nombre_app', 'WeblyNow'), tipo: 'string' },
                  { clave: 'tagline', valor: val('tagline', ''), tipo: 'string' },
                  { clave: 'email_soporte', valor: val('email_soporte', ''), tipo: 'string' },
                ], 'general-info')}
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="bg-white/3 border border-white/5 rounded-2xl p-5">
            <h3 className="font-semibold text-white text-sm mb-4">Interruptores del sistema</h3>
            <div className="space-y-4">
              <Toggle
                label="Registro de nuevos usuarios"
                description="Permite que nuevos usuarios creen cuenta en la plataforma"
                checked={val('registro_habilitado', 'true') === 'true'}
                onChange={v => set('registro_habilitado', v ? 'true' : 'false')}
              />
              <Toggle
                label="Modo mantenimiento"
                description="Muestra página de mantenimiento a usuarios no-admin"
                checked={val('modo_mantenimiento', 'false') === 'true'}
                onChange={v => set('modo_mantenimiento', v ? 'true' : 'false')}
                danger
              />
              <Toggle
                label="Modo demo (sin cobros reales)"
                description="Activa el bypass de pago para todos los usuarios"
                checked={val('modo_demo', 'false') === 'true'}
                onChange={v => set('modo_demo', v ? 'true' : 'false')}
                danger
              />
            </div>
            <div className="mt-4 flex justify-end">
              <SaveButton
                saving={saving}
                saved={savedKey === 'general-toggles'}
                onClick={() => save([
                  { clave: 'registro_habilitado', valor: val('registro_habilitado', 'true'), tipo: 'boolean' },
                  { clave: 'modo_mantenimiento', valor: val('modo_mantenimiento', 'false'), tipo: 'boolean' },
                  { clave: 'modo_demo', valor: val('modo_demo', 'false'), tipo: 'boolean' },
                ], 'general-toggles')}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SaveButton({
  saving, saved, onClick,
}: { saving: boolean; saved: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className={cn(
        'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
        saved
          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          : 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30',
        saving && 'opacity-60 cursor-not-allowed',
      )}
    >
      {saving ? (
        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando…</>
      ) : saved ? (
        <><Check className="w-3.5 h-3.5" /> Guardado</>
      ) : (
        <><Save className="w-3.5 h-3.5" /> Guardar</>
      )}
    </button>
  )
}

function Field({
  label, value, onChange, placeholder, type = 'text',
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50"
      />
    </div>
  )
}

function Toggle({
  label, description, checked, onChange, danger = false,
}: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors shrink-0',
          checked
            ? danger ? 'bg-red-500/60' : 'bg-emerald-500/60'
            : 'bg-white/10',
        )}
      >
        <span className={cn(
          'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5',
        )} />
      </button>
    </div>
  )
}
