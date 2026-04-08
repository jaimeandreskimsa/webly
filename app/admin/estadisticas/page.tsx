import { db, usuarios, sitios, pagos } from '@/lib/db'
import { eq, count, sum, desc, gte, and, sql } from 'drizzle-orm'
import {
  BarChart3, Users, Globe, CreditCard, TrendingUp,
  Zap, CheckCircle2, Clock, AlertCircle, Activity,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { formatCLP, formatFecha } from '@/lib/utils'

export default async function EstadisticasPage() {
  const ahora = new Date()

  // Rangos temporales
  const inicio7d  = new Date(ahora); inicio7d.setDate(ahora.getDate() - 7)
  const inicio30d = new Date(ahora); inicio30d.setDate(ahora.getDate() - 30)
  const inicio90d = new Date(ahora); inicio90d.setDate(ahora.getDate() - 90)
  const inicio7dAnt  = new Date(ahora); inicio7dAnt.setDate(ahora.getDate() - 14)
  const inicio30dAnt = new Date(ahora); inicio30dAnt.setDate(ahora.getDate() - 60)

  const [
    // Totales generales
    totalUsuarios,
    totalSitios,
    totalSitiosPublicados,
    totalSitiosBorrador,
    totalSitiosError,
    totalSitiosGenerando,
    totalPagosAprobados,
    revenueTotal,

    // Últimos 7 días
    usuarios7d,
    sitios7d,
    pagos7d,
    revenue7d,

    // 7 días anteriores (para comparar)
    usuarios7dAnt,
    pagos7dAnt,
    revenue7dAnt,

    // Últimos 30 días
    usuarios30d,
    sitios30d,
    pagos30d,
    revenue30d,

    // Últimos 90 días
    usuarios90d,
    pagos90d,
    revenue90d,

    // Distribución de planes (pagos)
    planDistPagos,

    // Distribución de planes (sitios)
    planDistSitios,

    // Sitios por estado
    sitiosPorEstado,

    // Últimos 10 pagos
    ultimosPagos,

    // Tokens usados (aproximado de actividad de IA)
    tokensTotal,
  ] = await Promise.all([
    db.select({ c: count() }).from(usuarios).then(r => r[0].c),
    db.select({ c: count() }).from(sitios).then(r => r[0].c),
    db.select({ c: count() }).from(sitios).where(eq(sitios.estado, 'publicado')).then(r => r[0].c),
    db.select({ c: count() }).from(sitios).where(eq(sitios.estado, 'borrador')).then(r => r[0].c),
    db.select({ c: count() }).from(sitios).where(eq(sitios.estado, 'error')).then(r => r[0].c),
    db.select({ c: count() }).from(sitios).where(eq(sitios.estado, 'generando')).then(r => r[0].c),
    db.select({ c: count() }).from(pagos).where(eq(pagos.estado, 'aprobado')).then(r => r[0].c),
    db.select({ t: sum(pagos.monto) }).from(pagos).where(eq(pagos.estado, 'aprobado')).then(r => Number(r[0].t ?? 0)),

    db.select({ c: count() }).from(usuarios).where(gte(usuarios.createdAt, inicio7d)).then(r => r[0].c),
    db.select({ c: count() }).from(sitios).where(gte(sitios.createdAt, inicio7d)).then(r => r[0].c),
    db.select({ c: count() }).from(pagos).where(and(eq(pagos.estado, 'aprobado'), gte(pagos.createdAt, inicio7d))).then(r => r[0].c),
    db.select({ t: sum(pagos.monto) }).from(pagos).where(and(eq(pagos.estado, 'aprobado'), gte(pagos.createdAt, inicio7d))).then(r => Number(r[0].t ?? 0)),

    db.select({ c: count() }).from(usuarios).where(and(gte(usuarios.createdAt, inicio7dAnt), sql`${usuarios.createdAt} < ${inicio7d}`)).then(r => r[0].c),
    db.select({ c: count() }).from(pagos).where(and(eq(pagos.estado, 'aprobado'), gte(pagos.createdAt, inicio7dAnt), sql`${pagos.createdAt} < ${inicio7d}`)).then(r => r[0].c),
    db.select({ t: sum(pagos.monto) }).from(pagos).where(and(eq(pagos.estado, 'aprobado'), gte(pagos.createdAt, inicio7dAnt), sql`${pagos.createdAt} < ${inicio7d}`)).then(r => Number(r[0].t ?? 0)),

    db.select({ c: count() }).from(usuarios).where(gte(usuarios.createdAt, inicio30d)).then(r => r[0].c),
    db.select({ c: count() }).from(sitios).where(gte(sitios.createdAt, inicio30d)).then(r => r[0].c),
    db.select({ c: count() }).from(pagos).where(and(eq(pagos.estado, 'aprobado'), gte(pagos.createdAt, inicio30d))).then(r => r[0].c),
    db.select({ t: sum(pagos.monto) }).from(pagos).where(and(eq(pagos.estado, 'aprobado'), gte(pagos.createdAt, inicio30d))).then(r => Number(r[0].t ?? 0)),

    db.select({ c: count() }).from(usuarios).where(gte(usuarios.createdAt, inicio90d)).then(r => r[0].c),
    db.select({ c: count() }).from(pagos).where(and(eq(pagos.estado, 'aprobado'), gte(pagos.createdAt, inicio90d))).then(r => r[0].c),
    db.select({ t: sum(pagos.monto) }).from(pagos).where(and(eq(pagos.estado, 'aprobado'), gte(pagos.createdAt, inicio90d))).then(r => Number(r[0].t ?? 0)),

    db.select({ plan: pagos.plan, c: count(), monto: sum(pagos.monto) })
      .from(pagos).where(eq(pagos.estado, 'aprobado')).groupBy(pagos.plan),

    db.select({ plan: sitios.plan, c: count() })
      .from(sitios).groupBy(sitios.plan),

    db.select({ estado: sitios.estado, c: count() })
      .from(sitios).groupBy(sitios.estado),

    db.select().from(pagos).where(eq(pagos.estado, 'aprobado'))
      .orderBy(desc(pagos.createdAt)).limit(10),

    db.select({ t: sql<number>`coalesce(sum(tokens_usados), 0)` })
      .from(sql`versiones_sitio`).then(r => Number(r[0]?.t ?? 0)).catch(() => 0),
  ])

  const conversionRate = totalUsuarios > 0
    ? ((totalPagosAprobados / totalUsuarios) * 100).toFixed(1)
    : '0'

  function delta(actual: number, anterior: number) {
    if (anterior === 0) return actual > 0 ? 100 : 0
    return Math.round(((actual - anterior) / anterior) * 100)
  }

  const deltaUsuarios7d = delta(usuarios7d, usuarios7dAnt)
  const deltaPagos7d    = delta(pagos7d, pagos7dAnt)
  const deltaRevenue7d  = delta(revenue7d, revenue7dAnt)

  const PLAN_COLORS: Record<string, string> = {
    basico:  'bg-blue-500',
    pro:     'bg-violet-500',
    premium: 'bg-amber-500',
    broker:  'bg-emerald-500',
  }
  const PLAN_LABELS: Record<string, string> = {
    basico: 'Básico', pro: 'Pro', premium: 'Premium', broker: 'Broker', demo: 'Demo',
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-violet-400" />
          Estadísticas
        </h1>
        <p className="text-slate-400 text-sm mt-1">Métricas completas del sistema · {formatFecha(ahora)}</p>
      </div>

      {/* Resumen rápido 7 días vs semana anterior */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DeltaCard
          label="Nuevos usuarios (7d)"
          value={usuarios7d}
          delta={deltaUsuarios7d}
          icon={Users}
          color="blue"
        />
        <DeltaCard
          label="Revenue (7d)"
          value={formatCLP(revenue7d)}
          delta={deltaRevenue7d}
          isText
          icon={CreditCard}
          color="green"
        />
        <DeltaCard
          label="Pagos aprobados (7d)"
          value={pagos7d}
          delta={deltaPagos7d}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Períodos: 7d / 30d / 90d */}
      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h3 className="font-semibold text-sm text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            Actividad por período
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3 text-xs text-slate-400 font-medium">Período</th>
                <th className="text-right px-5 py-3 text-xs text-slate-400 font-medium">Usuarios</th>
                <th className="text-right px-5 py-3 text-xs text-slate-400 font-medium">Sitios</th>
                <th className="text-right px-5 py-3 text-xs text-slate-400 font-medium">Pagos</th>
                <th className="text-right px-5 py-3 text-xs text-slate-400 font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                { label: 'Últimos 7 días',  u: usuarios7d,  s: sitios7d,  p: pagos7d,  r: revenue7d },
                { label: 'Últimos 30 días', u: usuarios30d, s: sitios30d, p: pagos30d, r: revenue30d },
                { label: 'Últimos 90 días', u: usuarios90d, s: 0,         p: pagos90d, r: revenue90d },
                { label: 'Total acumulado', u: totalUsuarios, s: totalSitios, p: totalPagosAprobados, r: revenueTotal },
              ].map(row => (
                <tr key={row.label} className="hover:bg-white/3 transition-colors">
                  <td className="px-5 py-3 text-slate-300 font-medium">{row.label}</td>
                  <td className="px-5 py-3 text-right text-white font-mono">{row.u.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right text-white font-mono">{row.s > 0 ? row.s.toLocaleString() : '—'}</td>
                  <td className="px-5 py-3 text-right text-white font-mono">{row.p.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right text-green-400 font-mono font-semibold">{formatCLP(row.r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Distribución de planes (por revenue) */}
        <div className="glass rounded-2xl border border-white/5 p-5">
          <h3 className="font-semibold text-sm text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-green-400" />
            Revenue por plan
          </h3>
          <div className="space-y-3">
            {planDistPagos.sort((a, b) => Number(b.monto ?? 0) - Number(a.monto ?? 0)).map(p => {
              const monto = Number(p.monto ?? 0)
              const pct = revenueTotal > 0 ? Math.round((monto / revenueTotal) * 100) : 0
              const color = PLAN_COLORS[p.plan] ?? 'bg-slate-500'
              return (
                <div key={p.plan}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 capitalize">{PLAN_LABELS[p.plan] ?? p.plan} ({p.c} pagos)</span>
                    <span className="text-white font-semibold">{formatCLP(monto)}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-right text-xs text-slate-500 mt-0.5">{pct}%</p>
                </div>
              )
            })}
            {planDistPagos.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-4">Sin pagos aún</p>
            )}
          </div>
        </div>

        {/* Estado de sitios */}
        <div className="glass rounded-2xl border border-white/5 p-5">
          <h3 className="font-semibold text-sm text-white mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-400" />
            Estado de sitios
          </h3>
          <div className="space-y-3">
            {[
              { key: 'publicado',      label: 'Publicados',        color: 'bg-green-500',  val: totalSitiosPublicados },
              { key: 'borrador',       label: 'Borrador',          color: 'bg-yellow-500', val: totalSitiosBorrador },
              { key: 'generando',      label: 'Generando ahora',   color: 'bg-indigo-500', val: totalSitiosGenerando },
              { key: 'error',          label: 'Error',             color: 'bg-red-500',    val: totalSitiosError },
            ].map(row => {
              const pct = totalSitios > 0 ? Math.round((row.val / totalSitios) * 100) : 0
              return (
                <div key={row.key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">{row.label}</span>
                    <span className="text-white font-semibold">{row.val} <span className="text-slate-500">({pct}%)</span></span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full ${row.color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-xs text-slate-400">
            <span>Total sitios</span>
            <span className="text-white font-bold">{totalSitios}</span>
          </div>
        </div>
      </div>

      {/* KPIs secundarios */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Tasa de conversión" value={`${conversionRate}%`} sub="usuarios → pagos" />
        <StatCard label="Revenue promedio" value={formatCLP(totalPagosAprobados > 0 ? Math.round(revenueTotal / totalPagosAprobados) : 0)} sub="por pago" />
        <StatCard label="Sitios por usuario" value={(totalUsuarios > 0 ? (totalSitios / totalUsuarios).toFixed(1) : '0')} sub="promedio" />
        <StatCard label="Tokens IA usados" value={tokensTotal > 0 ? `${(tokensTotal / 1000).toFixed(0)}k` : '—'} sub="acumulado" />
      </div>

      {/* Últimos pagos */}
      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h3 className="font-semibold text-sm text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-green-400" />
            Últimos 10 pagos aprobados
          </h3>
          <a href="/admin/pagos" className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1">
            Ver todos <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3 text-xs text-slate-400 font-medium">Plan</th>
                <th className="text-left px-5 py-3 text-xs text-slate-400 font-medium">Fecha</th>
                <th className="text-right px-5 py-3 text-xs text-slate-400 font-medium">Monto</th>
                <th className="text-right px-5 py-3 text-xs text-slate-400 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ultimosPagos.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">Sin pagos aún</td></tr>
              ) : ultimosPagos.map(p => (
                <tr key={p.id} className="hover:bg-white/3 transition-colors">
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
                      ${p.plan === 'premium' ? 'bg-amber-500/15 text-amber-300' :
                        p.plan === 'pro' ? 'bg-violet-500/15 text-violet-300' :
                        p.plan === 'broker' ? 'bg-emerald-500/15 text-emerald-300' :
                        'bg-blue-500/15 text-blue-300'}`}>
                      {PLAN_LABELS[p.plan] ?? p.plan}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{formatFecha(p.createdAt as Date)}</td>
                  <td className="px-5 py-3 text-right text-green-400 font-mono font-semibold">{formatCLP(p.monto)}</td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">aprobado</span>
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

// ─── Sub-components ──────────────────────────────────────────────────────────

function DeltaCard({
  label, value, delta, icon: Icon, color, isText = false,
}: {
  label: string
  value: string | number
  delta: number
  icon: React.ElementType
  color: 'blue' | 'green' | 'purple'
  isText?: boolean
}) {
  const colors = {
    blue:   'text-blue-400   bg-blue-500/10   border-blue-500/20',
    green:  'text-green-400  bg-green-500/10  border-green-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  }
  const isPositive = delta >= 0
  return (
    <div className="glass rounded-2xl border border-white/5 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-400">{label}</span>
        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className={`font-black text-white mb-2 ${isText ? 'text-xl' : 'text-3xl'}`}>{value}</div>
      <div className={`flex items-center gap-1 text-xs font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive
          ? <ArrowUpRight className="w-3.5 h-3.5" />
          : <ArrowDownRight className="w-3.5 h-3.5" />
        }
        {Math.abs(delta)}% vs semana anterior
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="glass rounded-2xl border border-white/5 p-5">
      <p className="text-xs text-slate-400 mb-2">{label}</p>
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{sub}</p>
    </div>
  )
}
