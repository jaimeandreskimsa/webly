'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2, Briefcase, Palette, ImagePlus, Phone,
  ChevronRight, ChevronLeft, Check, Loader2, CreditCard
} from 'lucide-react'
import { StepNegocio } from './steps/StepNegocio'
import { StepServicios } from './steps/StepServicios'
import { StepDiseno } from './steps/StepDiseno'
import { StepMedia } from './steps/StepMedia'
import { StepContacto } from './steps/StepContacto'
import { StepPago } from './steps/StepPago'
import { StepPropiedades, type PropiedadWizard } from './steps/StepPropiedades'
import { cn } from '@/lib/utils'

export interface DatosWizard {
  plan: 'basico' | 'pro' | 'premium' | 'broker'
  // Paso 1 - Negocio
  nombreEmpresa: string
  rubro: string
  descripcion: string
  ciudad: string
  estilo: string
  // Paso 2 - Servicios
  servicios: Array<{ nombre: string; descripcion: string; precio?: string }>
  propuestaValor: string
  // Manual de marca (opcional)
  marcaAnalizada?: {
    coloresPrimarios: string
    coloresSecundarios: string
    tipografia: string
    tipoDiseno: string
    descripcion: string
  } | null
  // Paso 3 - Diseño
  coloresPrimarios: string
  coloresSecundarios: string
  tipoDiseno: string
  tipografia: string
  // Paso 4 - Media
  logo?: string
  imagenes: string[]
  imagenesIA: string[]
  videoUrl?: string
  // Paso 5 - Contacto
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
  // Solo plan broker
  propiedadesIniciales?: PropiedadWizard[]
}

const pasosBroker = [
  { id: 1, titulo: 'Tu inmobiliaria', icon: Building2, descripcion: 'Info básica de tu empresa' },
  { id: 2, titulo: 'Servicios', icon: Briefcase, descripcion: 'Qué ofrece tu inmobiliaria' },
  { id: 3, titulo: 'Propiedades', icon: Building2, descripcion: 'Propiedades iniciales del portal' },
  { id: 4, titulo: 'Diseño', icon: Palette, descripcion: 'Estilo visual' },
  { id: 5, titulo: 'Imágenes', icon: ImagePlus, descripcion: 'Logo y fotos de la empresa' },
  { id: 6, titulo: 'Contacto', icon: Phone, descripcion: 'Datos de contacto' },
  { id: 7, titulo: 'Pagar', icon: CreditCard, descripcion: 'Confirmar y pagar' },
]

const pasosDefault = [
  { id: 1, titulo: 'Tu negocio', icon: Building2, descripcion: 'Info básica de tu empresa' },
  { id: 2, titulo: 'Servicios', icon: Briefcase, descripcion: 'Qué ofreces' },
  { id: 3, titulo: 'Diseño', icon: Palette, descripcion: 'Estilo visual' },
  { id: 4, titulo: 'Imágenes', icon: ImagePlus, descripcion: 'Logo y fotos' },
  { id: 5, titulo: 'Contacto', icon: Phone, descripcion: 'Datos de contacto' },
  { id: 6, titulo: 'Pagar', icon: CreditCard, descripcion: 'Confirmar y pagar' },
]

const datosIniciales: DatosWizard = {
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
  propiedadesIniciales: [],
}

interface WizardCreacionProps {
  planInicial: 'basico' | 'pro' | 'premium' | 'broker'
  userId: string
}

export function WizardCreacion({ planInicial, userId }: WizardCreacionProps) {
  const router = useRouter()
  const [paso, setPaso] = useState(1)
  const [datos, setDatos] = useState<DatosWizard>({ ...datosIniciales, plan: planInicial })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const pasos = planInicial === 'broker' ? pasosBroker : pasosDefault

  function actualizarDatos(nuevos: Partial<DatosWizard>) {
    setDatos(prev => ({ ...prev, ...nuevos }))
  }

  function siguiente() {
    if (paso === 1 && !datos.nombreEmpresa.trim()) {
      setError('El nombre de tu empresa es requerido para continuar')
      return
    }
    setError('')
    if (paso < pasos.length) setPaso(p => p + 1)
  }

  function anterior() {
    if (paso > 1) setPaso(p => p - 1)
  }

  const progreso = ((paso - 1) / (pasos.length - 1)) * 100

  return (
    <div className="space-y-6">
      {/* Paso indicators */}
      <div className="glass rounded-2xl border border-white/5 p-6">
        {/* Progress bar */}
        <div className="relative mb-6">
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-between">
          {pasos.map((p, idx) => {
            const isCompleted = paso > p.id
            const isCurrent = paso === p.id

            return (
              <div key={p.id} className="flex flex-col items-center gap-1.5 flex-1">
                <div className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300',
                  isCompleted
                    ? 'bg-indigo-500 glow-purple'
                    : isCurrent
                    ? 'bg-indigo-500/20 border-2 border-indigo-500'
                    : 'bg-white/5 border border-white/10'
                )}>
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <p.icon className={cn(
                      'w-4 h-4',
                      isCurrent ? 'text-indigo-400' : 'text-muted-foreground'
                    )} />
                  )}
                </div>
                <span className={cn(
                  'text-xs font-medium hidden sm:block',
                  isCurrent ? 'text-indigo-300' : isCompleted ? 'text-white' : 'text-muted-foreground'
                )}>
                  {p.titulo}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Step content */}
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

        {paso === 1 && (
          <StepNegocio datos={datos} onChange={actualizarDatos} />
        )}
        {paso === 2 && (
          <StepServicios datos={datos} onChange={actualizarDatos} />
        )}
        {paso === 3 && datos.plan === 'broker' && (
          <StepPropiedades datos={datos} onChange={actualizarDatos} />
        )}
        {paso === (datos.plan === 'broker' ? 4 : 3) && (
          <StepDiseno datos={datos} onChange={actualizarDatos} />
        )}
        {paso === (datos.plan === 'broker' ? 5 : 4) && (
          <StepMedia datos={datos} onChange={actualizarDatos} plan={datos.plan} />
        )}
        {paso === (datos.plan === 'broker' ? 6 : 5) && (
          <StepContacto datos={datos} onChange={actualizarDatos} />
        )}
        {paso === (datos.plan === 'broker' ? 7 : 6) && (
          <StepPago
            datos={datos}
            userId={userId}
            onError={setError}
            onLoading={setLoading}
          />
        )}
      </div>

      {/* Navigation */}
      {paso < pasos.length && (
        <div className="flex items-center justify-between">
          <button
            onClick={anterior}
            disabled={paso === 1}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass glass-hover text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>

          <span className="text-xs text-muted-foreground">
            Paso {paso} de {pasos.length}
          </span>

          <button
            onClick={siguiente}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-gradient text-white text-sm font-semibold hover:scale-105 transition-transform"
          >
            {paso === pasos.length - 1 ? 'Ir al pago' : 'Siguiente'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
