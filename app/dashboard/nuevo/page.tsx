import { auth } from '@/auth'
import { db, pagos } from '@/lib/db'
import { eq, and, desc } from 'drizzle-orm'
import { Suspense } from 'react'
import { NuevoSitioClient } from './NuevoSitioClient'

export default async function NuevoPage() {
  const session = await auth()
  const userId = session?.user?.id as string

  // Verificar si el usuario ya tiene un pago aprobado
  const [pagoAprobado] = await db
    .select({ plan: pagos.plan })
    .from(pagos)
    .where(and(eq(pagos.userId, userId), eq(pagos.estado, 'aprobado')))
    .orderBy(desc(pagos.createdAt))
    .limit(1)

  return (
    <Suspense>
      <NuevoSitioClient
        planPagado={pagoAprobado?.plan ?? null}
        isAdmin={(session?.user as any)?.rol === 'admin'}
      />
    </Suspense>
  )
}
