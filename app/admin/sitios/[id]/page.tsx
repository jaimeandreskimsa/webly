import { auth } from '@/auth'
import { db, sitios, versionesSitio, usuarios } from '@/lib/db'
import { eq, and, desc } from 'drizzle-orm'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Globe, ArrowLeft, Clock, CheckCircle2, AlertCircle,
  Loader2, ExternalLink, User, Code2, History
} from 'lucide-react'
import { formatFecha, PLAN_NOMBRES } from '@/lib/utils'

export default async function AdminSitioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user || (session.user as any).rol !== 'admin') redirect('/dashboard')

  // Sin filtro de userId — admin ve cualquier sitio
  const [sitio] = await db
    .select()
    .from(sitios)
    .where(eq(sitios.id, id))
    .limit(1)

  if (!sitio) notFound()

  const [usuario] = await db
    .select({ nombre: usuarios.nombre, email: usuarios.email })
    .from(usuarios)
    .where(eq(usuarios.id, sitio.userId))
    .limit(1)

  const versiones = await db
    .select()
    .from(versionesSitio)
    .where(eq(versionesSitio.sitioId, id))
    .orderBy(desc(versionesSitio.numeroVersion))
    .limit(10)

  const versionActual = versiones.find(v => v.esActual)
  const contenido = (sitio.contenidoJson as any) ?? {}

  const estadoMap: Record<string, { icon: any; color: string; bg: string; label: string }> = {
    publicado:      { icon: CheckCircle2, color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20',   label: 'Publicado' },
    borrador:       { icon: Clock,        color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', label: 'Borrador' },
    generando:      { icon: Loader2,      color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20', label: 'Generando...' },
    error:          { icon: AlertCircle,  color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20',       label: 'Error' },
    pendiente_pago: { icon: Clock,        color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', label: 'Pendiente pago' },
  }
  const estadoCfg = estadoMap[sitio.estado ?? 'borrador'] ?? estadoMap.borrador

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/sitios"
          className="p-2 rounded-xl glass glass-hover text-muted-foreground hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-400" />
            {sitio.nombre}
          </h1>
          <p className="text-muted-foreground text-sm">
            Plan {PLAN_NOMBRES[sitio.plan as keyof typeof PLAN_NOMBRES]} ·{' '}
            {versiones.length} versión{versiones.length !== 1 ? 'es' : ''}
          </p>
        </div>
        {/* Estado */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border ${estadoCfg.bg} ${estadoCfg.color}`}>
          <estadoCfg.icon className={`w-3.5 h-3.5 ${sitio.estado === 'generando' ? 'animate-spin' : ''}`} />
          {estadoCfg.label}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Preview */}
        <div className="lg:col-span-2 space-y-4">
          {versionActual ? (
            <div className="glass rounded-2xl border border-white/5 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white/5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground text-center">
                    {sitio.deployUrl || `preview · ${sitio.nombre.toLowerCase().replace(/\s/g, '-')}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {sitio.deployUrl && (
                    <a href={sitio.deployUrl} target="_blank" rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-white transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
              <iframe
                srcDoc={versionActual.htmlCompleto}
                className="w-full h-[550px] bg-white"
                sandbox="allow-scripts allow-same-origin"
                title={`Preview de ${sitio.nombre}`}
              />
            </div>
          ) : (
            <div className="glass rounded-2xl border border-white/5 p-12 text-center">
              <Code2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">Sin versión generada todavía.</p>
            </div>
          )}

          {/* Historial de versiones */}
          {versiones.length > 0 && (
            <div className="glass rounded-2xl border border-white/5 p-5">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" />
                Historial de versiones
              </h3>
              <div className="space-y-2">
                {versiones.map(v => (
                  <div key={v.id} className={`flex items-center justify-between p-2.5 rounded-xl text-xs ${
                    v.esActual ? 'bg-indigo-500/10 border border-indigo-500/20' : 'hover:bg-white/5'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono font-bold ${v.esActual ? 'text-indigo-400' : 'text-muted-foreground'}`}>
                        v{v.numeroVersion}
                      </span>
                      {v.esActual && <span className="text-xs bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">actual</span>}
                      <span className="text-muted-foreground">{v.modeloUsado}</span>
                      <span className="text-muted-foreground">{v.tokensUsados?.toLocaleString()} tokens</span>
                      <span className="text-muted-foreground">{((v.htmlCompleto?.length ?? 0) / 1000).toFixed(0)}k chars</span>
                    </div>
                    <span className="text-muted-foreground">{formatFecha(v.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Usuario */}
          <div className="glass rounded-2xl border border-white/5 p-5">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" />
              Usuario
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nombre:</span>
                <span className="font-medium">{usuario?.nombre || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium text-xs">{usuario?.email || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">User ID:</span>
                <span className="font-mono text-xs text-muted-foreground">{sitio.userId.substring(0, 8)}…</span>
              </div>
            </div>
          </div>

          {/* Info del sitio */}
          <div className="glass rounded-2xl border border-white/5 p-5">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              Sitio
            </h3>
            <div className="space-y-2 text-sm">
              <InfoRow label="ID" value={sitio.id.substring(0, 8) + '…'} />
              <InfoRow label="Empresa" value={sitio.nombre} />
              <InfoRow label="Rubro" value={contenido.rubro || '—'} />
              <InfoRow label="Ciudad" value={contenido.ciudad || '—'} />
              <InfoRow label="Plan" value={PLAN_NOMBRES[sitio.plan as keyof typeof PLAN_NOMBRES]} />
              <InfoRow label="Versiones" value={String(versiones.length)} />
              <InfoRow label="Creado" value={formatFecha(sitio.createdAt)} />
              <InfoRow label="Actualizado" value={formatFecha(sitio.updatedAt)} />
            </div>
            {sitio.deployUrl && (
              <a href={sitio.deployUrl} target="_blank" rel="noopener noreferrer"
                className="mt-4 flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-xs transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
                {sitio.deployUrl.replace('https://', '')}
              </a>
            )}
          </div>

          {/* Acciones rápidas */}
          <div className="glass rounded-2xl border border-white/5 p-5 space-y-2">
            <h3 className="font-semibold text-sm mb-3">Acciones rápidas</h3>
            {versionActual && (
              <a
                href={`/api/sitios/${sitio.id}/preview`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-full px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                Abrir preview completo
              </a>
            )}
            {versionActual && (
              <a
                href={`/api/sitios/${sitio.id}/download`}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm transition-colors"
              >
                <Code2 className="w-3.5 h-3.5 text-green-400" />
                Descargar HTML (ZIP)
              </a>
            )}
            <Link
              href={`/dashboard/sitios/${sitio.id}/editar`}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-sm text-indigo-300 transition-colors"
            >
              <Code2 className="w-3.5 h-3.5" />
              Editar sitio (como admin)
            </Link>
          </div>
        </div>
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
