import { db, pagos, usuarios } from '@/lib/db'
import { eq, sum, count, desc } from 'drizzle-orm'
import { formatFecha, formatCLP, PLAN_NOMBRES } from '@/lib/utils'
import { CreditCard, TrendingUp, DollarSign } from 'lucide-react'

export default async function AdminPagosPage() {
  const todosPagos = await db
    .select({
      pago: pagos,
      usuarioNombre: usuarios.nombre,
      usuarioEmail: usuarios.email,
    })
    .from(pagos)
    .leftJoin(usuarios, eq(pagos.userId, usuarios.id))
    .orderBy(desc(pagos.createdAt))

  const [{ revenueTotal }] = await db
    .select({ revenueTotal: sum(pagos.monto) })
    .from(pagos)
    .where(eq(pagos.estado, 'aprobado'))

  const [{ totalAprobados }] = await db
    .select({ totalAprobados: count() })
    .from(pagos)
    .where(eq(pagos.estado, 'aprobado'))

  const revenueMap = await db
    .select({ plan: pagos.plan, total: sum(pagos.monto), cantidad: count() })
    .from(pagos)
    .where(eq(pagos.estado, 'aprobado'))
    .groupBy(pagos.plan)

  const ticketPromedio = totalAprobados > 0
    ? Math.round(Number(revenueTotal ?? 0) / totalAprobados)
    : 0

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-green-400" />
          Pagos & Revenue
        </h1>
        <p className="text-slate-400 text-sm mt-1">{todosPagos.length} transacciones totales</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-2xl border border-green-500/20 p-5">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-xs text-slate-400">Revenue total</span>
          </div>
          <div className="text-3xl font-black text-white">{formatCLP(Number(revenueTotal ?? 0))}</div>
          <p className="text-xs text-slate-500 mt-1">{totalAprobados} pagos aprobados</p>
        </div>
        <div className="glass rounded-2xl border border-blue-500/20 p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-slate-400">Ticket promedio</span>
          </div>
          <div className="text-3xl font-black text-white">{formatCLP(ticketPromedio)}</div>
          <p className="text-xs text-slate-500 mt-1">por transacción</p>
        </div>
        <div className="glass rounded-2xl border border-purple-500/20 p-5">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-slate-400">Revenue por plan</span>
          </div>
          <div className="space-y-1.5">
            {revenueMap.map(r => (
              <div key={r.plan} className="flex items-center justify-between text-xs">
                <span className="text-slate-400 capitalize">{PLAN_NOMBRES[r.plan as keyof typeof PLAN_NOMBRES]}</span>
                <span className="text-white font-medium">{formatCLP(Number(r.total ?? 0))}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Usuario</th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Plan</th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Monto</th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Estado</th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">MP ID</th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {todosPagos.map(({ pago: p, usuarioNombre, usuarioEmail }) => (
                <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-white text-xs font-medium">{usuarioNombre}</p>
                    <p className="text-slate-500 text-xs">{usuarioEmail}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                      p.plan === 'premium' ? 'bg-amber-500/10 text-amber-400' :
                      p.plan === 'pro' ? 'bg-violet-500/10 text-violet-400' :
                      'bg-blue-500/10 text-blue-400'
                    }`}>
                      {PLAN_NOMBRES[p.plan as keyof typeof PLAN_NOMBRES]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-green-400">{formatCLP(p.monto)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      p.estado === 'aprobado' ? 'bg-green-500/10 text-green-400' :
                      p.estado === 'pendiente' ? 'bg-yellow-500/10 text-yellow-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {p.estado}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs font-mono">
                    {p.flowToken?.slice(0, 12) || '—'}...
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">{formatFecha(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
