import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import Anthropic from '@anthropic-ai/sdk'

const TIPOS_PERMITIDOS = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })
    }

    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      return NextResponse.json(
        { error: 'Solo se aceptan PDF, JPG, PNG o WebP' },
        { status: 400 }
      )
    }

    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > 10) {
      return NextResponse.json({ error: 'El archivo no puede superar 10MB' }, { status: 400 })
    }

    // Dev mode sin API key real → devolver mock
    const apiKey = process.env.ANTHROPIC_API_KEY || ''
    if (!apiKey || apiKey.includes('xxxx')) {
      await new Promise(r => setTimeout(r, 1800)) // simular latencia
      return NextResponse.json({
        coloresPrimarios: '#2563eb',
        coloresSecundarios: '#7c3aed',
        tipografia: 'montserrat',
        tipoDiseno: 'moderno',
        descripcion: 'Manual analizado (modo dev). Identidad corporativa moderna con azul corporativo y violeta como acento.',
      })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const client = new Anthropic({ apiKey })

    // Claude soporta PDF e imágenes como documentos
    const contentItem: any = file.type === 'application/pdf'
      ? {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: base64 },
        }
      : {
          type: 'image',
          source: { type: 'base64', media_type: file.type as any, data: base64 },
        }

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            contentItem,
            {
              type: 'text',
              text: `Analiza este manual de marca o guía de identidad visual y extrae ÚNICAMENTE un JSON con este formato exacto (sin markdown ni texto extra):
{
  "coloresPrimarios": "#HEXCOLOR",
  "coloresSecundarios": "#HEXCOLOR",
  "tipografia": "nombre_fuente_google_fonts",
  "tipoDiseno": "moderno|dark|colorido|elegante|natural|tecnologico",
  "descripcion": "Una oración describiendo el estilo de marca"
}
Si no encuentras un color exacto, usa el más aproximado en HEX. Para tipografía usa solo nombres disponibles en Google Fonts (Inter, Montserrat, Playfair Display, Poppins, Raleway, Oswald, Roboto, etc).`,
            },
          ],
        },
      ],
    })

    const texto = response.content.find(b => b.type === 'text')?.text || ''
    const jsonMatch = texto.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Respuesta inválida de Claude')

    const resultado = JSON.parse(jsonMatch[0])
    return NextResponse.json(resultado)
  } catch (error: any) {
    console.error('Error analizando marca:', error)
    return NextResponse.json({ error: 'Error al analizar el manual de marca' }, { status: 500 })
  }
}
