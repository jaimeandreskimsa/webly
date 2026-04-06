import { auth } from '@/auth'
import { WizardCreacion } from '@/components/wizard/WizardCreacion'

export default async function NuevoSitioPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>
}) {
  const session = await auth()
  const params = await searchParams
  const userPlan = (session!.user as any)?.plan || 'pro'
  const plan = (['basico', 'pro', 'premium', 'broker'].includes(params.plan || '')
    ? params.plan
    : userPlan) as 'basico' | 'pro' | 'premium' | 'broker'

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black mb-2">
          Crear nuevo sitio web
        </h1>
        <p className="text-muted-foreground text-sm">
          Completa los pasos y Claude AI generará tu sitio en segundos
        </p>
      </div>
      <WizardCreacion
        planInicial={plan}
        userId={session!.user!.id as string}
      />
    </div>
  )
}
