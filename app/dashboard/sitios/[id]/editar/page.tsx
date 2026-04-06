import { auth } from '@/auth'
import { db, sitios, suscripciones, edicionesMensuales } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { redirect, notFound } from 'next/navigation'
import { EditorSitio } from '@/components/dashboard/EditorSitio'
import { PLAN_LIMITE_EDICIONES } from '@/lib/utils'

export default async function EditarSitioPage({
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

  // Verificar ediciones disponibles
  const ahora = new Date()
  const [edicionesMes] = await db
    .select()
    .from(edicionesMensuales)
    .where(
      and(
        eq(edicionesMensuales.userId, session.user.id as string),
        eq(edicionesMensuales.sitioId, params.id),
        eq(edicionesMensuales.mes, ahora.getMonth() + 1),
        eq(edicionesMensuales.año, ahora.getFullYear())
      )
    )
    .limit(1)

  const limite = PLAN_LIMITE_EDICIONES[sitio.plan as keyof typeof PLAN_LIMITE_EDICIONES]
  const edicionesUsadas = edicionesMes?.edicionesUsadas ?? 0
  const puedeEditar = limite === -1 || edicionesUsadas < limite || limite === 0

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black mb-2">Editar sitio</h1>
        <p className="text-muted-foreground text-sm">
          {limite === -1
            ? 'Ediciones ilimitadas este mes'
            : `${edicionesUsadas}/${limite} ediciones usadas este mes`}
        </p>
      </div>

      {!puedeEditar ? (
        <div className="glass rounded-2xl border border-orange-500/30 p-8 text-center">
          <p className="font-semibold text-orange-400 mb-2">Límite de ediciones alcanzado</p>
          <p className="text-muted-foreground text-sm mb-6">
            Usaste todas las ediciones del mes. El contador se reinicia el 1 del próximo mes.
          </p>
          <a
            href="/#planes"
            className="inline-flex items-center gap-2 btn-gradient text-white font-semibold px-6 py-3 rounded-xl text-sm"
          >
            Actualizar plan para más ediciones
          </a>
        </div>
      ) : (
        <EditorSitio sitio={sitio} edicionesUsadas={edicionesUsadas} limiteEdiciones={limite} />
      )}
    </div>
  )
}
