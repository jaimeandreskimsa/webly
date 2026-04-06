import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getConfig } from '@/lib/config'
import Anthropic from '@anthropic-ai/sdk'

export async function GET() {
  const session = await auth()
  if (!session?.user || (session.user as any).rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Obtener la key desde DB (fuente de verdad)
  const apiKey = await getConfig('anthropic_api_key', '')

  if (!apiKey || apiKey.includes('●')) {
    return NextResponse.json({ ok: false, error: 'API key no configurada' })
  }

  try {
    const client = new Anthropic({ apiKey })
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Responde solo: ok' }],
    })
    const text = (msg.content[0] as any)?.text ?? ''
    return NextResponse.json({ ok: true, model: msg.model, reply: text.slice(0, 50) })
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      error: e?.message?.slice(0, 120) ?? 'Error desconocido',
    })
  }
}
