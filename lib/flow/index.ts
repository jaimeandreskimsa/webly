import crypto from 'crypto'
import { getConfig, isValidSecret } from '@/lib/config'
import { PLAN_PRECIOS, PLAN_NOMBRES } from '@/lib/utils'

// ─── Base URL ─────────────────────────────────────────────────────────────────
async function getFlowBaseUrl(): Promise<string> {
  const sandbox = await getConfig('flow_sandbox', process.env.FLOW_SANDBOX || 'false')
  return sandbox === 'true'
    ? 'https://sandbox.flow.cl/api'
    : 'https://www.flow.cl/api'
}

// ─── Credenciales ─────────────────────────────────────────────────────────────
export async function getFlowCredentials(): Promise<{ apiKey: string; secretKey: string }> {
  const [apiKeyDB, secretKeyDB] = await Promise.all([
    getConfig('flow_api_key', ''),
    getConfig('flow_secret_key', ''),
  ])
  return {
    apiKey: isValidSecret(apiKeyDB) ? apiKeyDB : (process.env.FLOW_API_KEY || ''),
    secretKey: isValidSecret(secretKeyDB) ? secretKeyDB : (process.env.FLOW_SECRET_KEY || ''),
  }
}

// ─── Firma HMAC-SHA256 ────────────────────────────────────────────────────────
// Flow requiere: ordenar params alfabéticamente, concatenar clave+valor, firmar con HMAC-SHA256
function sign(params: Record<string, string>, secretKey: string): string {
  const sorted = Object.keys(params).sort()
  const str = sorted.map(k => k + params[k]).join('')
  return crypto.createHmac('sha256', secretKey).update(str).digest('hex')
}

// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface CrearPagoFlowParams {
  apiKey: string
  secretKey: string
  commerceOrder: string   // ID único del comercio (nuestro ref)
  subject: string         // descripción del pago
  amount: number          // monto en CLP
  email: string           // email del pagador
  urlConfirmation: string // webhook donde Flow notifica el pago
  urlReturn: string       // URL a donde redirige al usuario después de pagar
  optional?: Record<string, string> // datos opcionales extra
}

export interface PagoFlowCreado {
  url: string       // URL base del formulario de pago Flow
  token: string     // token del pago — redirigir a url?token=TOKEN
  flowOrder: number // número de orden interno de Flow
}

export interface EstadoPagoFlow {
  flowOrder: number
  commerceOrder: string
  requestDate: string
  status: number    // 1=pagado 2=pendiente 3=rechazado 4=anulado
  subject: string
  currency: string
  amount: number
  payer: string
  optional?: Record<string, string>
  pendingInfo?: { media: string; date: string }
  paymentData?: Record<string, unknown>
  merchantId: string
}

// ─── Crear pago ───────────────────────────────────────────────────────────────
export async function crearPagoFlow(params: CrearPagoFlowParams): Promise<PagoFlowCreado> {
  const baseUrl = await getFlowBaseUrl()

  // Construir params sin la firma
  const body: Record<string, string> = {
    apiKey: params.apiKey,
    commerceOrder: params.commerceOrder,
    subject: params.subject,
    currency: 'CLP',
    amount: String(Math.round(params.amount)),
    email: params.email,
    urlConfirmation: params.urlConfirmation,
    urlReturn: params.urlReturn,
  }

  // Agregar campos opcionales si existen
  if (params.optional) {
    Object.assign(body, params.optional)
  }

  // Firmar y agregar la firma
  body.s = sign(body, params.secretKey)

  const res = await fetch(`${baseUrl}/payment/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
  })

  const text = await res.text()
  let data: any
  try { data = JSON.parse(text) } catch { throw new Error(`Flow respuesta inválida: ${text}`) }

  if (!res.ok || data.code) {
    throw new Error(`Flow error ${data.code || res.status}: ${data.message || text}`)
  }

  return data as PagoFlowCreado
}

// ─── Obtener estado del pago ──────────────────────────────────────────────────
export async function obtenerEstadoPago(params: {
  apiKey: string
  secretKey: string
  token: string
}): Promise<EstadoPagoFlow> {
  const baseUrl = await getFlowBaseUrl()

  const query: Record<string, string> = {
    apiKey: params.apiKey,
    token: params.token,
  }
  query.s = sign(query, params.secretKey)

  const qs = new URLSearchParams(query).toString()
  const res = await fetch(`${baseUrl}/payment/getStatus?${qs}`)

  const text = await res.text()
  let data: any
  try { data = JSON.parse(text) } catch { throw new Error(`Flow respuesta inválida: ${text}`) }

  if (!res.ok || data.code) {
    throw new Error(`Flow error ${data.code || res.status}: ${data.message || text}`)
  }

  return data as EstadoPagoFlow
}

// ─── Helper: generar parámetros de pago para un plan ─────────────────────────
export interface PlanPagoParams {
  plan: 'basico' | 'pro' | 'premium' | 'broker'
  sitioId: string
  userId: string
  nombreEmpresa: string
  email: string
  tipo?: 'nuevo_sitio' | 'cambiar_plan'
}

export async function crearPagoPlan(params: PlanPagoParams): Promise<{ checkoutUrl: string; flowToken: string }> {
  const { apiKey, secretKey } = await getFlowCredentials()

  if (!apiKey || !secretKey) {
    throw new Error('Flow no configurado. Agrega FLOW_API_KEY y FLOW_SECRET_KEY en el panel de administración.')
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const monto = PLAN_PRECIOS[params.plan]
  const planNombre = PLAN_NOMBRES[params.plan]

  const urlReturn = params.tipo === 'cambiar_plan'
    ? `${appUrl}/dashboard/sitios/${params.sitioId}?plan_cambiado=1`
    : `${appUrl}/dashboard/sitios/${params.sitioId}/generando`

  const result = await crearPagoFlow({
    apiKey,
    secretKey,
    commerceOrder: `${params.sitioId}|${params.userId}|${params.plan}|${params.tipo || 'nuevo_sitio'}`,
    subject: `Webtory — Plan ${planNombre} para ${params.nombreEmpresa}`,
    amount: monto,
    email: params.email,
    urlConfirmation: `${appUrl}/api/pagos/webhook`,
    urlReturn,
  })

  return {
    checkoutUrl: `${result.url}?token=${result.token}`,
    flowToken: result.token,
  }
}
