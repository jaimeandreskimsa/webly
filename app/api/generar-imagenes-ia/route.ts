import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getConfig } from '@/lib/config'

// Límite de imágenes IA por plan
const LIMITE_IA_POR_PLAN = {
  basico: 0,
  pro: 5,
  premium: 10,
  broker: 10,
}

const FAL_MODEL = 'fal-ai/nano-banana-2'
const FAL_BASE = 'https://fal.run'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { prompt, cantidad, plan } = await req.json()

    if (!prompt || !cantidad || !plan) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    const limite = LIMITE_IA_POR_PLAN[plan as keyof typeof LIMITE_IA_POR_PLAN] ?? 2
    const cantidadFinal = Math.min(Math.max(1, Number(cantidad)), limite)

    // Leer API key de fal.ai desde la DB (con fallback a variable de entorno)
    const falKey = await getConfig('fal_api_key', process.env.FAL_API_KEY || '')

    // Si no hay key configurada → usar imágenes picsum de placeholder
    if (!falKey || falKey.includes('●')) {
      console.warn('[generar-imagenes-ia] fal.ai key no configurada, usando placeholder')
      const seed = prompt.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0)
      const urls = Array.from({ length: cantidadFinal }, (_, i) =>
        `https://picsum.photos/seed/${seed + i * 13}/1200/800`
      )
      return NextResponse.json({ urls, modo: 'placeholder' })
    }

    // Generar imágenes con fal.ai (llamadas paralelas)
    const promesas = Array.from({ length: cantidadFinal }, async () => {
      const body = {
        prompt: `Professional business photography for a website: ${prompt}. High quality, modern, clean, commercial photography style.`,
        num_images: 1,
        aspect_ratio: '16:9',
        output_format: 'jpeg',
        resolution: '1K',
      }

      const res = await fetch(`${FAL_BASE}/${FAL_MODEL}`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${falKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.text()
        throw new Error(`fal.ai error ${res.status}: ${err}`)
      }

      const data = await res.json()
      // Respuesta: { images: [{ url, file_name, content_type }], description }
      return data.images?.[0]?.url as string | undefined
    })

    const resultados = await Promise.allSettled(promesas)
    const urls: string[] = []

    for (const r of resultados) {
      if (r.status === 'fulfilled' && r.value) {
        urls.push(r.value)
      } else if (r.status === 'rejected') {
        console.error('[generar-imagenes-ia] fal.ai:', (r as PromiseRejectedResult).reason)
      }
    }

    if (urls.length === 0) {
      return NextResponse.json(
        { error: 'No se pudieron generar imágenes. Verifica la API key de fal.ai en el admin.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ urls, modo: 'fal.ai' })
  } catch (error: any) {
    console.error('[generar-imagenes-ia]', error)
    return NextResponse.json({ error: error.message || 'Error al generar imágenes' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ modelo: FAL_MODEL, limites: LIMITE_IA_POR_PLAN })
}
