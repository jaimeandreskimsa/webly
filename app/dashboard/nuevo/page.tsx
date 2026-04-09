import { auth } from '@/auth'
import { db, pagos } from '@/lib/db'
import { eq, and, desc } from 'drizzle-orm'
import { Suspense } from 'react'
import { NuevoSitioClient } from './NuevoSitioClient'

export default async function NuevoPage() {
  const session = await auth()
  const userId = session?.user?.id as string
  const isAdmin = (session?.user as any)?.rol === 'admin'

  // Verificar si el usuario ya tiene un pago aprobado (puede crear sin pagar)
  const [pagoAprobado] = await db
    .select({ plan: pagos.plan })
    .from(pagos)
    .where(and(eq(pagos.userId, userId), eq(pagos.estado, 'aprobado')))
    .orderBy(desc(pagos.createdAt))
    .limit(1)

  const planPagado = pagoAprobado?.plan ?? null

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Suspense>
        <NuevoSitioClient
          planPagado={planPagado}
          isAdmin={isAdmin}
        />
      </Suspense>
    </div>
  )
}
