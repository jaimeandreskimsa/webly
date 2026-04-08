import { auth } from '@/auth'
import { db, sitios } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { redirect, notFound } from 'next/navigation'
import { EditorSitio } from '@/components/dashboard/EditorSitio'
import { PLAN_LIMITE_EDICIONES } from '@/lib/utils'

export default async function EditarSitioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')

  const [sitio] = await db
    .select()
    .from(sitios)
    .where(
      and(
        eq(sitios.id, id),
        eq(sitios.userId, session.user.id as string)
      )
    )
    .limit(1)

  if (!sitio) notFound()

  const limite = PLAN_LIMITE_EDICIONES[sitio.plan as keyof typeof PLAN_LIMITE_EDICIONES]
  // totalEdiciones cuenta las versiones generadas. La versión 1 es la creación,
  // así que las ediciones reales son totalEdiciones - 1 (mínimo 0)
  const edicionesUsadas = Math.max(0, (sitio.totalEdiciones ?? 1) - 1)
  const puedeEditar = edicionesUsadas < limite

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black mb-2">Editar sitio</h1>
        <p className="text-muted-foreground text-sm">
          {edicionesUsadas}/{limite} ediciones usadas · {sitio.nombre}
        </p>
      </div>

      {!puedeEditar ? (
        <div className="glass rounded-2xl border border-orange-500/30 p-8 text-center space-y-4">
          <p className="font-semibold text-orange-400 text-lg">Límite de ediciones alcanzado</p>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Usaste las {limite} ediciones incluidas en tu plan.
            Para seguir editando, contrata un plan de ediciones mensuales.
          </p>
          <a
            href="/#planes"
            className="inline-flex items-center gap-2 btn-gradient text-white font-semibold px-6 py-3 rounded-xl text-sm"
          >
            Ver planes de ediciones
          </a>
        </div>
      ) : (
        <EditorSitio sitio={sitio} edicionesUsadas={edicionesUsadas} limiteEdiciones={limite} />
      )}
    </div>
  )
}
