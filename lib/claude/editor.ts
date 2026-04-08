import Anthropic from '@anthropic-ai/sdk'
import { getConfig, isValidSecret } from '@/lib/config'

export interface ResultadoEdicion {
  html: string
  tokensUsados: number
  modeloUsado: string
}

const MAX_TOKENS_EDICION = {
  basico: 16000,
  pro: 32000,
  premium: 64000,
  broker: 48000,
}

const SYSTEM_PROMPT_EDICION = `Eres un experto desarrollador web frontend. Tu trabajo es modificar sitios web existentes según las instrucciones del cliente.

## REGLAS ESTRICTAS

1. RECIBIRÁS el HTML completo actual del sitio y las instrucciones de cambio del cliente.
2. DEBES devolver el HTML COMPLETO modificado — no solo los fragmentos que cambiaron.
3. MANTÉN todo lo que no se pida cambiar: estructura, estilos, scripts, animaciones, CDNs.
4. Aplica TODOS los cambios solicitados de forma precisa.
5. Si el cliente pide agregar secciones nuevas, intégralas con el mismo estilo visual del sitio.
6. Si el cliente pide cambiar colores, actualiza las variables CSS (:root) y cualquier hardcoded.
7. Si el cliente pide cambiar textos, cámbialos exactamente como se indica.
8. Si el cliente pide cambiar imágenes, usa Unsplash con keywords relevantes.
9. NUNCA elimines funcionalidad que el cliente no pidió eliminar.
10. NUNCA cambies la estructura del router SPA ni el sistema de navegación a menos que se pida.
11. El resultado debe ser un archivo HTML completo y funcional que se abra directamente en el navegador.

## FORMATO DE RESPUESTA
Devuelve SOLO el HTML completo modificado. Sin explicaciones, sin markdown, sin code blocks.
Empieza directamente con <!DOCTYPE html> y termina con </html>.`

export async function editarSitio(
  htmlActual: string,
  instrucciones: string,
  plan: 'basico' | 'pro' | 'premium' | 'broker'
): Promise<ResultadoEdicion> {
  const [modeloDB, apiKeyDB] = await Promise.all([
    getConfig('modelo_claude', 'claude-sonnet-4-6'),
    getConfig('anthropic_api_key', ''),
  ])

  const modelo = modeloDB || 'claude-sonnet-4-6'
  const apiKey = isValidSecret(apiKeyDB) ? apiKeyDB : process.env.ANTHROPIC_API_KEY!
  const maxTokens = MAX_TOKENS_EDICION[plan]

  const client = new Anthropic({ apiKey })

  const userPrompt = `## HTML ACTUAL DEL SITIO
\`\`\`html
${htmlActual}
\`\`\`

## CAMBIOS SOLICITADOS POR EL CLIENTE
${instrucciones}

Aplica TODOS los cambios solicitados al HTML y devuelve el HTML COMPLETO modificado.`

  const response = await client.messages.create({
    model: modelo,
    max_tokens: maxTokens,
    system: SYSTEM_PROMPT_EDICION,
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

function extraerHTML(texto: string): string {
  const matchCode = texto.match(/```html\n?([\s\S]*?)```/)
  if (matchCode) return matchCode[1].trim()

  const matchDoctype = texto.match(/(<!DOCTYPE[\s\S]*)/i)
  if (matchDoctype) return matchDoctype[1].trim()

  const matchHtml = texto.match(/(<html[\s\S]*<\/html>)/i)
  if (matchHtml) return matchHtml[1].trim()

  return texto.trim()
}
