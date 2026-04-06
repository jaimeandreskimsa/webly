import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getConfig } from '@/lib/config'

export async function GET() {
  const session = await auth()
  if (!session?.user || (session.user as any).rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const falKey = await getConfig('fal_api_key', '')

  if (!falKey || falKey.includes('●')) {
    return NextResponse.json({ ok: false, error: 'API key no configurada' })
  }

  try {
    // Verificar key con una generación mínima (1 imagen, resolución mínima)
    const res = await fetch('https://fal.run/fal-ai/nano-banana-2', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'test connection',
        num_images: 1,
        resolution: '0.5K',
        output_format: 'jpeg',
        limit_generations: true,
      }),
    })

    if (!res.ok) {
      const txt = await res.text()
      // 401/403 = key inválida
      if (res.status === 401 || res.status === 403) {
        return NextResponse.json({ ok: false, error: 'API key inválida o sin permisos' })
      }
      return NextResponse.json({ ok: false, error: `fal.ai respondió ${res.status}: ${txt.slice(0, 100)}` })
    }

    const data = await res.json()
    const imageUrl = data.images?.[0]?.url ?? null

    // Obtener saldo desde la API de billing de fal.ai
    let balance: string | null = null
    try {
      const billingRes = await fetch('https://fal.ai/api/billing/credits', {
        headers: {
          'Authorization': `Key ${falKey}`,
          'Content-Type': 'application/json',
        },
      })
      if (billingRes.ok) {
        const billingData = await billingRes.json()
        // Puede venir como { balance: 12.34 } o { credits: 1234 } según la API
        const raw = billingData.balance ?? billingData.credits ?? billingData.remaining ?? null
        if (raw !== null) balance = String(raw)
      }
    } catch {
      // No bloqueante — la conexión igual es ok
    }

    return NextResponse.json({
      ok: true,
      model: 'fal-ai/nano-banana-2',
      imageUrl,
      balance,
    })
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      error: e?.message?.slice(0, 120) ?? 'Error desconocido',
    })
  }
}
