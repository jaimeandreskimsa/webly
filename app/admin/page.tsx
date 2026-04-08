import { db, usuarios, sitios, pagos } from '@/lib/db'
import { eq, count, sum, desc, gte, sql } from 'drizzle-orm'
import {
  Users, Globe, CreditCard, TrendingUp, Zap,
  ArrowUpRight, CheckCircle2, Clock, AlertCircle, Activity, FlaskConical
} from 'lucide-react'
import { formatCLP, formatFecha } from '@/lib/utils'
import Link from 'next/link'

export default async function AdminPage() {
  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
  const inicioSemana = new Date(ahora)
  inicioSemana.setDate(ahora.getDate() - 7)

  const [
    totalUsuarios,
    usuariosEsteMes,
    totalSitios,
    sitiosPublicados,
    sitiosGenerando,
    totalPagos,
    revenueTotal,
    revenueMes,
    ultimosPagos,
    ultimosSitios,
    distribucionPlanes,
  ] = await Promise.all([
    db.select({ count: count() }).from(usuarios).then(r => r[0].count),
    db.select({ count: count() }).from(usuarios)
      .where(gte(usuarios.createdAt, inicioMes)).then(r => r[0].count),
    db.select({ count: count() }).from(sitios).then(r => r[0].count),
    db.select({ count: count() }).from(sitios)
      .where(eq(sitios.estado, 'publicado')).then(r => r[0].count),
    db.select({ count: count() }).from(sitios)
      .where(eq(sitios.estado, 'generando')).then(r => r[0].count),
    db.select({ count: count() }).from(pagos)
      .where(eq(pagos.estado, 'aprobado')).then(r => r[0].count),
    db.select({ total: sum(pagos.monto) }).from(pagos)
      .where(eq(pagos.estado, 'aprobado')).then(r => Number(r[0].total ?? 0)),
    db.select({ total: sum(pagos.monto) }).from(pagos)
      .where(eq(pagos.estado, 'aprobado') && gte(pagos.createdAt, inicioMes))
      .then(r => Number(r[0].total ?? 0)),
    db.select().from(pagos).where(eq(pagos.estado, 'aprobado'))
      .orderBy(desc(pagos.createdAt)).limit(5),
    db.select().from(sitios).orderBy(desc(sitios.createdAt)).limit(5),
    db.select({ plan: sitios.plan, count: count() })
      .from(sitios).groupBy(sitios.plan),
  ])

  const conversionRate = totalUsuarios > 0
    ? ((totalPagos / totalUsuarios) * 100).toFixed(1)
    : '0'

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-white">
          Overview del sistema
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {formatFecha(ahora)} · Todo en tiempo real
        </p>
      </div>

      {/* Herramientas de prueba */}
      <div className="glass rounded-2xl border border-violet-500/30 p-5 bg-violet-500/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white">Herramientas de prueba</h3>
            <p className="text-xs text-slate-400">Solo visible para admins · sin cobro</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/nuevo?plan=demo"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-300 hover:bg-violet-500/25 transition-all text-sm font-semibold"
          >
            <FlaskConical className="w-4 h-4" />
            Crear sitio demo (salta pago)
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all text-sm"
          >
            <Globe className="w-4 h-4" />
            Ver como usuario
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Usuarios totales"
          value={totalUsuarios}
          sub={`+${usuariosEsteMes} este mes`}
          icon={Users}
          trend="up"
          color="blue"
        />
        <KpiCard
          label="Revenue total"
          value={formatCLP(revenueTotal)}
          sub={`${formatCLP(revenueMes)} este mes`}
          icon={CreditCard}
          trend="up"
          color="green"
          isText
        />
        <KpiCard
          label="Sitios creados"
          value={totalSitios}
          sub={`${sitiosPublicados} publicados`}
          icon={Globe}
          trend="up"
          color="purple"
        />
        <KpiCard
          label="Conversión"
          value={`${conversionRate}%`}
          sub={`${totalPagos} pagos aprobados`}
          icon={TrendingUp}
          trend="neutral"
          color="orange"
          isText
        />
      </div>

      {/* Distribución de planes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { plan: 'basico', label: 'Básico', color: 'bg-blue-500', border: 'border-blue-500/30' },
          { plan: 'pro', label: 'Pro', color: 'bg-violet-500', border: 'border-violet-500/30' },
          { plan: 'premium', label: 'Premium', color: 'bg-amber-500', border: 'border-amber-500/30' },
          { plan: 'broker', label: 'Broker', color: 'bg-emerald-500', border: 'border-emerald-500/30' },
        ].map(({ plan, label, color, border }) => {
          const cantidad = distribucionPlanes.find(d => d.plan === plan)?.count ?? 0
          const pct = totalSitios > 0 ? Math.round((cantidad / totalSitios) * 100) : 0
          return (
            <div key={plan} className={`glass rounded-2xl border ${border} p-5`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-300">Plan {label}</span>
                <span className="text-2xl font-black text-white">{cantidad}</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${color} rounded-full transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5">{pct}% del total</p>
            </div>
          )
        })}
      </div>

      {/* Estado en vivo */}
      {sitiosGenerando > 0 && (
        <div className="flex items-center gap-3 glass rounded-xl border border-indigo-500/30 px-5 py-3">
          <Zap className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span className="text-sm font-medium">
            <span className="text-indigo-400 font-bold">{sitiosGenerando}</span>
            {' '}sitio{sitiosGenerando !== 1 ? 's' : ''} generándose ahora mismo con Claude AI
          </span>
          <div className="ml-auto flex gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
        </div>
      )}

      {/* Tablas */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Últimos pagos */}
        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-green-400" />
              Últimos pagos
            </h3>
            <a href="/admin/pagos" className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1">
              Ver todos <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          <div className="divide-y divide-white/5">
            {ultimosPagos.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-500 text-center">Sin pagos aún</p>
            ) : ultimosPagos.map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/3 transition-colors">
                <div>
                  <p className="text-sm font-medium capitalize">{p.plan}</p>
                  <p className="text-xs text-slate-500">{formatFecha(p.createdAt as Date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-400">{formatCLP(p.monto)}</p>
                  <span className="text-xs bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded-full">
                    {p.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Últimos sitios */}
        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              Últimos sitios creados
            </h3>
            <a href="/admin/sitios" className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1">
              Ver todos <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          <div className="divide-y divide-white/5">
            {ultimosSitios.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-500 text-center">Sin sitios aún</p>
            ) : ultimosSitios.map(s => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/3 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.nombre}</p>
                  <p className="text-xs text-slate-500 capitalize">{s.plan} · {formatFecha(s.createdAt as Date)}</p>
                </div>
                <EstadoBadge estado={s.estado ?? 'borrador'} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, trend, color, isText = false
}: {
  label: string
  value: string | number
  sub: string
  icon: React.ElementType
  trend: 'up' | 'down' | 'neutral'
  color: 'blue' | 'green' | 'purple' | 'orange'
  isText?: boolean
}) {
  const colors = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  }

  return (
    <div className="glass rounded-2xl border border-white/5 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-400">{label}</span>
        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className={`font-black text-white mb-1 ${isText ? 'text-lg' : 'text-3xl'}`}>
        {value}
      </div>
      <p className="text-xs text-slate-500">{sub}</p>
    </div>
  )
}

function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, { icon: React.ElementType; color: string }> = {
    publicado: { icon: CheckCircle2, color: 'text-green-400' },
    borrador: { icon: Clock, color: 'text-yellow-400' },
    generando: { icon: Activity, color: 'text-indigo-400' },
    error: { icon: AlertCircle, color: 'text-red-400' },
    pendiente_pago: { icon: Clock, color: 'text-orange-400' },
  }
  const cfg = map[estado] ?? map.borrador
  return (
    <div className={`flex items-center gap-1 text-xs ${cfg.color}`}>
      <cfg.icon className="w-3 h-3" />
      {estado.replace('_', ' ')}
    </div>
  )
}
