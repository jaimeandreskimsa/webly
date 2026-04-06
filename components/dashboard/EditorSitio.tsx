'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles, Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Sitio } from '@/lib/db/schema'
import type { DatosWizard } from '@/components/wizard/WizardCreacion'
import { StepNegocio } from '@/components/wizard/steps/StepNegocio'
import { StepServicios } from '@/components/wizard/steps/StepServicios'
import { StepDiseno } from '@/components/wizard/steps/StepDiseno'
import { StepContacto } from '@/components/wizard/steps/StepContacto'

const tabs = [
  { id: 'negocio', label: 'Negocio' },
  { id: 'servicios', label: 'Servicios' },
  { id: 'diseno', label: 'Diseño' },
  { id: 'contacto', label: 'Contacto' },
]

interface EditorSitioProps {
  sitio: Sitio
  edicionesUsadas: number
  limiteEdiciones: number
}

export function EditorSitio({ sitio, edicionesUsadas, limiteEdiciones }: EditorSitioProps) {
  const router = useRouter()
  const [tabActiva, setTabActiva] = useState('negocio')
  const [datos, setDatos] = useState<DatosWizard>(
    (sitio.contenidoJson as unknown as DatosWizard) ?? ({} as DatosWizard)
  )
  const [guardando, setGuardando] = useState(false)
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  function actualizarDatos(nuevos: Partial<DatosWizard>) {
    setDatos(prev => ({ ...prev, ...nuevos }))
  }

  async function guardarYRegenerar() {
    setGuardando(true)
    setError('')

    try {
      // 1. Guardar el contenido actualizado
      const resSave = await fetch(`/api/sitios/${sitio.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenidoJson: datos }),
      })

      if (!resSave.ok) throw new Error('Error guardando cambios')

      setGuardando(false)
      setGenerando(true)

      // 2. Regenerar el sitio con Claude
      const resGen = await fetch('/api/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sitioId: sitio.id }),
      })

      if (!resGen.ok) {
        const data = await resGen.json()
        throw new Error(data.error || 'Error al generar')
      }

      setExito(true)
      setTimeout(() => {
        router.push(`/dashboard/sitios/${sitio.id}`)
        router.refresh()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Error inesperado')
    } finally {
      setGuardando(false)
      setGenerando(false)
    }
  }

  const isLoading = guardando || generando

  return (
    <div className="space-y-6">
      {/* Ediciones counter */}
      {limiteEdiciones > 0 && (
        <div className="glass rounded-xl border border-white/5 p-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Ediciones este mes: {edicionesUsadas}/{limiteEdiciones}
          </span>
          <div className="flex-1 max-w-32 mx-4 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${(edicionesUsadas / limiteEdiciones) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 glass rounded-xl p-1 border border-white/5">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setTabActiva(tab.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              tabActiva === tab.id
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="glass rounded-2xl border border-white/5 p-8">
        {tabActiva === 'negocio' && (
          <StepNegocio datos={datos} onChange={actualizarDatos} />
        )}
        {tabActiva === 'servicios' && (
          <StepServicios datos={datos} onChange={actualizarDatos} />
        )}
        {tabActiva === 'diseno' && (
          <StepDiseno datos={datos} onChange={actualizarDatos} />
        )}
        {tabActiva === 'contacto' && (
          <StepContacto datos={datos} onChange={actualizarDatos} />
        )}
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
          ¡Sitio actualizado exitosamente! Redirigiendo...
        </div>
      )}

      {/* Generating state */}
      {generando && (
        <div className="glass rounded-xl border border-indigo-500/30 p-4 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
          <div>
            <p className="font-medium text-sm">Claude está regenerando tu sitio...</p>
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
          onClick={guardarYRegenerar}
          disabled={isLoading}
          className="flex items-center gap-2 btn-gradient text-white font-semibold px-6 py-2.5 rounded-xl text-sm disabled:opacity-50 hover:scale-105 transition-transform"
        >
          {guardando ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
          ) : generando ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generando con IA...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Guardar y regenerar</>
          )}
        </button>
      </div>
    </div>
  )
}
