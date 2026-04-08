import { auth } from '@/auth'
import { db, pagos } from '@/lib/db'
import { eq, and, desc } from 'drizzle-orm'
import { Suspense } from 'react'
import { WizardCreacion } from '@/components/wizard/WizardCreacion'

export default async function NuevoPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>
}) {
  const session = await auth()
  const userId = session?.user?.id as string
  const isAdmin = (session?.user as any)?.rol === 'admin'

  const params = await searchParams

  // Verificar si el usuario ya tiene un pago aprobado
  const [pagoAprobado] = await db
    .select({ plan: pagos.plan })
    .from(pagos)
    .where(and(eq(pagos.userId, userId), eq(pagos.estado, 'aprobado')))
    .orderBy(desc(pagos.createdAt))
    .limit(1)

  const planPagado = pagoAprobado?.plan ?? null
  // Si tiene plan pagado, usar ese; sino, usar el del query param; sino 'pro'
  const planInicial = planPagado || params.plan || 'pro'

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Suspense>
        <WizardCreacion
          planInicial={planInicial}
          userId={userId}
          planPagado={planPagado}
          isAdmin={isAdmin}
        />
      </Suspense>
    </div>
  )
}
