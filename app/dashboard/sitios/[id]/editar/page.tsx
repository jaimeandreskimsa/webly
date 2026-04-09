import { auth } from '@/auth'
import { db, sitios, versionesSitio } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { redirect, notFound } from 'next/navigation'
import { EditorSitio } from '@/components/dashboard/EditorSitio'
import { PLAN_LIMITE_EDICIONES } from '@/lib/utils'
import Link from 'next/link'
import { Rocket } from 'lucide-react'

export default async function EditarSitioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')

  const esAdmin = (session.user as any).rol === 'admin'

  const [sitio] = await db
    .select()
    .from(sitios)
    .where(
      esAdmin
        ? eq(sitios.id, id)
        : and(eq(sitios.id, id), eq(sitios.userId, session.user.id as string))
    )
    .limit(1)

  if (!sitio) notFound()

  // Obtener la versión actual y su HTML
  let htmlActual: string | null = null
  try {
    const [version] = await db
      .select({ htmlCompleto: versionesSitio.htmlCompleto })
      .from(versionesSitio)
      .where(and(eq(versionesSitio.sitioId, id), eq(versionesSitio.esActual, true)))
      .limit(1)
    htmlActual = version?.htmlCompleto ?? null
  } catch {}

  const tieneVersion = !!htmlActual
  const limite = PLAN_LIMITE_EDICIONES[sitio.plan as keyof typeof PLAN_LIMITE_EDICIONES]
  const edicionesUsadas = Math.max(0, (sitio.totalEdiciones ?? 1) - 1)
  const puedeEditar = edicionesUsadas < limite

  // Layout full-width cuando hay versión (para mostrar el editor visual split)
  const containerClass = tieneVersion
    ? 'w-full'
    : 'max-w-3xl mx-auto'

  return (
    <div className={containerClass}>
      <div className="mb-6">
        <h1 className="text-2xl font-black mb-1">Editar sitio</h1>
        <p className="text-muted-foreground text-sm">
          {edicionesUsadas}/{limite} ediciones con IA usadas · {sitio.nombre}
        </p>
      </div>

      {!tieneVersion ? (
        <div className="glass rounded-2xl border border-indigo-500/30 p-8 text-center space-y-4">
          <p className="font-semibold text-indigo-300 text-lg">Tu sitio aún no ha sido generado</p>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Primero genera tu sitio con IA, y luego podrás editarlo.
          </p>
          <Link
            href={`/dashboard/sitios/${id}/generando`}
            className="inline-flex items-center gap-2 btn-gradient text-white font-semibold px-6 py-3 rounded-xl text-sm"
          >
            <Rocket className="w-4 h-4" />
            Generar mi sitio ahora
          </Link>
        </div>
      ) : !puedeEditar ? (
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
        <EditorSitio
          sitio={sitio}
          edicionesUsadas={edicionesUsadas}
          limiteEdiciones={limite}
          htmlActual={htmlActual}
        />
      )}
    </div>
  )
}

