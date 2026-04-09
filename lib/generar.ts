/**
 * lib/generar.ts
 * Lógica compartida de generación en background con SSE.
 * Importado tanto por app/api/generar/route.ts (SSE streaming)
 * como por app/api/admin/sitios/route.ts (trigger desde admin).
 */

import { db, sitios, versionesSitio, usuarios } from '@/lib/db'
import { eq, max } from 'drizzle-orm'
import { enviarEmailAdminSitioCreado, enviarEmailSitioListo } from '@/lib/email'
import type { DatosWizard } from '@/components/wizard/WizardCreacion'

export type GenStatus = {
  status: 'running' | 'done' | 'error'
  error?: string
  version?: number
  plan?: string
  chunks: string[]
  prompt?: string
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
 * Genera el sitio en background (fire-and-forget).
 * ⚠️ genStore.set() ocurre ANTES del primer await, sincrónicamente.
 * Así el SSE GET handler puede suscribirse inmediatamente sin race condition.
 */
export async function generarEnBackground(sitioId: string, datos: DatosWizard): Promise<void> {
  const entry: GenStatus = {
    status: 'running',
    plan: datos.plan ?? 'pro',
    chunks: [],
    prompt: '',
    controllers: new Set(),
  }
  genStore.set(sitioId, entry) // ← síncrono, antes de cualquier await

  const { generarSitioStreamConMetadata } = await import('@/lib/claude/generator')
  const { construirPromptUsuario } = await import('@/lib/claude/prompts')

  try {
    await db.update(sitios)
      .set({ estado: 'generando', updatedAt: new Date() })
      .where(eq(sitios.id, sitioId))

    entry.prompt = construirPromptUsuario(datos)

    const resultado = await generarSitioStreamConMetadata(datos, (chunk) => {
      entry.chunks.push(chunk)
      for (const ctrl of [...entry.controllers]) {
        try {
          ctrl.enqueue(sseEncode({ chunk }))
        } catch {
          entry.controllers.delete(ctrl)
        }
      }
    })

    const [{ maxVersion }] = await db
      .select({ maxVersion: max(versionesSitio.numeroVersion) })
      .from(versionesSitio)
      .where(eq(versionesSitio.sitioId, sitioId))

    const nuevaVersion = (maxVersion ?? 0) + 1

    await db.update(versionesSitio)
      .set({ esActual: false })
      .where(eq(versionesSitio.sitioId, sitioId))

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

    // Emails fire-and-forget
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
        console.error('[generarEnBackground] Error emails:', emailErr)
      }
    })()

    setTimeout(() => genStore.delete(sitioId), 10 * 60 * 1000)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[generarEnBackground] Error:', msg, err)
    try {
      await db.update(sitios)
        .set({ estado: 'error', updatedAt: new Date() })
        .where(eq(sitios.id, sitioId))
    } catch {}
    entry.status = 'error'
    entry.error = msg
    for (const ctrl of [...entry.controllers]) {
      try { ctrl.enqueue(sseEncode({ error: msg })) } catch {}
    }
    entry.controllers.clear()
    setTimeout(() => genStore.delete(sitioId), 10 * 60 * 1000)
  }
}
