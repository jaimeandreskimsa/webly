'use client'

import { useState, useRef } from 'react'
import { Upload, X, ImagePlus, Loader2, AlertCircle, Sparkles, Wand2, Minus, Plus, Info, Check } from 'lucide-react'
import type { DatosWizard } from '../WizardCreacion'
import { cn } from '@/lib/utils'

interface Props {
  datos: DatosWizard
  onChange: (d: Partial<DatosWizard>) => void
  plan: 'basico' | 'pro' | 'premium' | 'broker'
}

const limiteImagenes = { basico: 0, pro: 10, premium: 30, broker: 20 }
const limiteIA = { basico: 2, pro: 5, premium: 10, broker: 10 }

type Tab = 'subir' | 'ia'

// Sugerencias de escenas por rubro
const ESCENAS_POR_RUBRO: Record<string, string[]> = {
  'Restaurante / Café': [
    'Platos del menú presentados con estilo gastronómico',
    'Interior del local con ambiente acogedor',
    'Chef preparando platos en cocina profesional',
    'Fachada exterior del restaurante',
    'Mesa servida con ambiente especial',
  ],
  'Tienda / Comercio': [
    'Productos destacados en vitrina elegante',
    'Interior de la tienda bien iluminada',
    'Detalle de productos de alta calidad',
    'Fachada exterior del local',
    'Ambiente de compra moderno y atractivo',
  ],
  'Servicios profesionales': [
    'Equipo de trabajo en oficina moderna',
    'Reunión profesional en sala de conferencias',
    'Persona trabajando con tecnología de punta',
    'Fachada o recepción de las oficinas',
    'Trabajo en equipo colaborativo',
  ],
  'Salud / Clínica': [
    'Consultorio médico moderno y limpio',
    'Equipo médico profesional con uniforme',
    'Equipamiento de última generación',
    'Sala de espera cómoda y acogedora',
    'Doctor atendiendo paciente amablemente',
  ],
  'Inmobiliario / Portal de propiedades': [
    'Fachada de propiedad moderna bien iluminada',
    'Interior luminoso con diseño contemporáneo',
    'Sala de estar elegante y espaciosa',
    'Vista panorámica desde balcón o terraza',
    'Cocina moderna equipada completamente',
  ],
  'Construcción / Inmobiliaria': [
    'Obra en construcción con equipo trabajando',
    'Resultado final de proyecto terminado',
    'Planos y diseño arquitectónico',
    'Equipo de constructores profesionales',
    'Detalle de acabados de alta calidad',
  ],
  'Educación / Academia': [
    'Aula moderna con estudiantes aprendiendo',
    'Profesor enseñando con tecnología',
    'Espacio de estudio colaborativo',
    'Materiales educativos y recursos',
    'Graduación o ceremonia de logros',
  ],
  'Belleza / Estética': [
    'Salón moderno y elegante',
    'Estilista realizando tratamiento profesional',
    'Resultado final de transformación',
    'Productos de belleza de alta gama',
    'Ambiente de spa relajante y lujoso',
  ],
  'Tecnología': [
    'Oficina tecnológica moderna y dinámica',
    'Desarrolladores trabajando en equipo',
    'Interfaz o producto digital en pantalla',
    'Reunión de startup innovadora',
    'Servidor o infraestructura tecnológica',
  ],
  'Turismo / Hospedaje': [
    'Habitación del hotel lujosa y cómoda',
    'Piscina o área de recreación',
    'Vista panorámica del destino',
    'Recepción acogedora del hotel',
    'Experiencia turística memorable',
  ],
}

const ESCENAS_GENERALES = [
  'Equipo de trabajo profesional y dinámico',
  'Fachada exterior del negocio',
  'Interior moderno y acogedor',
  'Servicio al cliente de calidad',
  'Ambiente de trabajo colaborativo',
]

// Construye el contexto completo del negocio para el prompt de IA
function construirContextoMarca(datos: DatosWizard): string {
  const partes: string[] = []

  if (datos.nombreEmpresa) partes.push(`Empresa: "${datos.nombreEmpresa}"`)
  if (datos.rubro) partes.push(`Rubro: ${datos.rubro}`)
  if (datos.descripcion) partes.push(`Descripción: ${datos.descripcion}`)
  if (datos.ciudad) partes.push(`Ciudad: ${datos.ciudad}`)

  const serviciosNombres = (datos.servicios || [])
    .map(s => s.nombre)
    .filter(Boolean)
    .slice(0, 4)
  if (serviciosNombres.length) partes.push(`Servicios: ${serviciosNombres.join(', ')}`)

  if (datos.propuestaValor) partes.push(`Propuesta de valor: ${datos.propuestaValor}`)

  const estiloMap: Record<string, string> = {
    moderno: 'estilo moderno y minimalista',
    clasico: 'estilo clásico y elegante',
    minimalista: 'estilo minimalista y limpio',
    corporativo: 'estilo corporativo y profesional',
    creativo: 'estilo creativo y colorido',
    natural: 'estilo natural y orgánico',
  }
  const estiloDesc = estiloMap[datos.tipoDiseno] || datos.tipoDiseno
  if (estiloDesc) partes.push(`Estilo visual: ${estiloDesc}`)

  return partes.join(' · ')
}

export function StepMedia({ datos, onChange, plan }: Props) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [tab, setTab] = useState<Tab>('subir')
  const [escenaSeleccionada, setEscenaSeleccionada] = useState<string | null>(null)
  const [detalleExtra, setDetalleExtra] = useState('')
  const [cantidadIA, setCantidadIA] = useState(1)
  const [generando, setGenerando] = useState(false)
  const [errorIA, setErrorIA] = useState('')
  const logoRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLInputElement>(null)

  const limite = limiteImagenes[plan]
  const maxIA = limiteIA[plan]

  // Escenas disponibles según el rubro del negocio
  const escenasDisponibles = ESCENAS_POR_RUBRO[datos.rubro] || ESCENAS_GENERALES
  const contextoConstruido = construirContextoMarca(datos)

  async function subirArchivo(file: File, tipo: string): Promise<string | null> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('tipo', tipo)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    if (!res.ok) return null
    const data = await res.json()
    return data.url
  }

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError('')
    const url = await subirArchivo(file, 'logo')
    if (url) onChange({ logo: url })
    else setUploadError('Error al subir el logo. Intenta de nuevo.')
    setUploading(false)
  }

  async function handleImagenes(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const restantes = limite - datos.imagenes.length
    const aSubir = files.slice(0, restantes)
    setUploading(true)
    setUploadError('')
    const urls = await Promise.all(aSubir.map(f => subirArchivo(f, 'galeria')))
    const nuevas = urls.filter(Boolean) as string[]
    onChange({ imagenes: [...datos.imagenes, ...nuevas] })
    setUploading(false)
  }

  function eliminarImagen(url: string) {
    onChange({ imagenes: datos.imagenes.filter(u => u !== url) })
  }

  function eliminarImagenIA(url: string) {
    onChange({ imagenesIA: (datos.imagenesIA || []).filter(u => u !== url) })
  }

  async function generarImagenesIA() {
    const escena = escenaSeleccionada || detalleExtra.trim()
    if (!escena) {
      setErrorIA('Selecciona una escena o describe qué quieres generar')
      return
    }
    const yaGeneradas = (datos.imagenesIA || []).length
    if (yaGeneradas >= maxIA) {
      setErrorIA(`Ya alcanzaste el límite de ${maxIA} imágenes IA para el plan ${plan}`)
      return
    }
    const cantidadFinal = Math.min(cantidadIA, maxIA - yaGeneradas)

    // Prompt enriquecido: escena elegida + contexto completo de la marca
    const promptCompleto = detalleExtra.trim()
      ? `${escenaSeleccionada ? escenaSeleccionada + ' — ' : ''}${detalleExtra.trim()} · ${contextoConstruido}`
      : `${escena} · ${contextoConstruido}`

    setGenerando(true)
    setErrorIA('')
    try {
      const res = await fetch('/api/generar-imagenes-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptCompleto,
          cantidad: cantidadFinal,
          plan,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al generar')
      }
      const { urls } = await res.json()
      onChange({ imagenesIA: [...(datos.imagenesIA || []), ...urls] })
    } catch (err: any) {
      setErrorIA(err.message || 'Error al generar imágenes')
    } finally {
      setGenerando(false)
    }
  }

  const totalImagenes = datos.imagenes.length + (datos.imagenesIA || []).length

  return (
    <div className="space-y-6">
      {/* Logo */}
      <div>
        <label className="block text-sm font-medium mb-2">Logo de tu empresa</label>
        <div
          onClick={() => logoRef.current?.click()}
          className="relative border-2 border-dashed border-white/15 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-500/40 transition-colors group"
        >
          {datos.logo ? (
            <div className="flex items-center justify-center gap-3">
              <img src={datos.logo} alt="Logo" className="h-16 object-contain" />
              <button
                type="button"
                onClick={e => { e.stopPropagation(); onChange({ logo: undefined }) }}
                className="text-muted-foreground hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImagePlus className="w-8 h-8 text-muted-foreground group-hover:text-indigo-400 transition-colors" />
              <p className="text-sm text-muted-foreground">Click para subir tu logo</p>
              <p className="text-xs text-muted-foreground">PNG, SVG, JPG — Máx 2MB</p>
            </div>
          )}
          <input ref={logoRef} type="file" accept="image/*" onChange={handleLogo} className="hidden" />
        </div>
      </div>

      {/* Imágenes */}
      {plan === 'basico' ? (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-300 font-medium">Plan Básico — Imágenes de stock</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tu sitio usará imágenes de stock de alta calidad seleccionadas automáticamente.
                Actualiza al plan <strong className="text-white">Pro</strong> o <strong className="text-white">Premium</strong> para subir tus fotos o generarlas con IA.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl mb-4 border border-white/5">
            <button
              type="button"
              onClick={() => setTab('subir')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === 'subir'
                  ? 'bg-indigo-500 text-white'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              <Upload className="w-4 h-4" />
              Subir fotos
              {datos.imagenes.length > 0 && (
                <span className="text-xs bg-white/20 rounded-full px-1.5">{datos.imagenes.length}</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setTab('ia')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === 'ia'
                  ? 'bg-violet-500 text-white'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Generar con IA
              {(datos.imagenesIA || []).length > 0 && (
                <span className="text-xs bg-white/20 rounded-full px-1.5">{(datos.imagenesIA || []).length}/{maxIA}</span>
              )}
            </button>
          </div>

          {tab === 'subir' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Imágenes del negocio</label>
                <span className="text-xs text-muted-foreground">{datos.imagenes.length}/{limite}</span>
              </div>
              {datos.imagenes.length < limite && (
                <div
                  onClick={() => imgRef.current?.click()}
                  className="border-2 border-dashed border-white/15 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-500/40 transition-colors group mb-4"
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                      <p className="text-sm text-muted-foreground">Subiendo...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-6 h-6 text-muted-foreground group-hover:text-indigo-400 transition-colors" />
                      <p className="text-sm text-muted-foreground">Arrastra fotos o haz click para seleccionar</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG, WebP — Máx 5MB c/u</p>
                    </div>
                  )}
                  <input ref={imgRef} type="file" accept="image/*" multiple onChange={handleImagenes} className="hidden" />
                </div>
              )}
              {datos.imagenes.length > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  {datos.imagenes.map((url, i) => (
                    <div key={i} className="relative group aspect-square">
                      <img src={url} alt={`Imagen ${i + 1}`} className="w-full h-full object-cover rounded-xl" />
                      <button
                        type="button"
                        onClick={() => eliminarImagen(url)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'ia' && renderGeneradorIA()}
        </div>
      )}

      {/* Video (premium) */}
      {plan === 'premium' && (
        <div>
          <label className="block text-sm font-medium mb-2">
            Video de fondo del hero
            <span className="ml-2 text-xs text-amber-400 font-normal">Solo Premium</span>
          </label>
          <input
            type="url"
            value={datos.videoUrl || ''}
            onChange={e => onChange({ videoUrl: e.target.value })}
            placeholder="https://youtube.com/watch?v=... o URL directa de video"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 transition-all"
          />
        </div>
      )}

      {uploadError && <p className="text-red-400 text-xs">{uploadError}</p>}
    </div>
  )

  function renderGeneradorIA() {
    const yaGeneradas = (datos.imagenesIA || []).length
    const restantes = maxIA - yaGeneradas

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Generar imágenes con IA</p>
          <span className="text-xs text-muted-foreground">
            {yaGeneradas}/{maxIA} generadas · Plan {plan}
          </span>
        </div>

        {/* Contexto detectado de la marca */}
        {contextoConstruido && (
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-1.5 mb-1">
              <Info className="w-3.5 h-3.5 text-violet-400" />
              <p className="text-xs font-semibold text-violet-300">Contexto de tu marca detectado</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{contextoConstruido}</p>
            <p className="text-xs text-violet-400/70">La IA usará toda esta información para generar imágenes relevantes a tu negocio</p>
          </div>
        )}

        {restantes > 0 ? (
          <>
            {/* Sugerencias de escenas */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block font-medium">
                ¿Qué tipo de escena quieres? <span className="text-white/40">(Elige una o escribe la tuya)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {escenasDisponibles.map((escena) => {
                  const activa = escenaSeleccionada === escena
                  return (
                    <button
                      key={escena}
                      type="button"
                      onClick={() => {
                        setEscenaSeleccionada(activa ? null : escena)
                        setErrorIA('')
                      }}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                        activa
                          ? 'bg-violet-500 border-violet-400 text-white'
                          : 'bg-white/5 border-white/10 text-muted-foreground hover:border-violet-500/40 hover:text-white'
                      )}
                    >
                      {activa && <Check className="w-3 h-3" />}
                      {escena}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Campo libre adicional */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Detalle adicional <span className="text-white/30">(opcional)</span>
              </label>
              <textarea
                value={detalleExtra}
                onChange={e => { setDetalleExtra(e.target.value); setErrorIA('') }}
                placeholder={
                  escenaSeleccionada
                    ? `Agrega detalles extra a "${escenaSeleccionada.split(' ').slice(0, 4).join(' ')}..."  (ej: con luz natural, vista de noche, con personas)`
                    : 'O describe tu propia escena personalizada...'
                }
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-violet-500/50 transition-all resize-none"
              />
            </div>

            {/* Controles: cantidad + botón generar */}
            <div className="flex items-center gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Cantidad</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCantidadIA(v => Math.max(1, v - 1))}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-lg font-bold w-7 text-center">{Math.min(cantidadIA, restantes)}</span>
                  <button
                    type="button"
                    onClick={() => setCantidadIA(v => Math.min(restantes, v + 1))}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={generarImagenesIA}
                disabled={generando || (!escenaSeleccionada && !detalleExtra.trim())}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 text-violet-300 text-sm font-semibold transition-all disabled:opacity-40"
              >
                {generando ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generando con IA...</>
                ) : (
                  <><Wand2 className="w-4 h-4" /> Generar imagen</>
                )}
              </button>
            </div>

            {/* Prompt preview que se enviará */}
            {(escenaSeleccionada || detalleExtra.trim()) && !generando && (
              <details className="group">
                <summary className="text-xs text-violet-400/60 cursor-pointer hover:text-violet-400 transition-colors select-none">
                  Ver prompt que se enviará a la IA ▸
                </summary>
                <div className="mt-2 bg-white/5 rounded-lg p-3 text-xs text-muted-foreground leading-relaxed border border-white/5">
                  {detalleExtra.trim()
                    ? `${escenaSeleccionada ? escenaSeleccionada + ' — ' : ''}${detalleExtra.trim()} · ${contextoConstruido}`
                    : `${escenaSeleccionada} · ${contextoConstruido}`}
                </div>
              </details>
            )}
          </>
        ) : (
          <div className="text-center py-6 space-y-1">
            <Sparkles className="w-8 h-8 text-violet-400/40 mx-auto" />
            <p className="text-sm text-muted-foreground">Límite alcanzado</p>
            <p className="text-xs text-muted-foreground">Usaste {maxIA} imágenes IA del plan {plan}</p>
          </div>
        )}

        {errorIA && (
          <div className="flex items-center gap-2 text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {errorIA}
          </div>
        )}

        {/* Grid de imágenes generadas */}
        {(datos.imagenesIA || []).length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-violet-400" />
              Imágenes generadas con IA
            </p>
            <div className="grid grid-cols-4 gap-3">
              {(datos.imagenesIA || []).map((url, i) => (
                <div key={i} className="relative group aspect-square">
                  <img src={url} alt={`IA ${i + 1}`} className="w-full h-full object-cover rounded-xl" />
                  <div className="absolute top-1 left-1 bg-violet-500/80 rounded-full p-0.5">
                    <Sparkles className="w-2.5 h-2.5 text-white" />
                  </div>
                  <button
                    type="button"
                    onClick={() => eliminarImagenIA(url)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }
}
