import { auth } from '@/auth'
import { db, sitios } from '@/lib/db'
import { eq, desc } from 'drizzle-orm'
import Link from 'next/link'
import { Globe, Plus, Sparkles } from 'lucide-react'
import { SitioCard } from '@/components/dashboard/SitioCard'

export default async function SitiosPage() {
  const session = await auth()
  const userId = session!.user!.id as string

  const misSitios = await db
    .select()
    .from(sitios)
    .where(eq(sitios.userId, userId))
    .orderBy(desc(sitios.updatedAt))

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mis sitios</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {misSitios.length} sitio{misSitios.length !== 1 ? 's' : ''} creado{misSitios.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/dashboard/nuevo"
          className="flex items-center gap-2 btn-gradient text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" />
          Nuevo sitio
          <Sparkles className="w-3.5 h-3.5" />
        </Link>
      </div>

      {misSitios.length === 0 ? (
        <div className="glass rounded-2xl border border-white/5 p-16 text-center">
          <Globe className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-bold text-xl mb-2">No tienes sitios aún</h3>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
            Crea tu primer sitio web con IA y tenlo publicado en menos de 5 minutos.
          </p>
          <Link
            href="/dashboard/nuevo"
            className="inline-flex items-center gap-2 btn-gradient text-white font-semibold px-8 py-3 rounded-xl"
          >
            <Plus className="w-4 h-4" />
            Crear mi primer sitio
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {misSitios.map(sitio => (
            <SitioCard key={sitio.id} sitio={sitio} />
          ))}
        </div>
      )}
    </div>
  )
}
