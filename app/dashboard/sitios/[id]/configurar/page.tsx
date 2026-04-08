import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { db, sitios, pagos } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { WizardConfiguracion } from '@/components/wizard/WizardConfiguracion'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ConfigurarSitioPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')

  // Verificar que el sitio le pertenece al usuario
  const [sitio] = await db
    .select()
    .from(sitios)
    .where(and(eq(sitios.id, id), eq(sitios.userId, session.user.id as string)))
    .limit(1)

  if (!sitio) redirect('/dashboard')

  // Si ya fue configurado y está generando o publicado, redirigir a la vista del sitio
  if (sitio.estado === 'publicado' || sitio.estado === 'generando') {
    redirect(`/dashboard/sitios/${id}`)
  }

  // Verificar que el pago fue aprobado antes de mostrar el wizard
  // flowOrder tiene formato "{sitioId}|{userId}|{plan}|en"
  if (sitio.estado === 'pendiente_pago') {
    const todosPagos = await db
      .select({ estado: pagos.estado, flowOrder: pagos.flowOrder })
      .from(pagos)
      .where(eq(pagos.userId, session.user.id as string))

    const pagoAprobado = todosPagos.find(
      p => p.estado === 'aprobado' && p.flowOrder?.startsWith(id.replace(/-/g, '').slice(0, 10))
    )

    if (!pagoAprobado) {
      // Pago no confirmado aún — mostrar página de espera con polling
      redirect(`/dashboard/sitios/${id}/esperando-pago`)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 text-green-400 text-xs font-semibold bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full mb-4">
          ✅ Pago confirmado — Ahora personaliza tu sitio
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
