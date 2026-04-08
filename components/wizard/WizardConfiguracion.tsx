'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2, Briefcase, Palette, ImagePlus, Phone,
  ChevronRight, ChevronLeft, Check, Loader2, Zap, Rocket
} from 'lucide-react'
import { StepNegocio } from './steps/StepNegocio'
import { StepServicios } from './steps/StepServicios'
import { StepDiseno } from './steps/StepDiseno'
import { StepMedia } from './steps/StepMedia'
import { StepContacto } from './steps/StepContacto'
import { StepPropiedades, type PropiedadWizard } from './steps/StepPropiedades'
import { cn } from '@/lib/utils'

export interface DatosConfiguracion {
  plan: 'basico' | 'pro' | 'premium' | 'broker'
  nombreEmpresa: string
  rubro: string
  descripcion: string
  ciudad: string
  estilo: string
  servicios: Array<{ nombre: string; descripcion: string; precio?: string }>
  propuestaValor: string
  marcaAnalizada?: {
    coloresPrimarios: string
    coloresSecundarios: string
    tipografia: string
    tipoDiseno: string
    descripcion: string
  } | null
  coloresPrimarios: string
  coloresSecundarios: string
  tipoDiseno: string
  tipografia: string
  logo?: string
  imagenes: string[]
  imagenesIA: string[]
  videoUrl?: string
  telefono: string
  email: string
  direccion: string
  horario: string
  redesSociales: {
    instagram?: string
    facebook?: string
    whatsapp?: string
    linkedin?: string
  }
  sitiosReferencia: string[]
  propiedadesIniciales?: PropiedadWizard[]
}

const pasosBroker = [
  { id: 1, titulo: 'Tu inmobiliaria', icon: Building2,  descripcion: 'Info básica de tu empresa' },
  { id: 2, titulo: 'Servicios',       icon: Briefcase,  descripcion: 'Qué ofrece tu inmobiliaria' },
  { id: 3, titulo: 'Propiedades',     icon: Building2,  descripcion: 'Propiedades iniciales del portal' },
  { id: 4, titulo: 'Diseño',          icon: Palette,    descripcion: 'Estilo visual' },
  { id: 5, titulo: 'Imágenes',        icon: ImagePlus,  descripcion: 'Logo y fotos de la empresa' },
  { id: 6, titulo: 'Contacto',        icon: Phone,      descripcion: 'Datos de contacto' },
]

const pasosDefault = [
  { id: 1, titulo: 'Tu negocio', icon: Building2, descripcion: 'Info básica de tu empresa' },
  { id: 2, titulo: 'Servicios',  icon: Briefcase, descripcion: 'Qué ofreces' },
  { id: 3, titulo: 'Diseño',     icon: Palette,   descripcion: 'Estilo visual' },
  { id: 4, titulo: 'Imágenes',   icon: ImagePlus, descripcion: 'Logo y fotos' },
  { id: 5, titulo: 'Contacto',   icon: Phone,     descripcion: 'Datos de contacto' },
]

const datosIniciales: DatosConfiguracion = {
  plan: 'pro',
  nombreEmpresa: '',
  rubro: '',
  descripcion: '',
  ciudad: '',
  estilo: 'moderno',
  servicios: [{ nombre: '', descripcion: '', precio: '' }],
  propuestaValor: '',
  marcaAnalizada: null,
  coloresPrimarios: '#6366f1',
  coloresSecundarios: '#a855f7',
  tipoDiseno: 'moderno',
  tipografia: 'inter',
  logo: undefined,
  imagenes: [],
  imagenesIA: [],
  videoUrl: undefined,
  telefono: '',
  email: '',
  direccion: '',
  horario: '',
  redesSociales: {},
  sitiosReferencia: ['', ''],
  propiedadesIniciales: [],
}

interface WizardConfiguracionProps {
  plan: 'basico' | 'pro' | 'premium' | 'broker'
  sitioId: string
}

export function WizardConfiguracion({ plan: planInicial, sitioId }: WizardConfiguracionProps) {
  const router = useRouter()
  const [paso, setPaso] = useState(1)
  const [datos, setDatos] = useState<DatosConfiguracion>({ ...datosIniciales, plan: planInicial })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const pasos = planInicial === 'broker' ? pasosBroker : pasosDefault
  const esUltimoPaso = paso === pasos.length

  function actualizarDatos(nuevos: Partial<DatosConfiguracion>) {
    setDatos(prev => ({ ...prev, ...nuevos }))
  }

  function irAPaso(numeroPaso: number) {
    if (numeroPaso < 1 || numeroPaso > pasos.length) return
    setError('')
    setPaso(numeroPaso)
  }

  function siguiente() {
    if (paso === 1 && !datos.nombreEmpresa.trim()) {
      setError('El nombre de tu empresa es requerido para continuar')
      return
    }
    setError('')
    if (!esUltimoPaso) setPaso(p => p + 1)
  }

  function anterior() {
    if (paso > 1) {
      setError('')
      setPaso(p => p - 1)
    }
  }

  async function generarSitio() {
    if (!datos.nombreEmpresa.trim()) {
      setError('El nombre de tu empresa es requerido antes de generar')
      return
    }
    setLoading(true)
    setError('')

    try {
      // 1. Guardar datos en la BD + cambiar estado a generando
      const res = await fetch(`/api/sitios/${sitioId}/configurar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombreEmpresa: datos.nombreEmpresa, contenidoJson: datos }),
      })
      const resData = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(resData.error || 'Error al guardar los datos')

      // 2. Ir a la pantalla de generación
      router.push(`/dashboard/sitios/${sitioId}/generando`)
    } catch (err: any) {
      setError(err.message || 'Error al procesar. Intenta de nuevo.')
      setLoading(false)
    }
  }

  const progreso = ((paso - 1) / (pasos.length - 1)) * 100

  return (
    <div className="space-y-6">
      {/* Steps clickeables */}
      <div className="glass rounded-2xl border border-white/5 p-6">
        <div className="relative mb-6">
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>

        <div className="flex items-start justify-between">
          {pasos.map((p) => {
            const isCompleted = paso > p.id
            const isCurrent = paso === p.id
            const isReachable = p.id <= paso

            return (
              <button
                key={p.id}
                onClick={() => irAPaso(p.id)}
                disabled={loading || !isReachable}
                title={isReachable ? `Ir a: ${p.titulo}` : p.titulo}
                className={cn(
                  'flex flex-col items-center gap-1.5 flex-1 group transition-all',
                  isReachable && !loading ? 'cursor-pointer' : 'cursor-default',
                  !isReachable && 'opacity-50'
                )}
              >
                <div className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300',
                  isCompleted
                    ? 'bg-indigo-500 group-hover:bg-indigo-400'
                    : isCurrent
                    ? 'bg-indigo-500/20 border-2 border-indigo-500'
                    : isReachable
                    ? 'bg-white/5 border border-white/10 group-hover:border-indigo-500/40 group-hover:bg-indigo-500/10'
                    : 'bg-white/5 border border-white/10'
                )}>
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <p.icon className={cn('w-4 h-4', isCurrent ? 'text-indigo-400' : 'text-muted-foreground')} />
                  )}
                </div>
                <span className={cn(
                  'text-xs font-medium hidden sm:block text-center leading-tight',
                  isCurrent ? 'text-indigo-300' : isCompleted ? 'text-white' : 'text-muted-foreground'
                )}>
                  {p.titulo}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Contenido */}
      <div className="glass rounded-2xl border border-white/5 p-8 min-h-[400px]">
        <div className="mb-6">
          <h2 className="text-xl font-bold">{pasos[paso - 1].titulo}</h2>
          <p className="text-muted-foreground text-sm">{pasos[paso - 1].descripcion}</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        {paso === 1 && <StepNegocio datos={datos as any} onChange={actualizarDatos} />}
        {paso === 2 && <StepServicios datos={datos as any} onChange={actualizarDatos} />}

        {paso === 3 && datos.plan === 'broker' && <StepPropiedades datos={datos as any} onChange={actualizarDatos} />}
        {paso === 3 && datos.plan !== 'broker' && <StepDiseno datos={datos as any} onChange={actualizarDatos} plan={datos.plan} />}

        {paso === 4 && datos.plan === 'broker' && <StepDiseno datos={datos as any} onChange={actualizarDatos} plan={datos.plan} />}
        {paso === 4 && datos.plan !== 'broker' && <StepMedia datos={datos as any} onChange={actualizarDatos} plan={datos.plan} />}

        {paso === 5 && datos.plan === 'broker' && <StepMedia datos={datos as any} onChange={actualizarDatos} plan={datos.plan} />}
        {paso === 5 && datos.plan !== 'broker' && <StepContacto datos={datos as any} onChange={actualizarDatos} />}

        {paso === 6 && datos.plan === 'broker' && <StepContacto datos={datos as any} onChange={actualizarDatos} />}
      </div>

      {/* Navegación */}
      <div className="flex items-center justify-between">
        <button
          onClick={anterior}
          disabled={paso === 1 || loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass glass-hover text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </button>

        <span className="text-xs text-muted-foreground">Paso {paso} de {pasos.length}</span>

        {esUltimoPaso ? (
          <button
            onClick={generarSitio}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl btn-gradient text-white text-sm font-bold hover:scale-105 transition-transform glow-purple disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
            ) : (
              <><Rocket className="w-4 h-4" /> Generar mi sitio</>
            )}
          </button>
        ) : (
          <button
            onClick={siguiente}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-gradient text-white text-sm font-semibold hover:scale-105 transition-transform disabled:opacity-50"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
