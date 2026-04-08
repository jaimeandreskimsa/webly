import { db, sitios, usuarios } from '@/lib/db'
import { eq, desc } from 'drizzle-orm'
import { formatFecha, PLAN_NOMBRES } from '@/lib/utils'
import Link from 'next/link'
import { Globe, ExternalLink, RefreshCw, AlertCircle, CheckCircle2, Clock, Activity, Loader2 } from 'lucide-react'
import { AdminSitioActions } from '@/components/admin/AdminSitioActions'

export default async function AdminSitiosPage() {
  const todosSitios = await db
    .select({
      sitio: sitios,
      usuarioNombre: usuarios.nombre,
      usuarioEmail: usuarios.email,
    })
    .from(sitios)
    .leftJoin(usuarios, eq(sitios.userId, usuarios.id))
    .orderBy(desc(sitios.createdAt))

  const total = todosSitios.length
  const publicados = todosSitios.filter(s => s.sitio.estado === 'publicado').length
  const generando = todosSitios.filter(s => s.sitio.estado === 'generando').length
  const errores = todosSitios.filter(s => s.sitio.estado === 'error').length

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Globe className="w-6 h-6 text-indigo-400" />
          Sitios
        </h1>
        <p className="text-slate-400 text-sm mt-1">{total} sitios creados en la plataforma</p>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: total, color: 'text-white' },
          { label: 'Publicados', value: publicados, color: 'text-green-400' },
          { label: 'Generando', value: generando, color: 'text-indigo-400' },
          { label: 'Errores', value: errores, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="glass rounded-xl border border-white/5 p-4 text-center">
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Sitio</th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Usuario</th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Plan</th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Estado</th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Deploy URL</th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Creado</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody>
              {todosSitios.map(({ sitio: s, usuarioNombre, usuarioEmail }) => (
                <tr key={s.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/sitios/${s.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                        <Globe className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                      <span className="font-medium text-white hover:text-indigo-300 transition-colors">{s.nombre}</span>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-white text-xs font-medium">{usuarioNombre ?? '—'}</p>
                    <p className="text-slate-500 text-xs">{usuarioEmail ?? '—'}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                      s.plan === 'premium' ? 'bg-amber-500/10 text-amber-400' :
                      s.plan === 'pro' ? 'bg-violet-500/10 text-violet-400' :
                      'bg-blue-500/10 text-blue-400'
                    }`}>
                      {PLAN_NOMBRES[s.plan as keyof typeof PLAN_NOMBRES]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <EstadoBadge estado={s.estado ?? 'borrador'} />
                  </td>
                  <td className="px-5 py-3.5">
                    {s.deployUrl ? (
                      <a href={s.deployUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                        <ExternalLink className="w-3 h-3" />
                        {s.deployUrl.replace('https://', '').slice(0, 25)}...
                      </a>
                    ) : (
                      <span className="text-xs text-slate-600">Sin deploy</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">{formatFecha(s.createdAt as Date)}</td>
                  <td className="px-5 py-3.5">
                    <AdminSitioActions sitioId={s.id} estado={s.estado ?? 'borrador'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    publicado: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10' },
    borrador: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    generando: { icon: Activity, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
    pendiente_pago: { icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  }
  const cfg = map[estado] ?? map.borrador
  return (
    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full w-fit ${cfg.bg} ${cfg.color}`}>
      <cfg.icon className="w-3 h-3" />
      {estado.replace('_', ' ')}
    </span>
  )
}
