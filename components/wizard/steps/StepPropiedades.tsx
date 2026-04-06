'use client'

import { useState } from 'react'
import { Plus, Trash2, X, Home, DollarSign, Maximize2, Bath, Car, MapPin, Upload, Loader2, Star, ChevronDown, ChevronUp } from 'lucide-react'
import type { DatosWizard } from '../WizardCreacion'
import { cn } from '@/lib/utils'

export interface PropiedadWizard {
  titulo: string
  descripcion: string
  precio: string
  moneda: 'CLP' | 'UF'
  tipo: 'venta' | 'arriendo'
  tipoPropiedad: string
  superficie: string
  habitaciones: string
  banos: string
  estacionamientos: string
  ubicacion: string
  ciudad: string
  imagenes: string[]
  destacada: boolean
}

interface Props {
  datos: DatosWizard
  onChange: (d: Partial<DatosWizard>) => void
}

const propiedadVacia = (): PropiedadWizard => ({
  titulo: '',
  descripcion: '',
  precio: '',
  moneda: 'UF',
  tipo: 'venta',
  tipoPropiedad: 'departamento',
  superficie: '',
  habitaciones: '',
  banos: '',
  estacionamientos: '',
  ubicacion: '',
  ciudad: '',
  imagenes: [],
  destacada: false,
})

const TIPOS_PROPIEDAD = [
  { value: 'casa', label: 'Casa' },
  { value: 'departamento', label: 'Departamento' },
  { value: 'oficina', label: 'Oficina' },
  { value: 'local', label: 'Local comercial' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'bodega', label: 'Bodega' },
  { value: 'parcela', label: 'Parcela' },
]

export function StepPropiedades({ datos, onChange }: Props) {
  const propiedades: PropiedadWizard[] = (datos as any).propiedadesIniciales || []
  const [expandida, setExpandida] = useState<number | null>(0)
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)

  function setPropiedades(lista: PropiedadWizard[]) {
    onChange({ propiedadesIniciales: lista } as any)
  }

  function agregar() {
    const nueva = propiedadVacia()
    nueva.ciudad = datos.ciudad || ''
    const nuevaLista = [...propiedades, nueva]
    setPropiedades(nuevaLista)
    setExpandida(nuevaLista.length - 1)
  }

  function eliminar(idx: number) {
    const nueva = propiedades.filter((_, i) => i !== idx)
    setPropiedades(nueva)
    setExpandida(nueva.length > 0 ? Math.min(idx, nueva.length - 1) : null)
  }

  function actualizar(idx: number, campo: Partial<PropiedadWizard>) {
    const nueva = propiedades.map((p, i) => i === idx ? { ...p, ...campo } : p)
    setPropiedades(nueva)
  }

  async function subirImagen(idx: number, file: File) {
    setUploadingIdx(idx)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('tipo', 'propiedad')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) return
      const data = await res.json()
      const imgs = [...(propiedades[idx].imagenes || []), data.url]
      actualizar(idx, { imagenes: imgs })
    } finally {
      setUploadingIdx(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Encabezado explicativo */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 space-y-1.5">
        <p className="text-sm font-semibold text-emerald-300">Propiedades iniciales del portal</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Agrega las primeras propiedades que quieres mostrar al lanzar tu portal. Es opcional — si no agregas ninguna, Claude generará ejemplos para que el sitio no se vea vacío.
        </p>
        <div className="flex items-start gap-1.5 pt-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
          <p className="text-xs text-emerald-400/80 leading-relaxed">
            <strong className="text-emerald-300">Después de crear el sitio</strong> puedes agregar, editar y eliminar propiedades desde tu panel de administración → <em>Mis Propiedades</em>, y publicar los cambios con un click.
          </p>
        </div>
      </div>

      {/* Lista de propiedades */}
      {propiedades.length === 0 ? (
        <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center">
          <Home className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm text-muted-foreground mb-1">Sin propiedades aún</p>
          <p className="text-xs text-muted-foreground opacity-60">El sitio usará propiedades de ejemplo hasta que agregues las tuyas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {propiedades.map((prop, idx) => (
            <div key={idx} className={cn(
              'border rounded-xl overflow-hidden transition-all',
              expandida === idx ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10 bg-white/3'
            )}>
              {/* Header de la propiedad */}
              <div
                className="flex items-center gap-3 p-3 cursor-pointer"
                onClick={() => setExpandida(expandida === idx ? null : idx)}
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Home className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{prop.titulo || `Propiedad ${idx + 1}`}</p>
                  <p className="text-xs text-muted-foreground">
                    {prop.tipoPropiedad} · {prop.tipo} {prop.precio ? `· ${prop.moneda === 'UF' ? 'UF ' : '$ '}${prop.precio}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {prop.destacada && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); eliminar(idx) }}
                    className="text-muted-foreground hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {expandida === idx ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Formulario expandido */}
              {expandida === idx && (
                <div className="border-t border-white/10 p-4 space-y-4">
                  {/* Título */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Título *</label>
                    <input
                      type="text"
                      value={prop.titulo}
                      onChange={e => actualizar(idx, { titulo: e.target.value })}
                      placeholder="Ej: Departamento 2D/2B en Providencia"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/50 transition-all"
                    />
                  </div>

                  {/* Tipo propiedad + Operación */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Tipo de propiedad</label>
                      <select
                        value={prop.tipoPropiedad}
                        onChange={e => actualizar(idx, { tipoPropiedad: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                      >
                        {TIPOS_PROPIEDAD.map(t => (
                          <option key={t.value} value={t.value} className="bg-[#0d0d1a]">{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Operación</label>
                      <div className="flex gap-2 h-[42px]">
                        {(['venta', 'arriendo'] as const).map(op => (
                          <button
                            key={op}
                            type="button"
                            onClick={() => actualizar(idx, { tipo: op })}
                            className={cn(
                              'flex-1 text-xs font-semibold rounded-xl border transition-all capitalize',
                              prop.tipo === op
                                ? 'bg-emerald-500 border-emerald-400 text-white'
                                : 'bg-white/5 border-white/10 text-muted-foreground hover:border-emerald-500/40'
                            )}
                          >
                            {op}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Precio + Moneda */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs text-muted-foreground mb-1 block">Precio</label>
                      <input
                        type="number"
                        value={prop.precio}
                        onChange={e => actualizar(idx, { precio: e.target.value })}
                        placeholder="Ej: 3500"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Moneda</label>
                      <div className="flex gap-1.5 h-[42px]">
                        {(['UF', 'CLP'] as const).map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => actualizar(idx, { moneda: m })}
                            className={cn(
                              'flex-1 text-xs font-bold rounded-xl border transition-all',
                              prop.moneda === m
                                ? 'bg-emerald-500 border-emerald-400 text-white'
                                : 'bg-white/5 border-white/10 text-muted-foreground hover:border-emerald-500/40'
                            )}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Características */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { campo: 'superficie', label: 'M²', icon: Maximize2, placeholder: '75' },
                      { campo: 'habitaciones', label: 'Dormit.', icon: Home, placeholder: '2' },
                      { campo: 'banos', label: 'Baños', icon: Bath, placeholder: '2' },
                      { campo: 'estacionamientos', label: 'Estac.', icon: Car, placeholder: '1' },
                    ].map(({ campo, label, icon: Icon, placeholder }) => (
                      <div key={campo}>
                        <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Icon className="w-3 h-3" />{label}
                        </label>
                        <input
                          type="number"
                          value={(prop as any)[campo]}
                          onChange={e => actualizar(idx, { [campo]: e.target.value } as any)}
                          placeholder={placeholder}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/50 transition-all text-center"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Ciudad + Ubicación */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Ciudad
                      </label>
                      <input
                        type="text"
                        value={prop.ciudad}
                        onChange={e => actualizar(idx, { ciudad: e.target.value })}
                        placeholder="Santiago"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Sector / Barrio</label>
                      <input
                        type="text"
                        value={prop.ubicacion}
                        onChange={e => actualizar(idx, { ubicacion: e.target.value })}
                        placeholder="Providencia, Las Condes..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/50 transition-all"
                      />
                    </div>
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Descripción</label>
                    <textarea
                      value={prop.descripcion}
                      onChange={e => actualizar(idx, { descripcion: e.target.value })}
                      placeholder="Amplio departamento con iluminación natural, cocina equipada, excelente ubicación..."
                      rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
                    />
                  </div>

                  {/* Imágenes */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block">Fotos de la propiedad</label>
                    <div className="flex flex-wrap gap-2">
                      {prop.imagenes.map((url, imgIdx) => (
                        <div key={imgIdx} className="relative group w-16 h-16">
                          <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => actualizar(idx, { imagenes: prop.imagenes.filter((_, i) => i !== imgIdx) })}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      ))}
                      <label className={cn(
                        'w-16 h-16 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center cursor-pointer hover:border-emerald-500/40 transition-colors',
                        uploadingIdx === idx && 'opacity-50 pointer-events-none'
                      )}>
                        {uploadingIdx === idx ? (
                          <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 text-muted-foreground" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const f = e.target.files?.[0]
                            if (f) subirImagen(idx, f)
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Destacada */}
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div
                      onClick={() => actualizar(idx, { destacada: !prop.destacada })}
                      className={cn(
                        'w-9 h-5 rounded-full transition-all relative',
                        prop.destacada ? 'bg-amber-400' : 'bg-white/10'
                      )}
                    >
                      <div className={cn(
                        'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all',
                        prop.destacada ? 'left-[18px]' : 'left-0.5'
                      )} />
                    </div>
                    <span className="text-xs text-muted-foreground group-hover:text-white transition-colors flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400" /> Marcar como destacada
                    </span>
                  </label>
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
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-sm font-medium transition-all"
      >
        <Plus className="w-4 h-4" />
        Agregar propiedad
      </button>

      {propiedades.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {propiedades.length} propiedad{propiedades.length !== 1 ? 'es' : ''} · Podrás agregar más desde tu panel después de crear el sitio
        </p>
      )}
    </div>
  )
}
