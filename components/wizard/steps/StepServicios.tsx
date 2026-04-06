'use client'

import { useState, useRef } from 'react'
import { Plus, Trash2, FileText, Upload, Loader2, Check, Sparkles, X, ChevronDown } from 'lucide-react'
import type { DatosWizard } from '../WizardCreacion'

interface Props {
  datos: DatosWizard
  onChange: (d: Partial<DatosWizard>) => void
}

export function StepServicios({ datos, onChange }: Props) {
  const [archivoMarca, setArchivoMarca] = useState<File | null>(null)
  const [analizando, setAnalizando] = useState(false)
  const [errorMarca, setErrorMarca] = useState('')
  const [mostrarSeccionMarca, setMostrarSeccionMarca] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function agregarServicio() {
    onChange({
      servicios: [...datos.servicios, { nombre: '', descripcion: '', precio: '' }],
    })
  }

  function eliminarServicio(index: number) {
    onChange({
      servicios: datos.servicios.filter((_, i) => i !== index),
    })
  }

  function actualizarServicio(index: number, campo: string, valor: string) {
    const nuevos = datos.servicios.map((s, i) =>
      i === index ? { ...s, [campo]: valor } : s
    )
    onChange({ servicios: nuevos })
  }

  function handleArchivoMarca(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setArchivoMarca(file)
    setErrorMarca('')
    onChange({ marcaAnalizada: null })
  }

  async function analizarMarca() {
    if (!archivoMarca) return
    setAnalizando(true)
    setErrorMarca('')
    try {
      const formData = new FormData()
      formData.append('file', archivoMarca)
      const res = await fetch('/api/analizar-marca', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al analizar')
      }
      const resultado = await res.json()
      onChange({ marcaAnalizada: resultado })
    } catch (err: any) {
      setErrorMarca(err.message || 'Error al analizar el manual')
    } finally {
      setAnalizando(false)
    }
  }

  function aplicarMarca() {
    if (!datos.marcaAnalizada) return
    onChange({
      coloresPrimarios: datos.marcaAnalizada.coloresPrimarios,
      coloresSecundarios: datos.marcaAnalizada.coloresSecundarios,
      tipografia: datos.marcaAnalizada.tipografia,
      tipoDiseno: datos.marcaAnalizada.tipoDiseno,
    })
  }

  function limpiarMarca() {
    setArchivoMarca(null)
    onChange({ marcaAnalizada: null })
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-6">
      {/* Propuesta de valor */}
      <div>
        <label className="block text-sm font-medium mb-2">
          ¿Cuál es la propuesta de valor principal de tu empresa?
        </label>
        <textarea
          value={datos.propuestaValor}
          onChange={e => onChange({ propuestaValor: e.target.value })}
          placeholder="Ej: 'Somos la única clínica dental con atención 24/7 en Santiago, con tecnología de última generación y precios accesibles'"
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
        />
      </div>

      {/* Servicios */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium">
            Servicios / Productos <span className="text-red-400">*</span>
          </label>
          <button
            type="button"
            onClick={agregarServicio}
            disabled={datos.servicios.length >= 10}
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar servicio
          </button>
        </div>

        <div className="space-y-4">
          {datos.servicios.map((servicio, index) => (
            <div key={index} className="glass rounded-xl border border-white/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">
                  Servicio {index + 1}
                </span>
                {datos.servicios.length > 1 && (
                  <button
                    type="button"
                    onClick={() => eliminarServicio(index)}
                    className="text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={servicio.nombre}
                  onChange={e => actualizarServicio(index, 'nombre', e.target.value)}
                  placeholder="Nombre del servicio"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 transition-all"
                />
                <input
                  type="text"
                  value={servicio.precio || ''}
                  onChange={e => actualizarServicio(index, 'precio', e.target.value)}
                  placeholder="Precio (opcional) ej: $25.000"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 transition-all"
                />
              </div>
              <textarea
                value={servicio.descripcion}
                onChange={e => actualizarServicio(index, 'descripcion', e.target.value)}
                placeholder="Describe brevemente este servicio..."
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Manual de marca (colapsable) ── */}
      <div className="border border-white/10 rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setMostrarSeccionMarca(v => !v)}
          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
              <FileText className="w-4 h-4 text-violet-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">Manual de marca</p>
              <p className="text-xs text-muted-foreground">
                Opcional — Claude extrae colores, tipografías y estilo automáticamente
              </p>
            </div>
            {datos.marcaAnalizada && (
              <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-2.5 py-0.5">
                <Check className="w-3 h-3" /> Analizado
              </span>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${mostrarSeccionMarca ? 'rotate-180' : ''}`} />
        </button>

        {mostrarSeccionMarca && (
          <div className="p-4 pt-2 border-t border-white/5 space-y-4">
            <p className="text-xs text-muted-foreground">
              Sube tu brandbook, guía de identidad o manual de estilo. Claude leerá el documento y
              completará automáticamente los colores, tipografía y estilo en el siguiente paso.
            </p>

            {/* File picker */}
            {!archivoMarca ? (
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-white/15 rounded-xl p-5 text-center cursor-pointer hover:border-violet-500/40 transition-colors group"
              >
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-6 h-6 text-muted-foreground group-hover:text-violet-400 transition-colors" />
                  <p className="text-sm text-muted-foreground">Haz click para seleccionar el archivo</p>
                  <p className="text-xs text-muted-foreground">PDF, PNG, JPG, WebP — Máx 10MB</p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  onChange={handleArchivoMarca}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="w-9 h-9 rounded-lg bg-violet-500/15 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{archivoMarca.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(archivoMarca.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <button type="button" onClick={limpiarMarca} className="text-muted-foreground hover:text-red-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Botón analizar */}
            {archivoMarca && !datos.marcaAnalizada && (
              <button
                type="button"
                onClick={analizarMarca}
                disabled={analizando}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 text-violet-300 text-sm font-medium transition-all disabled:opacity-60"
              >
                {analizando ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Analizando con Claude...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Analizar con Claude</>
                )}
              </button>
            )}

            {errorMarca && <p className="text-red-400 text-xs">{errorMarca}</p>}

            {/* Resultado */}
            {datos.marcaAnalizada && (
              <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-green-400 text-xs font-semibold">
                  <Check className="w-3.5 h-3.5" /> Marca analizada correctamente
                </div>
                <p className="text-xs text-muted-foreground italic">
                  "{datos.marcaAnalizada.descripcion}"
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg border border-white/20 shrink-0" style={{ backgroundColor: datos.marcaAnalizada.coloresPrimarios }} />
                    <div>
                      <p className="text-xs text-muted-foreground">Primario</p>
                      <p className="text-xs font-mono">{datos.marcaAnalizada.coloresPrimarios}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg border border-white/20 shrink-0" style={{ backgroundColor: datos.marcaAnalizada.coloresSecundarios }} />
                    <div>
                      <p className="text-xs text-muted-foreground">Secundario</p>
                      <p className="text-xs font-mono">{datos.marcaAnalizada.coloresSecundarios}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Tipografía:</span>
                  <span className="text-white font-medium capitalize">{datos.marcaAnalizada.tipografia}</span>
                  <span className="text-white/20">·</span>
                  <span>Estilo:</span>
                  <span className="text-white font-medium capitalize">{datos.marcaAnalizada.tipoDiseno}</span>
                </div>
                <button
                  type="button"
                  onClick={aplicarMarca}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-green-500/15 hover:bg-green-500/25 border border-green-500/30 text-green-300 text-xs font-semibold transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Aplicar estilos al diseño
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

