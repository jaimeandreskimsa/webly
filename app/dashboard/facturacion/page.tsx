import { auth } from '@/auth'
import { db, pagos, suscripciones, sitios } from '@/lib/db'
import { eq, desc, and } from 'drizzle-orm'
import FacturacionClient, { type SitioConSub, type PagoHistorial } from '@/components/dashboard/FacturacionClient'

export default async function FacturacionPage() {
  const session = await auth()
  const userId = session!.user!.id as string

  const [misSitios, misSuscripciones, historialPagos] = await Promise.all([
    db
      .select()
      .from(sitios)
      .where(eq(sitios.userId, userId))
      .orderBy(desc(sitios.createdAt)),
    db
      .select()
      .from(suscripciones)
      .where(and(eq(suscripciones.userId, userId), eq(suscripciones.activa, true))),
    db
      .select()
      .from(pagos)
      .where(eq(pagos.userId, userId))
      .orderBy(desc(pagos.createdAt))
      .limit(10),
  ])

  const sitiosConSub: SitioConSub[] = misSitios.map(sitio => {
    const sub = misSuscripciones.find(s => s.sitioId === sitio.id) ?? null
    return {
      id: sitio.id,
      nombre: sitio.nombre,
      plan: sitio.plan,
      estado: sitio.estado,
      deployUrl: sitio.deployUrl,
      createdAt: sitio.createdAt.toISOString(),
      suscripcion: sub
        ? {
            id: sub.id,
            plan: sub.plan,
            activa: sub.activa ?? false,
            edicionesUsadasEsteMes: sub.edicionesUsadasEsteMes ?? 0,
            limiteEdiciones: sub.limiteEdiciones ?? 0,
            fechaRenovacion: sub.fechaRenovacion?.toISOString() ?? null,
          }
        : null,
    }
  })

  const historial: PagoHistorial[] = historialPagos.map(p => ({
    id: p.id,
    plan: p.plan,
    monto: p.monto,
    estado: p.estado,
    createdAt: p.createdAt.toISOString(),
  }))

  return <FacturacionClient sitios={sitiosConSub} historial={historial} />
}
