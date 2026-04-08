'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles, ArrowLeft, MessageSquare, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import type { Sitio } from '@/lib/db/schema'

interface EditorSitioProps {
  sitio: Sitio
  edicionesUsadas: number
  limiteEdiciones: number
}

export function EditorSitio({ sitio, edicionesUsadas, limiteEdiciones }: EditorSitioProps) {
  const router = useRouter()
  const [instrucciones, setInstrucciones] = useState('')
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  const restantes = limiteEdiciones - edicionesUsadas

  async function aplicarCambios() {
    if (!instrucciones.trim()) {
      setError('Escribe los cambios que deseas realizar')
      return
    }

    setGenerando(true)
    setError('')

    try {
      const res = await fetch('/api/generar/editar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sitioId: sitio.id,
          instrucciones: instrucciones.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al aplicar cambios')
      }

      setExito(true)
      setTimeout(() => {
        router.push(`/dashboard/sitios/${sitio.id}`)
        router.refresh()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Error inesperado')
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Ediciones counter */}
      <div className="glass rounded-xl border border-white/5 p-4 flex items-center justify-between">
        <div>
          <span className="text-sm font-medium">
            Ediciones disponibles: <span className="text-indigo-400">{restantes}</span> de {limiteEdiciones}
          </span>
          <p className="text-xs text-muted-foreground mt-0.5">
            {restantes === 1 ? 'Te queda 1 edición' : `Te quedan ${restantes} ediciones`}
            {restantes <= 1 && ' — luego necesitarás un plan de ediciones'}
          </p>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: limiteEdiciones }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i < edicionesUsadas
                  ? 'bg-indigo-500'
                  : 'bg-white/10 border border-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Instrucciones */}
      <div className="glass rounded-2xl border border-white/5 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="font-bold text-base">¿Qué quieres cambiar?</h2>
            <p className="text-xs text-muted-foreground">
              Describe los cambios y nuestro agente IA los aplicará a tu sitio
            </p>
          </div>
        </div>

        <textarea
          value={instrucciones}
          onChange={e => setInstrucciones(e.target.value)}
          placeholder="Ejemplo: Cambia el color principal a azul oscuro, agrega un nuevo servicio llamado 'Consultoría digital' con precio $50.000, cambia la foto del hero por algo más moderno, agranda el botón de WhatsApp..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 min-h-[180px] resize-y leading-relaxed"
          disabled={generando}
        />

        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-white/3 rounded-lg px-3 py-2.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400/70" />
          <p>
            Puedes pedir cambios de colores, textos, imágenes, estructura, agregar o quitar secciones, cambiar fuentes, y más.
            Sé lo más específico posible para mejores resultados.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Success */}
      {exito && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          ¡Cambios aplicados exitosamente! Redirigiendo...
        </div>
      )}

      {/* Generating state */}
      {generando && (
        <div className="glass rounded-xl border border-indigo-500/30 p-4 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
          <div>
            <p className="font-medium text-sm">Aplicando tus cambios con IA...</p>
            <p className="text-xs text-muted-foreground">Esto puede tomar 30-90 segundos</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Link
          href={`/dashboard/sitios/${sitio.id}`}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass glass-hover text-sm text-muted-foreground hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Cancelar
        </Link>

        <button
          onClick={aplicarCambios}
          disabled={generando || !instrucciones.trim()}
          className="flex items-center gap-2 btn-gradient text-white font-semibold px-6 py-2.5 rounded-xl text-sm disabled:opacity-50 hover:scale-105 transition-transform"
        >
          {generando ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Aplicando cambios...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Aplicar cambios ({restantes} restantes)</>
          )}
        </button>
      </div>
    </div>
  )
}
