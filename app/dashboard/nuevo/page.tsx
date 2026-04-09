import { auth } from '@/auth'
import { Suspense } from 'react'
import { NuevoSitioClient } from './NuevoSitioClient'
import { getPlanesConfig } from '@/lib/planes'

export default async function NuevoPage() {
  const session = await auth()
  const isAdmin = (session?.user as any)?.rol === 'admin'
  const precios = await getPlanesConfig()

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Suspense>
        <NuevoSitioClient isAdmin={isAdmin} precios={precios} />
      </Suspense>
    </div>
  )
}
