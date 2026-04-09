import { auth } from '@/auth'
import { Suspense } from 'react'
import { NuevoSitioClient } from './NuevoSitioClient'

export default async function NuevoPage() {
  const session = await auth()
  const isAdmin = (session?.user as any)?.rol === 'admin'

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Suspense>
        <NuevoSitioClient isAdmin={isAdmin} />
      </Suspense>
    </div>
  )
}
