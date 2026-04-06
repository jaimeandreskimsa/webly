import { db, usuarios, sitios, pagos } from '@/lib/db'
import { eq, count, sum, desc } from 'drizzle-orm'
import { formatFecha, formatCLP, PLAN_NOMBRES } from '@/lib/utils'
import { Users, Search } from 'lucide-react'
import { AdminUsuarioActions } from '@/components/admin/AdminUsuarioActions'

export default async function AdminUsuariosPage() {
  // Obtener todos los usuarios con sus stats
  const todosUsuarios = await db
    .select()
    .from(usuarios)
    .orderBy(desc(usuarios.createdAt))

  const statsUsuarios = await Promise.all(
    todosUsuarios.map(async (u) => {
      const [{ totalSitios }] = await db
        .select({ totalSitios: count() })
        .from(sitios)
        .where(eq(sitios.userId, u.id))

      const [{ totalGastado }] = await db
        .select({ totalGastado: sum(pagos.monto) })
        .from(pagos)
        .where(eq(pagos.userId, u.id) && eq(pagos.estado, 'aprobado'))

      return { ...u, totalSitios, totalGastado: Number(totalGastado ?? 0) }
    })
  )

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            Usuarios
          </h1>
          <p className="text-slate-400 text-sm mt-1">{todosUsuarios.length} usuarios registrados</p>
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
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Rol</th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Sitios</th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Total gastado</th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Registro</th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Estado</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody>
              {statsUsuarios.map((u) => (
                <tr key={u.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {u.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white">{u.nombre}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <PlanBadge plan={u.plan || 'basico'} />
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      u.rol === 'admin'
                        ? 'bg-red-500/15 text-red-400 border border-red-500/25'
                        : 'bg-white/5 text-slate-400'
                    }`}>
                      {u.rol || 'usuario'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-white font-medium">{u.totalSitios}</td>
                  <td className="px-5 py-3.5 text-green-400 font-medium">
                    {u.totalGastado > 0 ? formatCLP(u.totalGastado) : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">{formatFecha(u.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      u.activo !== false
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {u.activo !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <AdminUsuarioActions usuario={u} />
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

function PlanBadge({ plan }: { plan: string }) {
  const cfg: Record<string, string> = {
    basico: 'bg-blue-500/10 text-blue-400',
    pro: 'bg-violet-500/10 text-violet-400',
    premium: 'bg-amber-500/10 text-amber-400',
    broker: 'bg-emerald-500/10 text-emerald-400',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${cfg[plan] ?? cfg.basico}`}>
      {PLAN_NOMBRES[plan as keyof typeof PLAN_NOMBRES] || plan}
    </span>
  )
}
