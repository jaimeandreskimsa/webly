'use client'

import { useState } from 'react'
import { Plus, Trash2, X, UtensilsCrossed, DollarSign, Upload, Loader2, Star, ChevronDown, ChevronUp } from 'lucide-react'
import type { DatosWizard } from '../WizardCreacion'
import { cn } from '@/lib/utils'

export interface PlatoWizard {
  nombre: string
  descripcion: string
  precio: string
  categoria: string
  imagen: string
  disponible: boolean
  destacado: boolean
}

interface Props {
  datos: DatosWizard
  onChange: (d: Partial<DatosWizard>) => void
}

const CATEGORIAS = [
  { value: 'entrada',   label: 'Entrada' },
  { value: 'principal', label: 'Plato de fondo' },
  { value: 'postre',    label: 'Postre' },
  { value: 'bebida',    label: 'Bebida' },
  { value: 'otro',      label: 'Otro' },
]

const platoVacio = (): PlatoWizard => ({
  nombre: '',
  descripcion: '',
  precio: '',
  categoria: 'principal',
  imagen: '',
  disponible: true,
  destacado: false,
})

export function StepCarta({ datos, onChange }: Props) {
  const platos: PlatoWizard[] = (datos as any).platosIniciales || []
  const [expandido, setExpandido] = useState<number | null>(0)
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)

  function setPlatos(lista: PlatoWizard[]) {
    onChange({ platosIniciales: lista } as any)
  }

  function agregar() {
    const nuevo = platoVacio()
    const nuevaLista = [...platos, nuevo]
    setPlatos(nuevaLista)
    setExpandido(nuevaLista.length - 1)
  }

  function eliminar(idx: number) {
    const nueva = platos.filter((_, i) => i !== idx)
    setPlatos(nueva)
    setExpandido(nueva.length > 0 ? Math.min(idx, nueva.length - 1) : null)
  }

  function actualizar(idx: number, campo: Partial<PlatoWizard>) {
    const nueva = platos.map((p, i) => i === idx ? { ...p, ...campo } : p)
    setPlatos(nueva)
  }

  async function subirImagen(idx: number, file: File) {
    setUploadingIdx(idx)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('tipo', 'platos')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) return
      const data = await res.json()
      actualizar(idx, { imagen: data.url })
    } finally {
      setUploadingIdx(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Info box */}
      <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 space-y-1.5">
        <p className="text-sm font-semibold text-orange-300">Platos iniciales de tu carta</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Agrega los platos que quieres mostrar al lanzar tu sitio. Es opcional — si no agregas ninguno, Claude generará ejemplos para que el menú no se vea vacío.
        </p>
        <div className="flex items-start gap-1.5 pt-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
          <p className="text-xs text-orange-400/80 leading-relaxed">
            <strong className="text-orange-300">Después de crear el sitio</strong> puedes agregar, editar y eliminar platos desde tu panel → <em>Mi Carta</em>, y publicar los cambios con un click.
          </p>
        </div>
      </div>

      {/* Lista de platos */}
      {platos.length === 0 ? (
        <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center">
          <UtensilsCrossed className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm text-muted-foreground mb-1">No hay platos aún</p>
          <p className="text-xs text-muted-foreground/60">Claude generará una carta de ejemplo para tu tipo de restaurante</p>
        </div>
      ) : (
        <div className="space-y-3">
          {platos.map((plato, idx) => (
            <div key={idx} className="glass rounded-xl border border-white/5 overflow-hidden">
              {/* Header del plato */}
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setExpandido(expandido === idx ? null : idx)}
              >
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium truncate',
                    plato.nombre ? 'text-white' : 'text-muted-foreground italic'
                  )}>
                    {plato.nombre || 'Plato sin nombre'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground capitalize">
                      {CATEGORIAS.find(c => c.value === plato.categoria)?.label || plato.categoria}
                    </span>
                    {plato.precio && (
                      <span className="text-xs text-orange-400 font-medium">
                        ${Number(plato.precio).toLocaleString('es-CL')}
                      </span>
                    )}
                    {plato.destacado && (
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); eliminar(idx) }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {expandido === idx
                    ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  }
                </div>
              </div>

              {/* Formulario expandido */}
              {expandido === idx && (
                <div className="border-t border-white/5 p-4 space-y-4">
                  {/* Nombre + Categoría */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Nombre *</label>
                      <input
                        type="text"
                        value={plato.nombre}
                        onChange={e => actualizar(idx, { nombre: e.target.value })}
                        placeholder="Ej: Pollo a la plancha"
                        autoFocus
                        className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 border border-white/10 bg-white/5"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Categoría</label>
                      <select
                        value={plato.categoria}
                        onChange={e => actualizar(idx, { categoria: e.target.value })}
                        className="w-full rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 border border-white/10 bg-slate-800"
                      >
                        {CATEGORIAS.map(c => (
                          <option key={c.value} value={c.value} className="bg-slate-800">
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Precio */}
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">
                      <DollarSign className="w-3 h-3 inline mr-0.5" />
                      Precio (CLP)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={plato.precio}
                      onChange={e => actualizar(idx, { precio: e.target.value })}
                      placeholder="Ej: 8900"
                      className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 border border-white/10 bg-white/5"
                    />
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Descripción</label>
                    <textarea
                      value={plato.descripcion}
                      onChange={e => actualizar(idx, { descripcion: e.target.value })}
                      rows={2}
                      placeholder="Ingredientes o descripción breve..."
                      className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 border border-white/10 bg-white/5 resize-none"
                    />
                  </div>

                  {/* Imagen + flags */}
                  <div className="flex gap-4 items-start">
                    {/* Imagen */}
                    <div className="flex-1">
                      <label className="block text-xs text-muted-foreground mb-1.5">Foto del plato</label>
                      {plato.imagen ? (
                        <div className="relative w-full h-24 rounded-lg overflow-hidden border border-white/10 group">
                          <img src={plato.imagen} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => actualizar(idx, { imagen: '' })}
                            className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <X className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      ) : (
                        <label className={cn(
                          'w-full h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer gap-1 transition-all',
                          uploadingIdx === idx
                            ? 'border-orange-500/50 cursor-wait'
                            : 'border-white/10 hover:border-orange-500/40 hover:bg-orange-500/5'
                        )}>
                          {uploadingIdx === idx
                            ? <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
                            : <>
                                <Upload className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Subir foto</span>
                              </>
                          }
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingIdx === idx}
                            onChange={e => { if (e.target.files?.[0]) subirImagen(idx, e.target.files[0]) }}
                          />
                        </label>
                      )}
                    </div>

                    {/* Flags */}
                    <div className="space-y-2 pt-5">
                      <label
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-xs',
                          plato.destacado
                            ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                            : 'border-white/10 text-muted-foreground hover:border-white/20'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={plato.destacado}
                          onChange={e => actualizar(idx, { destacado: e.target.checked })}
                          className="hidden"
                        />
                        <Star className={cn('w-3.5 h-3.5', plato.destacado ? 'fill-amber-400 text-amber-400' : '')} />
                        Destacado
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Botón agregar */}
      <button
        type="button"
        onClick={agregar}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-orange-500/30 text-orange-400 hover:bg-orange-500/5 hover:border-orange-500/50 transition-all text-sm font-medium"
      >
        <Plus className="w-4 h-4" />
        Agregar plato a la carta
      </button>

      {platos.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {platos.length} plato{platos.length !== 1 ? 's' : ''} en la carta inicial
        </p>
      )}
    </div>
  )
}
