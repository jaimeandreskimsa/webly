import { NextRequest, NextResponse } from 'next/server'
import { db, pagos, sitios, usuarios } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { obtenerEstadoPago, getFlowCredentials } from '@/lib/flow'

// Flow.cl envía un POST con el token cuando el pago es procesado
// Documentación: https://developers.flow.cl/api#payment/getStatus
// Status: 1=pagado 2=pendiente 3=rechazado 4=anulado

export async function POST(req: NextRequest) {
  try {
    // Flow envía el token como form-data
    let token: string | null = null

    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await req.text()
      const params = new URLSearchParams(text)
      token = params.get('token')
    } else {
      // Intentar como JSON (por compatibilidad)
      try {
        const body = await req.json()
        token = body.token
      } catch {
        const text = await req.text()
        const params = new URLSearchParams(text)
        token = params.get('token')
      }
    }

    if (!token) {
      console.error('[webhook-flow] Token no recibido')
      return NextResponse.json({ error: 'Token requerido' }, { status: 400 })
    }

    // Obtener credenciales Flow
    const { apiKey, secretKey } = await getFlowCredentials()
    if (!apiKey || !secretKey) {
      console.error('[webhook-flow] Flow no configurado')
      return NextResponse.json({ error: 'Flow no configurado' }, { status: 500 })
    }

    // Consultar estado del pago en Flow
    const estadoPago = await obtenerEstadoPago({ apiKey, secretKey, token })

    // Solo procesar pagos aprobados (status 1)
    if (estadoPago.status !== 1) {
      console.log(`[webhook-flow] Pago ${token} con estado ${estadoPago.status} — ignorado`)
      return NextResponse.json({ ok: true })
    }

    // Buscar el registro de pago pendiente por flowToken
    const [pagoRegistrado] = await db
      .select()
      .from(pagos)
      .where(eq(pagos.flowToken, token))
      .limit(1)

    if (!pagoRegistrado) {
      console.error(`[webhook-flow] No se encontró registro de pago para token ${token}`)
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
    }

    // Verificar que no se procesó ya
    if (pagoRegistrado.estado === 'aprobado') {
      console.log(`[webhook-flow] Pago ${token} ya fue procesado — idempotente`)
      return NextResponse.json({ ok: true })
    }

    // Parsear la referencia: "{sitioId}|{userId}|{plan}|{tipo}"
    // IMPORTANTE: usar flowOrder del DB (contiene pipes), NO commerceOrder de Flow.
    // commerceOrder es la forma compacta sin pipes (límite 45 chars de Flow),
    // por lo que estadoPago.commerceOrder NO se puede parsear con split('|').
    const referencia = pagoRegistrado.flowOrder || ''
    const partes = referencia.split('|')
    const [sitioId, userId, plan, tipo] = partes

    if (!sitioId || !userId || !plan) {
      console.error(`[webhook-flow] Referencia inválida: ${referencia}`)
      return NextResponse.json({ error: 'Referencia inválida' }, { status: 400 })
    }

    // Marcar pago como aprobado
    await db
      .update(pagos)
      .set({ estado: 'aprobado', updatedAt: new Date() })
      .where(eq(pagos.flowToken, token))

    // Actualizar plan del usuario
    await db
      .update(usuarios)
      .set({ plan: plan as any, updatedAt: new Date() })
      .where(eq(usuarios.id, userId))

    // Actualizar plan del sitio
    await db
      .update(sitios)
      .set({ plan: plan as any, updatedAt: new Date() })
      .where(eq(sitios.id, sitioId))

    // Si es cambio de plan, el usuario regenera desde el editor
    if (tipo === 'cambiar_plan') {
      console.log(`[webhook-flow] Cambio de plan aprobado: sitio ${sitioId} → ${plan}`)
      return NextResponse.json({ ok: true })
    }

    // Express nuevo ('en'): el usuario todavía no llenó el wizard — NO generar aún
    // El usuario será redirigido a /dashboard/sitios/{id}/configurar para llenar los datos
    if (tipo === 'en') {
      await db
        .update(sitios)
        .set({ estado: 'borrador', updatedAt: new Date() })
        .where(eq(sitios.id, sitioId))
      console.log(`[webhook-flow] Pago express aprobado: sitio ${sitioId} — pendiente de configuración`)
      return NextResponse.json({ ok: true })
    }

    // Nuevo sitio: marcar como 'generando' — el frontend abrirá SSE a GET /api/generar
    // que detectará el estado y arrancará la generación con Claude en background.
    await db
      .update(sitios)
      .set({ estado: 'generando', updatedAt: new Date() })
      .where(eq(sitios.id, sitioId))

    console.log(`[webhook-flow] Pago aprobado, sitio ${sitioId} listo para generar`)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[webhook-flow] Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
