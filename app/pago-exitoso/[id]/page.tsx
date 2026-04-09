import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { db, pagos, sitios, usuarios } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { obtenerEstadoPago, getFlowCredentials } from '@/lib/flow'

/**
 * Landing público después del pago en Flow.
 * NO está bajo /dashboard → no requiere sesión activa.
 * Verifica el pago server-side y redirige al wizard (o login con callbackUrl).
 */
interface Props {
  params: Promise<{ id: string }>
}

export default async function PagoExitosoPage({ params }: Props) {
  const { id: sitioId } = await params
  const session = await auth()

  // Buscar el sitio sin requerir que pertenezca al usuario de sesión
  // (la sesión puede haberse perdido en el cross-site redirect de Flow)
  const [sitio] = await db
    .select()
    .from(sitios)
    .where(eq(sitios.id, sitioId))
    .limit(1)

  if (!sitio) {
    redirect('/dashboard')
  }

  const wizardUrl = `/dashboard/sitios/${sitioId}/configurar`
  const loginUrl = `/login?callbackUrl=${encodeURIComponent(wizardUrl)}`

  // Si el sitio ya está listo no hay nada que verificar
  if (sitio.estado === 'publicado' || sitio.estado === 'generando') {
    const dest = `/dashboard/sitios/${sitioId}`
    if (!session?.user) redirect(`/login?callbackUrl=${encodeURIComponent(dest)}`)
    redirect(dest)
  }

  if (sitio.estado === 'borrador') {
    // Pago ya aprobado (por webhook) — ir directo al wizard
    if (!session?.user) redirect(loginUrl)
    redirect(wizardUrl)
  }

  // Estado: pendiente_pago — verificar con Flow antes de renderar
  const todosPagos = await db
    .select()
    .from(pagos)
    .where(eq(pagos.userId, sitio.userId))

  const pago = todosPagos
    .filter(p => p.flowOrder?.startsWith(sitioId + '|'))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

  if (pago?.estado === 'aprobado') {
    // DB ya lo tiene aprobado — sólo asegurarse de que el sitio esté en borrador
    await db
      .update(sitios)
      .set({ estado: 'borrador', updatedAt: new Date() })
      .where(eq(sitios.id, sitioId))
    if (!session?.user) redirect(loginUrl)
    redirect(wizardUrl)
  }

  if (pago?.flowToken) {
    try {
      const { apiKey, secretKey } = await getFlowCredentials()
      if (apiKey && secretKey) {
        const estadoFlow = await obtenerEstadoPago({
          apiKey,
          secretKey,
          token: pago.flowToken,
        })

        if (estadoFlow.status === 1) {
          // Pago confirmado por Flow → marcar todo en DB
          await Promise.all([
            db.update(pagos)
              .set({ estado: 'aprobado', updatedAt: new Date() })
              .where(eq(pagos.id, pago.id)),
            db.update(sitios)
              .set({ estado: 'borrador', plan: sitio.plan as any, updatedAt: new Date() })
              .where(eq(sitios.id, sitioId)),
            db.update(usuarios)
              .set({ plan: sitio.plan as any, updatedAt: new Date() })
              .where(eq(usuarios.id, sitio.userId)),
          ])

          if (!session?.user) redirect(loginUrl)
          redirect(wizardUrl)
        }
      }
    } catch (err) {
      console.error('[pago-exitoso] Error verificando Flow:', err)
    }
  }

  // Flow aún no confirmó (webhook tardío) — ir a esperar
  if (!session?.user) redirect(loginUrl)
  redirect(`/dashboard/sitios/${sitioId}/esperando-pago`)
}
