import { auth } from '@/auth'
import { db, sitios, versionesSitio } from '@/lib/db'
import { eq, and, desc } from 'drizzle-orm'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Globe, ArrowLeft, Edit2, Download, ExternalLink,
  Rocket, History, Clock, CheckCircle2, AlertCircle,
  Loader2, Code2, Layers
} from 'lucide-react'
import { SitioActions } from '@/components/dashboard/SitioActions'
import { formatFecha, PLAN_NOMBRES } from '@/lib/utils'

export default async function SitioPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const [sitio] = await db
    .select()
    .from(sitios)
    .where(
      and(
        eq(sitios.id, params.id),
        eq(sitios.userId, session.user.id as string)
      )
    )
    .limit(1)

  if (!sitio) notFound()

  const versiones = await db
    .select()
    .from(versionesSitio)
    .where(eq(versionesSitio.sitioId, params.id))
    .orderBy(desc(versionesSitio.numeroVersion))
    .limit(10)

  const versionActual = versiones.find(v => v.esActual)
  const contenido = (sitio.contenidoJson as any) ?? {}

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="p-2 rounded-xl glass glass-hover text-muted-foreground hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{sitio.nombre}</h1>
          <p className="text-muted-foreground text-sm">
            Plan {PLAN_NOMBRES[sitio.plan as keyof typeof PLAN_NOMBRES]} ·{' '}
            {versiones.length} versión{versiones.length !== 1 ? 'es' : ''}
          </p>
        </div>
        <SitioActions sitio={sitio} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Preview Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Status card */}
          <EstadoCard sitio={sitio} versionActual={versionActual ?? null} />

          {/* Preview iframe */}
          {versionActual && (
            <div className="glass rounded-2xl border border-white/5 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white/5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground text-center">
                    {sitio.deployUrl || `preview · ${sitio.nombre.toLowerCase().replace(/\s/g, '-')}.webtory.cl`}
                  </div>
                </div>
                {sitio.deployUrl && (
                  <a
                    href={sitio.deployUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
              <iframe
                srcDoc={versionActual.htmlCompleto}
                className="w-full h-[500px] bg-white"
                sandbox="allow-scripts allow-same-origin"
                title={`Preview de ${sitio.nombre}`}
              />
            </div>
          )}

          {/* No version yet */}
          {!versionActual && sitio.estado !== 'generando' && (
            <div className="glass rounded-2xl border border-white/5 p-12 text-center">
              <Code2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Sitio pendiente de generación</h3>
              <p className="text-muted-foreground text-sm mb-6">
                {sitio.estado === 'pendiente_pago'
                  ? 'Completa el pago para que Claude genere tu sitio.'
                  : 'Tu sitio aún no ha sido generado.'}
              </p>
              {sitio.estado !== 'pendiente_pago' && (
                <GenerarButton sitioId={sitio.id} />
              )}
            </div>
          )}

          {sitio.estado === 'generando' && (
            <div className="glass rounded-2xl border border-indigo-500/30 p-12 text-center">
              <Loader2 className="w-12 h-12 text-indigo-400 mx-auto mb-4 animate-spin" />
              <h3 className="font-semibold mb-2">Claude está creando tu sitio...</h3>
              <p className="text-muted-foreground text-sm">
                Esto puede tomar entre 30-90 segundos según el plan. ¡Espera la magia!
              </p>
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Info */}
          <div className="glass rounded-2xl border border-white/5 p-5">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Información del sitio
            </h3>
            <div className="space-y-2.5 text-sm">
              <InfoRow label="Empresa" value={sitio.nombre} />
              <InfoRow label="Rubro" value={contenido.rubro || '—'} />
              <InfoRow label="Ciudad" value={contenido.ciudad || '—'} />
              <InfoRow label="Plan" value={PLAN_NOMBRES[sitio.plan as keyof typeof PLAN_NOMBRES]} />
              <InfoRow label="Creado" value={formatFecha(sitio.createdAt)} />
              <InfoRow label="Actualizado" value={formatFecha(sitio.updatedAt)} />
              {sitio.deployUrl && (
                <div className="pt-2 border-t border-white/5">
                  <a
                    href={sitio.deployUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors text-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {sitio.deployUrl.replace('https://', '')}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Version history */}
          {versiones.length > 0 && (
            <div className="glass rounded-2xl border border-white/5 p-5">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" />
                Historial de versiones
              </h3>
              <div className="space-y-2">
                {versiones.slice(0, 5).map(v => (
                  <div
                    key={v.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl text-xs ${
                      v.esActual
                        ? 'bg-indigo-500/10 border border-indigo-500/20'
                        : 'hover:bg-white/5 transition-colors'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`font-mono font-bold ${v.esActual ? 'text-indigo-400' : 'text-muted-foreground'}`}>
                        v{v.numeroVersion}
                      </span>
                      {v.esActual && (
                        <span className="text-xs bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">
                          actual
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatFecha(v.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function EstadoCard({
  sitio,
  versionActual,
}: {
  sitio: any
  versionActual: any
}) {
  const estadoMap = {
    publicado: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', label: 'Publicado' },
    borrador: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', label: 'Borrador' },
    generando: { icon: Loader2, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20', label: 'Generando...' },
    error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', label: 'Error' },
    pendiente_pago: { icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', label: 'Pendiente pago' },
  }

  const config = estadoMap[sitio.estado as keyof typeof estadoMap] ?? estadoMap.borrador

  return (
    <div className={`glass rounded-2xl border p-4 flex items-center justify-between ${config.bg}`}>
      <div className="flex items-center gap-3">
        <config.icon className={`w-5 h-5 ${config.color} ${sitio.estado === 'generando' ? 'animate-spin' : ''}`} />
        <div>
          <p className="font-semibold text-sm">{config.label}</p>
          {versionActual && (
            <p className="text-xs text-muted-foreground">
              Versión {versionActual.numeroVersion} · {versionActual.tokensUsados?.toLocaleString() || '—'} tokens
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {sitio.estado === 'borrador' && versionActual && (
          <Link
            href={`/dashboard/sitios/${sitio.id}/editar`}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg glass glass-hover text-muted-foreground hover:text-white"
          >
            <Edit2 className="w-3 h-3" />
            Editar
          </Link>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className="text-right font-medium text-sm">{value}</span>
    </div>
  )
}

function GenerarButton({ sitioId }: { sitioId: string }) {
  return (
    <form action={`/api/generar`} method="POST">
      <input type="hidden" name="sitioId" value={sitioId} />
      <button
        type="submit"
        className="inline-flex items-center gap-2 btn-gradient text-white font-semibold px-6 py-3 rounded-xl text-sm"
      >
        <Rocket className="w-4 h-4" />
        Generar mi sitio ahora
      </button>
    </form>
  )
}
