import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { db, sitios } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { WizardConfiguracion } from '@/components/wizard/WizardConfiguracion'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ demo?: string }>
}

export default async function ConfigurarSitioPage({ params, searchParams }: Props) {
  const { id } = await params
  const { demo } = await searchParams
  const isDemo = demo === '1'
  const session = await auth()
  if (!session?.user) redirect('/login')

  const [sitio] = await db
    .select()
    .from(sitios)
    .where(and(eq(sitios.id, id), eq(sitios.userId, session.user.id as string)))
    .limit(1)

  if (!sitio) redirect('/dashboard')

  if (sitio.estado === 'publicado' || sitio.estado === 'generando') {
    redirect(`/dashboard/sitios/${id}`)
  }

  // Si el pago aún no fue confirmado, redirigir a pago-exitoso que verifica con Flow
  // (evita hacer el call a Flow directamente aquí, lo que bloquea el render 3-8s)
  if (sitio.estado === 'pendiente_pago') {
    redirect(`/pago-exitoso/${id}`)
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <div className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 ${
          isDemo
            ? 'text-violet-400 bg-violet-500/10 border border-violet-500/20'
            : 'text-green-400 bg-green-500/10 border border-green-500/20'
        }`}>
          {isDemo ? '🧪 Modo Demo — Plan Premium · Sin costo' : '✅ Pago confirmado — Ahora personaliza tu sitio'}
        </div>
        <h1 className="text-2xl font-black mb-2">Cuéntanos sobre tu negocio</h1>
        <p className="text-muted-foreground text-sm">
          Con estos datos, Claude AI generará tu sitio web personalizado en minutos
        </p>
      </div>
      <WizardConfiguracion
        plan={sitio.plan as 'basico' | 'pro' | 'premium' | 'broker'}
        sitioId={id}
      />
    </div>
  )
}
