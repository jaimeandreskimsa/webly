import Anthropic from '@anthropic-ai/sdk'
import { getSystemPrompt, construirPromptUsuario } from './prompts'
import type { DatosWizard } from '@/components/wizard/WizardCreacion'
import { getConfig, isValidSecret } from '@/lib/config'

const MAX_TOKENS_POR_PLAN = {
  basico: 8000,
  pro: 16000,
  premium: 32000,
  broker: 24000,
}

export interface ResultadoGeneracion {
  html: string
  tokensUsados: number
  modeloUsado: string
}

// Carga configuración dinámica desde DB con fallbacks a constantes
async function getGeneratorConfig(plan: 'basico' | 'pro' | 'premium' | 'broker') {
  const [systemPromptDB, modelo, maxTokensStr, apiKeyDB] = await Promise.all([
    getConfig(`system_prompt_${plan}`, ''),
    getConfig('modelo_claude', 'claude-sonnet-4-6'),
    getConfig(`max_tokens_${plan}`, String(MAX_TOKENS_POR_PLAN[plan])),
    getConfig('anthropic_api_key', ''),
  ])
  const systemPrompt = (systemPromptDB && systemPromptDB.trim())
    ? systemPromptDB
    : getSystemPrompt(plan)
  const maxTokens = parseInt(maxTokensStr) || MAX_TOKENS_POR_PLAN[plan]
  const apiKey = isValidSecret(apiKeyDB) ? apiKeyDB : process.env.ANTHROPIC_API_KEY!
  return { systemPrompt, modelo, maxTokens, apiKey }
}

// ─── Generación completa (no streaming) ──────────────────────────────────────

function generarHTMLMock(datos: DatosWizard): ResultadoGeneracion {
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${datos.nombreEmpresa || 'Mi Empresa'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #0a0a0a; color: #fff; }
    header { background: linear-gradient(135deg, #6366f1, #a855f7); padding: 80px 20px; text-align: center; }
    header h1 { font-size: 3rem; font-weight: 900; margin-bottom: 16px; }
    header p { font-size: 1.2rem; opacity: 0.85; max-width: 600px; margin: 0 auto 32px; }
    .btn { background: #fff; color: #6366f1; padding: 14px 32px; border-radius: 50px; font-weight: 700; font-size: 1rem; display: inline-block; text-decoration: none; }
    section { padding: 80px 20px; max-width: 1100px; margin: 0 auto; }
    .badge { background: #1a1a2e; color: #a855f7; border: 1px solid #a855f7; padding: 6px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; display: inline-block; margin-bottom: 16px; }
    h2 { font-size: 2rem; font-weight: 800; margin-bottom: 12px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-top: 40px; }
    .card { background: #111; border: 1px solid #222; border-radius: 16px; padding: 28px; }
    .card h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; color: #a855f7; }
    .card p { color: #aaa; font-size: 0.9rem; line-height: 1.6; }
    footer { background: #111; border-top: 1px solid #222; padding: 40px 20px; text-align: center; color: #555; font-size: 0.85rem; }
    .dev-banner { background: #fbbf24; color: #000; text-align: center; padding: 10px; font-size: 0.8rem; font-weight: 700; }
  </style>
</head>
<body>
  <div class="dev-banner">⚡ MODO DESARROLLO — Este es un sitio de muestra. Configura tu ANTHROPIC_API_KEY para generar sitios reales.</div>
  <header>
    <h1>${datos.nombreEmpresa || 'Tu Empresa'}</h1>
    <p>${datos.descripcion || 'Descripción de tu empresa y sus servicios destacados.'}</p>
    <a href="#contacto" class="btn">Contáctanos</a>
  </header>
  <section>
    <div class="badge">Servicios</div>
    <h2>Lo que ofrecemos</h2>
    <div class="grid">
      ${datos.servicios.filter(s => s.nombre).map(s => `
      <div class="card">
        <h3>${s.nombre}</h3>
        <p>${s.descripcion || 'Descripción del servicio.'}</p>
        ${s.precio ? `<p style="color:#6366f1;font-weight:700;margin-top:12px;">${s.precio}</p>` : ''}
      </div>`).join('') || '<div class="card"><h3>Servicio 1</h3><p>Descripción del servicio.</p></div>'}
    </div>
  </section>
  <section id="contacto" style="background:#111;border-radius:24px;padding:60px;text-align:center;">
    <div class="badge">Contacto</div>
    <h2>Hablemos</h2>
    <p style="color:#aaa;margin:16px 0 32px;">${datos.ciudad || ''}</p>
    ${datos.telefono ? `<p style="font-size:1.1rem;margin:8px 0;">📞 ${datos.telefono}</p>` : ''}
    ${datos.email ? `<p style="font-size:1.1rem;margin:8px 0;">✉️ ${datos.email}</p>` : ''}
    ${datos.horario ? `<p style="color:#aaa;font-size:0.9rem;margin-top:16px;">${datos.horario}</p>` : ''}
  </section>
  <footer>© ${new Date().getFullYear()} ${datos.nombreEmpresa || 'Tu Empresa'}. Generado con WeblyNow.</footer>
</body>
</html>`
  return { html, tokensUsados: 0, modeloUsado: 'mock-dev' }
}

export async function generarSitio(datos: DatosWizard): Promise<ResultadoGeneracion> {
  // En desarrollo sin API key real, devolver mock
  const apiKey = process.env.ANTHROPIC_API_KEY || ''
  if (process.env.NODE_ENV === 'development' && (!apiKey || apiKey.includes('xxxx'))) {
    console.log('⚡ [DEV] Usando HTML mock (sin ANTHROPIC_API_KEY real)')
    return generarHTMLMock(datos)
  }

  const { systemPrompt, modelo, maxTokens, apiKey: resolvedKey } = await getGeneratorConfig(datos.plan)
  const userPrompt = construirPromptUsuario(datos)
  const client = new Anthropic({ apiKey: resolvedKey })

  const response = await client.messages.create({
    model: modelo,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const html = response.content
    .filter(block => block.type === 'text')
    .map(block => (block as any).text)
    .join('')

  return {
    html: extraerHTML(html),
    tokensUsados: response.usage.input_tokens + response.usage.output_tokens,
    modeloUsado: modelo,
  }
}

// ─── Generación con streaming (para mostrar progreso al usuario) ──────────────

export async function* generarSitioStream(datos: DatosWizard): AsyncGenerator<string> {
  const { systemPrompt, modelo, maxTokens, apiKey } = await getGeneratorConfig(datos.plan)
  const userPrompt = construirPromptUsuario(datos)
  const client = new Anthropic({ apiKey })

  const stream = await client.messages.stream({
    model: modelo,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  for await (const chunk of stream) {
    if (
      chunk.type === 'content_block_delta' &&
      chunk.delta.type === 'text_delta'
    ) {
      yield chunk.delta.text
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extraerHTML(texto: string): string {
  // Si Claude envuelve el HTML en markdown code blocks
  const matchCode = texto.match(/```html\n?([\s\S]*?)```/)
  if (matchCode) return matchCode[1].trim()

  // Si contiene DOCTYPE directamente
  const matchDoctype = texto.match(/(<!DOCTYPE[\s\S]*)/i)
  if (matchDoctype) return matchDoctype[1].trim()

  // Si contiene <html>
  const matchHtml = texto.match(/(<html[\s\S]*<\/html>)/i)
  if (matchHtml) return matchHtml[1].trim()

  return texto.trim()
}
