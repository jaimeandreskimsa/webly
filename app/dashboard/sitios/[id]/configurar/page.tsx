import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { db, sitios, pagos, usuarios } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { WizardConfiguracion } from '@/components/wizard/WizardConfiguracion'
import { obtenerEstadoPago, getFlowCredentials } from '@/lib/flow'

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

  // Si el sitio sigue pendiente de pago, verificar con Flow directamente
  if (sitio.estado === 'pendiente_pago') {
    // Buscar el pago más reciente para este sitio
    const pagosSitio = await db
      .select()
      .from(pagos)
      .where(eq(pagos.userId, session.user.id as string))

    const shortId = id.replace(/-/g, '').slice(0, 10)
    const pagoDelSitio = pagosSitio
      .filter(p => p.flowOrder?.startsWith(shortId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

    // Si ya está aprobado en DB, continuar
    if (pagoDelSitio?.estado === 'aprobado') {
      await db.update(sitios).set({ estado: 'borrador', updatedAt: new Date() }).where(eq(sitios.id, id))
    } else if (pagoDelSitio?.flowToken) {
      // Consultar Flow directamente para no depender del webhook
      try {
        const { apiKey, secretKey } = await getFlowCredentials()
        if (apiKey && secretKey) {
          const estadoFlow = await obtenerEstadoPago({
            apiKey,
            secretKey,
            token: pagoDelSitio.flowToken,
          })

          if (estadoFlow.status === 1) {
            // Pago confirmado por Flow — aprobar en DB y continuar al wizard
            await db.update(pagos)
              .set({ estado: 'aprobado', updatedAt: new Date() })
              .where(eq(pagos.id, pagoDelSitio.id))

            await db.update(sitios)
              .set({ estado: 'borrador', plan: sitio.plan as any, updatedAt: new Date() })
              .where(eq(sitios.id, id))

            await db.update(usuarios)
              .set({ plan: sitio.plan as any, updatedAt: new Date() })
              .where(eq(usuarios.id, session.user.id as string))

            // Continuar al wizard (no redirigir, mostrar debajo)
          } else {
            // Flow dice que no está pagado
            redirect(`/dashboard/sitios/${id}/esperando-pago`)
          }
        } else {
          redirect(`/dashboard/sitios/${id}/esperando-pago`)
        }
      } catch {
        // Si Flow falla, ir a esperar
        redirect(`/dashboard/sitios/${id}/esperando-pago`)
      }
    } else {
      redirect(`/dashboard/sitios/${id}/esperando-pago`)
    }
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
