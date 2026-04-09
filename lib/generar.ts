/**
 * lib/generar.ts
 * Generación de sitios en background con reintentos automáticos y watchdog.
 *
 * Garantías:
 *  1. Retry automático hasta 3 veces ante fallo de Claude (backoff 15s / 30s)
 *  2. Validación mínima del HTML — si Claude devuelve < 5 KB, reintenta
 *  3. Watchdog cada 5 min: reactiva sitios atascados en 'generando' sin proceso activo
 *  4. Guard anti-doble-ejecución por sitioId
 */

import { db, sitios, versionesSitio, usuarios } from '@/lib/db'
import { eq, max, lt, and } from 'drizzle-orm'
import { enviarEmailAdminSitioCreado, enviarEmailSitioListo } from '@/lib/email'
import type { DatosWizard } from '@/components/wizard/WizardCreacion'

const MAX_REINTENTOS    = 3
const BACKOFF_BASE_MS   = 15_000  // 15 s → 30 s entre reintentos
const HTML_MINIMO_CHARS = 5_000   // HTML < 5 KB = respuesta truncada de Claude

export type GenStatus = {
  status: 'running' | 'done' | 'error'
  error?: string
  version?: number
  plan?: string
  chunks: string[]
  prompt?: string
  intentos: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controllers: Set<ReadableStreamDefaultController<any>>
}

/** Map en memoria: sitioId → estado de generación activo */
export const genStore = new Map<string, GenStatus>()

export const encoder = new TextEncoder()

export function sseEncode(obj: unknown): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(obj)}\n\n`)
}

/**
 * Genera el sitio en background con reintentos automáticos.
 * Fire-and-forget: no hacer await en el caller.
 *
 * ⚠️  genStore.set() ocurre ANTES del primer await (síncrono) para que el
 *     SSE GET handler pueda suscribirse sin race condition.
 */
export async function generarEnBackground(sitioId: string, datos: DatosWizard): Promise<void> {
  // Guard: evitar doble ejecución paralela para el mismo sitio
  const existing = genStore.get(sitioId)
  if (existing?.status === 'running') {
    console.log(`[generar] Sitio ${sitioId} ya en ejecución — ignorando`)
    return
  }

  const entry: GenStatus = {
    status: 'running',
    plan: datos.plan ?? 'pro',
    chunks: [],
    prompt: '',
    intentos: 0,
    controllers: new Set(),
  }
  genStore.set(sitioId, entry) // ← síncrono, antes de cualquier await

  const { generarSitioStreamConMetadata } = await import('@/lib/claude/generator')
  const { construirPromptUsuario } = await import('@/lib/claude/prompts')

  entry.prompt = construirPromptUsuario(datos)
  let ultimoError = 'Error desconocido'

  for (let intento = 1; intento <= MAX_REINTENTOS; intento++) {
    entry.intentos = intento

    if (intento > 1) {
      // Limpiar chunks del intento anterior para no mostrar HTML corrupto
      entry.chunks = []
      const delay = BACKOFF_BASE_MS * Math.pow(2, intento - 2) // 15 s, 30 s
      console.log(`[generar] ⏳ Reintento ${intento}/${MAX_REINTENTOS} para ${sitioId} en ${delay / 1000}s...`)
      for (const ctrl of [...entry.controllers]) {
        try { ctrl.enqueue(sseEncode({ reintento: intento, max: MAX_REINTENTOS })) } catch {}
      }
      await new Promise(r => setTimeout(r, delay))
    }

    try {
      await db.update(sitios)
        .set({ estado: 'generando', updatedAt: new Date() })
        .where(eq(sitios.id, sitioId))

      const resultado = await generarSitioStreamConMetadata(datos, (chunk) => {
        entry.chunks.push(chunk)
        for (const ctrl of [...entry.controllers]) {
          try { ctrl.enqueue(sseEncode({ chunk })) } catch { entry.controllers.delete(ctrl) }
        }
      })

      // ── Validar que Claude devolvió HTML real ──────────────────────────────
      if (!resultado.html || resultado.html.length < HTML_MINIMO_CHARS) {
        throw new Error(
          `Claude devolvió HTML incompleto (${resultado.html?.length ?? 0} chars). ` +
          `Se esperaban al menos ${HTML_MINIMO_CHARS} chars.`
        )
      }

      // ── Guardar en DB ──────────────────────────────────────────────────────
      const [{ maxVersion }] = await db
        .select({ maxVersion: max(versionesSitio.numeroVersion) })
        .from(versionesSitio)
        .where(eq(versionesSitio.sitioId, sitioId))

      const nuevaVersion = (maxVersion ?? 0) + 1

      await db.update(versionesSitio).set({ esActual: false }).where(eq(versionesSitio.sitioId, sitioId))
      await db.insert(versionesSitio).values({
        sitioId,
        numeroVersion: nuevaVersion,
        htmlCompleto: resultado.html,
        esActual: true,
        modeloUsado: resultado.modeloUsado,
        tokensUsados: resultado.tokensUsados,
      })
      await db.update(sitios).set({
        estado: 'borrador',
        totalEdiciones: nuevaVersion,
        ultimaEdicion: new Date(),
        updatedAt: new Date(),
      }).where(eq(sitios.id, sitioId))

      entry.status = 'done'
      entry.version = nuevaVersion
      for (const ctrl of [...entry.controllers]) {
        try { ctrl.enqueue(sseEncode({ done: true, version: nuevaVersion })) } catch {}
      }
      entry.controllers.clear()

      console.log(`[generar] ✅ Sitio ${sitioId} generado (intento ${intento}/${MAX_REINTENTOS}, ${resultado.tokensUsados} tokens)`)

      // ── Emails fire-and-forget ─────────────────────────────────────────────
      ;(async () => {
        try {
          const [sitioActual] = await db
            .select({ nombre: sitios.nombre, plan: sitios.plan, userId: sitios.userId })
            .from(sitios).where(eq(sitios.id, sitioId)).limit(1)
          const [usuario] = await db
            .select({ nombre: usuarios.nombre, email: usuarios.email })
            .from(usuarios).where(eq(usuarios.id, sitioActual.userId)).limit(1)
          if (sitioActual && usuario) {
            await Promise.allSettled([
              enviarEmailAdminSitioCreado({
                sitioId,
                sitioNombre: sitioActual.nombre,
                plan: sitioActual.plan,
                usuarioNombre: usuario.nombre,
                usuarioEmail: usuario.email,
                tokensUsados: resultado.tokensUsados,
              }),
              enviarEmailSitioListo(usuario.email, usuario.nombre, sitioActual.nombre, sitioId),
            ])
          }
        } catch (emailErr) {
          console.error('[generar] Error emails:', emailErr)
        }
      })()

      setTimeout(() => genStore.delete(sitioId), 10 * 60 * 1000)
      return // ✅ éxito — salir del loop

    } catch (err) {
      ultimoError = err instanceof Error ? err.message : 'Error desconocido'
      console.error(`[generar] ❌ Intento ${intento}/${MAX_REINTENTOS} fallido para ${sitioId}:`, ultimoError)
    }
  }

  // ── Todos los reintentos agotados ──────────────────────────────────────────
  console.error(`[generar] 💀 Sitio ${sitioId} falló ${MAX_REINTENTOS} veces. Error: ${ultimoError}`)

  try {
    await db.update(sitios)
      .set({ estado: 'error', updatedAt: new Date() })
      .where(eq(sitios.id, sitioId))
  } catch {}

  entry.status = 'error'
  entry.error = ultimoError
  for (const ctrl of [...entry.controllers]) {
    try { ctrl.enqueue(sseEncode({ error: ultimoError })) } catch {}
  }
  entry.controllers.clear()
  setTimeout(() => genStore.delete(sitioId), 10 * 60 * 1000)
}

// ─── Watchdog: reactivar sitios atascados ─────────────────────────────────────
// Corre cada 5 min en el proceso Node.js de Railway.
// Busca sitios en 'generando' que llevan > 3 min sin avanzar (proceso perdido)
// y los reactiva automáticamente.

async function runWatchdog() {
  try {
    const umbral = new Date(Date.now() - 3 * 60 * 1000) // > 3 min sin cambio
    const atascados = await db
      .select()
      .from(sitios)
      .where(and(eq(sitios.estado, 'generando'), lt(sitios.updatedAt, umbral)))

    for (const sitio of atascados) {
      const entry = genStore.get(sitio.id)
      if (entry?.status === 'running') continue // ya está corriendo en memoria

      const datos = sitio.contenidoJson as unknown as DatosWizard
      if (!datos?.plan || !datos?.nombreEmpresa) continue

      console.log(`[watchdog] 🔄 Reactivando sitio atascado: ${sitio.id} (${sitio.nombre})`)
      generarEnBackground(sitio.id, datos) // fire-and-forget
    }
  } catch (e) {
    console.error('[watchdog] Error:', e)
  }
}

// Auto-start una sola vez por proceso Node.js (guard con globalThis)
const g = global as Record<string, unknown>
if (!g.__webtoryWatchdog) {
  g.__webtoryWatchdog = true
  // Esperar 30s antes del primer check para dar tiempo al proceso de arrancar
  setTimeout(() => {
    runWatchdog()
    setInterval(runWatchdog, 5 * 60 * 1000)
    console.log('[watchdog] ✅ Iniciado (cada 5 min)')
  }, 30_000)
}
