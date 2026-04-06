import { auth } from '@/auth'
import { db, sitios, suscripciones } from '@/lib/db'
import { eq, desc } from 'drizzle-orm'
import Link from 'next/link'
import {
  Globe, Plus, Zap, TrendingUp, Clock, Sparkles,
  ArrowRight, ExternalLink, Crown
} from 'lucide-react'
import { formatFecha, PLAN_NOMBRES } from '@/lib/utils'
import { SitioCard } from '@/components/dashboard/SitioCard'

export default async function DashboardPage() {
  const session = await auth()
  const userId = session!.user!.id as string
  const userPlan = (session!.user as any)?.plan || 'basico'

  const [misSitios, suscripcion] = await Promise.all([
    db
      .select()
      .from(sitios)
      .where(eq(sitios.userId, userId))
      .orderBy(desc(sitios.updatedAt))
      .limit(6),
    db
      .select()
      .from(suscripciones)
      .where(eq(suscripciones.userId, userId))
      .limit(1)
      .then(r => r[0] ?? null),
  ])

  const totalSitios = misSitios.length
  const sitiosPublicados = misSitios.filter(s => s.estado === 'publicado').length
  const nombre = session!.user!.name || 'Usuario'
  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {saludo}, <span className="gradient-text">{nombre.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestiona tus sitios web y crea nuevos con IA
          </p>
        </div>
        <Link
          href="/dashboard/nuevo"
          className="flex items-center gap-2 btn-gradient text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" />
          Crear nuevo sitio
          <Sparkles className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Sitios creados"
          value={totalSitios}
          icon={Globe}
          color="text-indigo-400"
          bg="bg-indigo-500/10 border-indigo-500/20"
        />
        <StatCard
          label="Publicados"
          value={sitiosPublicados}
          icon={ExternalLink}
          color="text-green-400"
          bg="bg-green-500/10 border-green-500/20"
        />
        <StatCard
          label="Plan actual"
          value={PLAN_NOMBRES[userPlan as keyof typeof PLAN_NOMBRES] || 'Básico'}
          icon={Crown}
          color="text-amber-400"
          bg="bg-amber-500/10 border-amber-500/20"
          isText
        />
        <StatCard
          label="Ediciones mes"
          value={suscripcion?.edicionesUsadasEsteMes ?? 0}
          suffix={suscripcion?.limiteEdiciones === -1 ? '/∞' : suscripcion ? `/${suscripcion.limiteEdiciones}` : '/0'}
          icon={TrendingUp}
          color="text-purple-400"
          bg="bg-purple-500/10 border-purple-500/20"
        />
      </div>

      {/* Plan upgrade banner (if basico) */}
      {userPlan === 'basico' && (
        <div className="relative rounded-2xl overflow-hidden p-6 border border-violet-500/30">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/15 to-purple-600/15" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">Desbloquea animaciones GSAP y deploy automático</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Actualiza al plan Pro o Premium para sitios con mayor impacto
                </p>
              </div>
            </div>
            <Link
              href="/#planes"
              className="flex items-center gap-1.5 text-sm font-medium text-violet-400 hover:text-violet-300 whitespace-nowrap transition-colors"
            >
              Ver planes <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Sites list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Mis sitios</h2>
          {totalSitios > 0 && (
            <Link
              href="/dashboard/sitios"
              className="text-sm text-muted-foreground hover:text-white transition-colors flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {totalSitios === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {misSitios.map(sitio => (
              <SitioCard key={sitio.id} sitio={sitio} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  label, value, suffix = '', icon: Icon, color, bg, isText = false
}: {
  label: string
  value: string | number
  suffix?: string
  icon: React.ElementType
  color: string
  bg: string
  isText?: boolean
}) {
  return (
    <div className={`glass rounded-xl p-4 border ${bg}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon className={`w-3.5 h-3.5 ${color}`} />
        </div>
      </div>
      <div className={`${isText ? 'text-lg' : 'text-2xl'} font-bold`}>
        {value}
        {suffix && <span className="text-muted-foreground text-sm font-normal">{suffix}</span>}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="glass rounded-2xl border border-white/5 p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
        <Globe className="w-8 h-8 text-indigo-400" />
      </div>
      <h3 className="font-bold text-lg mb-2">Aún no tienes sitios</h3>
      <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
        Crea tu primer sitio web con IA en menos de 5 minutos. Solo ingresa el contenido de tu negocio.
      </p>
      <Link
        href="/dashboard/nuevo"
        className="inline-flex items-center gap-2 btn-gradient text-white font-semibold px-6 py-3 rounded-xl text-sm hover:scale-105 transition-transform"
      >
        <Plus className="w-4 h-4" />
        Crear mi primer sitio
      </Link>
    </div>
  )
}
