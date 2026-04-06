import { db, solicitudesAyuda, usuarios } from '@/lib/db'
import { eq, desc } from 'drizzle-orm'
import { HelpCircle } from 'lucide-react'
import { SolicitudesAdminClient } from '@/components/admin/SolicitudesAdminClient'

export default async function AdminSolicitudesPage() {
  const solicitudes = await db
    .select({
      id: solicitudesAyuda.id,
      tipo: solicitudesAyuda.tipo,
      mensaje: solicitudesAyuda.mensaje,
      leida: solicitudesAyuda.leida,
      atendida: solicitudesAyuda.atendida,
      createdAt: solicitudesAyuda.createdAt,
      userId: solicitudesAyuda.userId,
      usuarioNombre: usuarios.nombre,
      usuarioEmail: usuarios.email,
    })
    .from(solicitudesAyuda)
    .leftJoin(usuarios, eq(solicitudesAyuda.userId, usuarios.id))
    .orderBy(desc(solicitudesAyuda.createdAt))

  const pendientes = solicitudes.filter(s => !s.atendida).length

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-indigo-400" />
            Solicitudes de ayuda
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {pendientes > 0
              ? `${pendientes} solicitud${pendientes > 1 ? 'es' : ''} pendiente${pendientes > 1 ? 's' : ''}`
              : 'Todo al día'}
          </p>
        </div>
        <div className="flex gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
            Nueva
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Atendida
          </span>
        </div>
      </div>

      <SolicitudesAdminClient solicitudes={solicitudes} />
    </div>
  )
}
