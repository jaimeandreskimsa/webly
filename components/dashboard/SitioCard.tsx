'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Globe, ExternalLink, Edit2, Download, Clock,
  CheckCircle2, Loader2, AlertCircle, Trash2, Rocket, X, CreditCard,
  Link2, HelpCircle, Copy, Check, ChevronRight, MessageCircle,
} from 'lucide-react'
import { formatFecha } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Sitio } from '@/lib/db/schema'

const estadoConfig = {
  publicado: {
    label: 'Publicado',
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
    icon: CheckCircle2,
  },
  borrador: {
    label: 'Borrador',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
    icon: Clock,
  },
  generando: {
    label: 'Generando...',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
    icon: Loader2,
  },
  error: {
    label: 'Error',
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
    icon: AlertCircle,
  },
  pendiente_pago: {
    label: 'Pendiente de pago',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
    icon: CreditCard,
  },
}

const planColors = {
  basico: 'text-blue-400',
  pro: 'text-violet-400',
  premium: 'text-amber-400',
  broker: 'text-emerald-400',
}

function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative group/tip">
      {children}
      <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-900 border border-white/10 px-2 py-1 text-[10px] font-medium text-white opacity-0 group-hover/tip:opacity-100 transition-opacity z-20 shadow-lg">
        {label}
      </span>
    </div>
  )
}

interface SitioCardProps {
  sitio: Sitio
}

export function SitioCard({ sitio }: SitioCardProps) {
  const router = useRouter()
  const estado = estadoConfig[sitio.estado as keyof typeof estadoConfig] ?? estadoConfig.borrador
  const planColor = planColors[sitio.plan as keyof typeof planColors] ?? planColors.basico
  const contenido = (sitio.contenidoJson as any) ?? {}

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [deployError, setDeployError] = useState('')
  const [reanudando, setReanudando] = useState(false)
  const [showDomainGuide, setShowDomainGuide] = useState(false)
  const [copiedText, setCopiedText] = useState('')

  // Polling automático cuando el sitio está generando en background
  useEffect(() => {
    if (sitio.estado !== 'generando') return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/sitios/${sitio.id}`)
        if (!res.ok) return
        const data = await res.json()
        if (data.sitio?.estado === 'borrador' || data.sitio?.estado === 'publicado' || data.sitio?.estado === 'error') {
          router.refresh()
        }
      } catch {}
    }, 4000)
    return () => clearInterval(interval)
  }, [sitio.estado, sitio.id, router])

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/sitios/${sitio.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      router.refresh()
    } catch {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  async function handleDeploy(e: React.MouseEvent) {
    e.stopPropagation()
    setDeploying(true)
    setDeployError('')
    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sitioId: sitio.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al desplegar')
      if (data.url) window.open(data.url, '_blank')
      router.refresh()
    } catch (err: any) {
      setDeployError(err.message)
    } finally {
      setDeploying(false)
    }
  }

  async function handleReanudarPago(e: React.MouseEvent) {
    e.stopPropagation()
    setReanudando(true)
    try {
      const res = await fetch('/api/pagos/reanudar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sitioId: sitio.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al reanudar pago')
      // Si el pago ya estaba aprobado en Flow, ir directo al wizard
      window.location.href = data.configurarUrl || data.checkoutUrl
    } catch (err: any) {
      console.error('[reanudar pago]', err)
      setReanudando(false)
    }
  }

  return (
    <>
      <div className="glass rounded-2xl border border-white/5 p-5 group flex flex-col gap-4 hover:border-indigo-500/30 transition-all">
        {/* Header */}
        <div className="flex items-start justify-between">
          <Link
            href={`/dashboard/sitios/${sitio.id}`}
            className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate">{sitio.nombre}</h3>
              <span className={cn('text-xs', planColor)}>Plan {sitio.plan}</span>
            </div>
          </Link>

          {/* Status badge — clickable si está pendiente de pago */}
          {sitio.estado === 'pendiente_pago' ? (
            <button
              onClick={handleReanudarPago}
              disabled={reanudando}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border cursor-pointer hover:brightness-125 transition-all active:scale-95',
                estado.bg, estado.color
              )}
            >
              {reanudando
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <CreditCard className="w-3 h-3" />
              }
              {reanudando ? 'Iniciando...' : 'Pagar ahora →'}
            </button>
          ) : sitio.estado === 'generando' ? (
            <Link
              href={`/dashboard/sitios/${sitio.id}/generando`}
              onClick={e => e.stopPropagation()}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border hover:brightness-125 transition-all',
                estado.bg, estado.color
              )}
            >
              <Loader2 className="w-3 h-3 animate-spin" />
              Ver progreso →
            </Link>
          ) : (
            <div className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border',
              estado.bg, estado.color
            )}>
              <estado.icon className="w-3 h-3" />
              {estado.label}
            </div>
          )}
        </div>

        {/* Info */}
        {contenido.rubro && (
          <p className="text-xs text-muted-foreground bg-white/3 rounded-lg px-3 py-2">
            {contenido.rubro} · {contenido.ciudad || 'Chile'}
          </p>
        )}

        {/* Deploy URL */}
        {sitio.deployUrl && (
          <a
            href={sitio.deployUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            {sitio.deployUrl.replace('https://', '').slice(0, 35)}
          </a>
        )}

        {deployError && (
          <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{deployError}</p>
        )}

        {/* Domain config — visible en sitios generados (borrador o publicado) */}
        {(sitio.estado === 'borrador' || sitio.estado === 'publicado') && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowDomainGuide(true) }}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-indigo-500/8 border border-indigo-500/15 hover:bg-indigo-500/15 hover:border-indigo-500/30 transition-all group/domain"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center shrink-0">
              <Link2 className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-xs font-semibold text-indigo-300">
                {sitio.deployUrl ? 'Configurar dominio propio' : 'Publicar y configurar dominio'}
              </p>
              <p className="text-[10px] text-slate-500">
                {sitio.deployUrl ? 'Conecta tu dominio .cl, .com, etc.' : 'Despliega en Vercel y conecta tu dominio'}
              </p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-indigo-400/50 group-hover/domain:text-indigo-400 group-hover/domain:translate-x-0.5 transition-all" />
          </button>
        )}

        {/* Footer — acciones */}
        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatFecha(sitio.updatedAt)}
          </span>

          <div className="flex items-center gap-1">
            {/* Borrador sin contenido = wizard incompleto → botón principal al configurar */}
            {sitio.estado === 'borrador' && !contenido.rubro && (
              <Link
                href={`/dashboard/sitios/${sitio.id}/configurar`}
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-500/15 hover:bg-violet-500/25 text-violet-400 hover:text-violet-300 transition-all text-xs font-semibold"
              >
                <Rocket className="w-3.5 h-3.5" />
                Crear sitio →
              </Link>
            )}

            {/* Previsualizar — solo si ya tiene contenido generado */}
            {(sitio.estado === 'borrador' || sitio.estado === 'publicado') && contenido.rubro && (
              <Link
                href={`/dashboard/sitios/${sitio.id}`}
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-green-500/15 text-green-400 hover:text-green-300 transition-all text-xs font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Previsualizar
              </Link>
            )}

            <Tip label="Descargar ZIP">
              <a
                href={`/api/sitios/${sitio.id}/download`}
                onClick={e => e.stopPropagation()}
                className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-all"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            </Tip>

            <Tip label="Editar contenido">
              <Link
                href={`/dashboard/sitios/${sitio.id}/editar`}
                onClick={e => e.stopPropagation()}
                className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-all"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </Link>
            </Tip>

            <Tip label="Desplegar en Vercel">
              <button
                onClick={handleDeploy}
                disabled={deploying || sitio.estado === 'generando' || sitio.estado === 'pendiente_pago'}
                className="p-1.5 rounded-lg hover:bg-indigo-500/20 text-muted-foreground hover:text-indigo-400 transition-all disabled:opacity-40"
              >
                {deploying
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Rocket className="w-3.5 h-3.5" />
                }
              </button>
            </Tip>

            <Tip label="Eliminar sitio">
              <button
                onClick={e => { e.stopPropagation(); setConfirmDelete(true) }}
                className="p-1.5 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </Tip>
          </div>
        </div>
      </div>

      {/* Modal guía de dominio */}
      {showDomainGuide && <DomainGuideModal
        sitio={sitio}
        copiedText={copiedText}
        onCopy={(text: string) => {
          navigator.clipboard.writeText(text)
          setCopiedText(text)
          setTimeout(() => setCopiedText(''), 2000)
        }}
        onClose={() => setShowDomainGuide(false)}
      />}

      {/* Modal de confirmación de eliminación */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => !deleting && setConfirmDelete(false)}
        >
          <div
            className="glass rounded-2xl border border-red-500/30 p-6 max-w-sm w-full space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="text-muted-foreground hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h3 className="font-bold text-base mb-1">¿Eliminar este sitio?</h3>
              <p className="text-sm text-muted-foreground">
                <span className="text-white font-semibold">"{sitio.nombre}"</span> se eliminará
                permanentemente junto con todas sus versiones. Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl glass border border-white/10 text-sm font-medium hover:bg-white/10 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Eliminando...</>
                  : 'Sí, eliminar'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Modal: Guía de configuración de dominio ──────────────────────────────────

function DomainGuideModal({
  sitio,
  copiedText,
  onCopy,
  onClose,
}: {
  sitio: Sitio
  copiedText: string
  onCopy: (text: string) => void
  onClose: () => void
}) {
  const needsDeploy = !sitio.deployUrl

  const steps = [
    ...(needsDeploy ? [{
      num: '0',
      title: 'Primero: despliega tu sitio',
      desc: 'Antes de configurar un dominio, necesitas publicar tu sitio en Vercel. Haz click en el ícono del cohete (🚀) en tu card de sitio para desplegarlo.',
      highlight: true,
    }] : []),
    {
      num: needsDeploy ? '1' : '1',
      title: 'Compra tu dominio',
      desc: 'Si aún no tienes un dominio, cómpralo en NIC Chile (.cl) o Namecheap (.com). Asegúrate de tener acceso al panel DNS.',
    },
    {
      num: needsDeploy ? '2' : '2',
      title: 'Abre tu proyecto en Vercel',
      desc: 'Inicia sesión en vercel.com y abre el proyecto de tu sitio.',
      link: 'https://vercel.com/dashboard',
      linkText: 'Ir a Vercel Dashboard',
    },
    {
      num: '3',
      title: 'Agrega tu dominio en Vercel',
      desc: 'Ve a Settings → Domains → escribe tu dominio y haz click en "Add".',
      detail: 'Vercel te mostrará los registros DNS que necesitas configurar.',
    },
    {
      num: '4',
      title: 'Configura los registros DNS',
      desc: 'En el panel de tu proveedor de dominio, agrega estos registros:',
      dns: [
        { type: 'A', name: '@', value: '76.76.21.21' },
        { type: 'CNAME', name: 'www', value: 'cname.vercel-dns.com' },
      ],
    },
    {
      num: '5',
      title: 'Espera la propagación',
      desc: 'Los DNS pueden tardar entre 5 minutos y 48 horas en propagarse. Vercel mostrará un check verde cuando esté listo.',
    },
    {
      num: '6',
      title: 'SSL automático',
      desc: 'Vercel configura automáticamente el certificado SSL (HTTPS) para tu dominio. No necesitas hacer nada extra.',
    },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass rounded-2xl border border-indigo-500/20 w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
              <Link2 className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="font-bold text-sm">Configurar dominio propio</h2>
              <p className="text-[11px] text-slate-500">Conecta tu dominio a {sitio.nombre}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current URL */}
        {sitio.deployUrl && (
          <div className="mx-6 mt-4 flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2.5 border border-white/5">
            <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-xs text-slate-400 truncate flex-1">{sitio.deployUrl}</span>
            <button
              onClick={() => onCopy(sitio.deployUrl!)}
              className="text-slate-500 hover:text-white transition-colors shrink-0"
            >
              {copiedText === sitio.deployUrl
                ? <Check className="w-3.5 h-3.5 text-green-400" />
                : <Copy className="w-3.5 h-3.5" />
              }
            </button>
          </div>
        )}

        {/* Steps */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {steps.map((step: any) => (
            <div key={step.num} className={cn('flex gap-3', step.highlight && 'bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 -mx-1')}>
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 border',
                step.highlight
                  ? 'bg-amber-500/20 border-amber-500/30'
                  : 'bg-indigo-500/15 border-indigo-500/25'
              )}>
                <span className={cn('text-[10px] font-bold', step.highlight ? 'text-amber-400' : 'text-indigo-400')}>
                  {step.highlight ? '!' : step.num}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold mb-0.5">{step.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                {step.detail && (
                  <p className="text-[11px] text-slate-500 mt-1 italic">{step.detail}</p>
                )}
                {step.link && (
                  <a
                    href={step.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 mt-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {step.linkText}
                  </a>
                )}
                {step.dns && (
                  <div className="mt-2 space-y-1.5">
                    {step.dns.map((record: { type: string; name: string; value: string }) => (
                      <div
                        key={record.type + record.name}
                        className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2 font-mono text-[11px] border border-white/5"
                      >
                        <span className="text-indigo-400 font-bold w-14 shrink-0">{record.type}</span>
                        <span className="text-slate-500 w-10 shrink-0">{record.name}</span>
                        <span className="text-white flex-1 truncate">{record.value}</span>
                        <button
                          onClick={() => onCopy(record.value)}
                          className="text-slate-600 hover:text-white transition-colors shrink-0"
                        >
                          {copiedText === record.value
                            ? <Check className="w-3 h-3 text-green-400" />
                            : <Copy className="w-3 h-3" />
                          }
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 flex flex-col sm:flex-row gap-2">
          <a
            href={`https://wa.me/56987654321?text=${encodeURIComponent(`Hola, necesito ayuda configurando el dominio de mi sitio "${sitio.nombre}" (${sitio.deployUrl || 'sin deploy'})`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            Solicitar ayuda
          </a>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl glass border border-white/10 text-sm font-medium hover:bg-white/10 transition-all text-center"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
