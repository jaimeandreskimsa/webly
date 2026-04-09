'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2, Briefcase, Palette, ImagePlus, Phone,
  ChevronRight, ChevronLeft, Check, Loader2, CreditCard, Zap
} from 'lucide-react'
import { StepNegocio } from './steps/StepNegocio'
import { StepServicios } from './steps/StepServicios'
import { StepDiseno } from './steps/StepDiseno'
import { StepMedia } from './steps/StepMedia'
import { StepContacto } from './steps/StepContacto'
import { StepResumenPago } from './steps/StepResumenPago'
import { StepPropiedades, type PropiedadWizard } from './steps/StepPropiedades'
import { cn, formatCLP, PLAN_PRECIOS, type PlanId } from '@/lib/utils'

export interface DatosWizard {
  plan: PlanId
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
  { id: 1, titulo: 'Pagar',           icon: CreditCard, descripcion: 'Confirma tu plan' },
  { id: 2, titulo: 'Tu inmobiliaria', icon: Building2,  descripcion: 'Info básica de tu empresa' },
  { id: 3, titulo: 'Servicios',       icon: Briefcase,  descripcion: 'Qué ofrece tu inmobiliaria' },
  { id: 4, titulo: 'Propiedades',     icon: Building2,  descripcion: 'Propiedades iniciales del portal' },
  { id: 5, titulo: 'Diseño',          icon: Palette,    descripcion: 'Estilo visual' },
  { id: 6, titulo: 'Imágenes',        icon: ImagePlus,  descripcion: 'Logo y fotos de la empresa' },
  { id: 7, titulo: 'Contacto',        icon: Phone,      descripcion: 'Datos de contacto' },
]

const pasosDefault = [
  { id: 1, titulo: 'Pagar',      icon: CreditCard, descripcion: 'Confirma tu plan' },
  { id: 2, titulo: 'Tu negocio', icon: Building2,  descripcion: 'Info básica de tu empresa' },
  { id: 3, titulo: 'Servicios',  icon: Briefcase,  descripcion: 'Qué ofreces' },
  { id: 4, titulo: 'Diseño',     icon: Palette,    descripcion: 'Estilo visual' },
  { id: 5, titulo: 'Imágenes',   icon: ImagePlus,  descripcion: 'Logo y fotos' },
  { id: 6, titulo: 'Contacto',   icon: Phone,      descripcion: 'Datos de contacto' },
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
  sitiosReferencia: ['', ''],
  propiedadesIniciales: [],
}

interface WizardCreacionProps {
  planInicial: string
  userId: string
  planPagado?: string | null   // usuario ya pagó este plan → saltar paso de pago
  isAdmin?: boolean            // admin puede generar sin pago
}

export function WizardCreacion({ planInicial, userId, planPagado, isAdmin }: WizardCreacionProps) {
  const puedeCrearSinPago = !!planPagado || !!isAdmin
  const router = useRouter()
  // Si ya pagó o es admin, saltar step 1 (resumen de pago) e ir directo al negocio
  const [paso, setPaso] = useState(puedeCrearSinPago ? 2 : 1)
  const [datos, setDatos] = useState<DatosWizard>({ ...datosIniciales, plan: (planInicial as DatosWizard['plan']) ?? 'pro' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const pasos = planInicial === 'broker' ? pasosBroker : pasosDefault
  const esUltimoPaso = paso === pasos.length

  function actualizarDatos(nuevos: Partial<DatosWizard>) {
    setDatos(prev => ({ ...prev, ...nuevos }))
  }

  function irAPaso(numeroPaso: number) {
    const minPaso = puedeCrearSinPago ? 2 : 1
    if (numeroPaso < minPaso || numeroPaso > pasos.length) return
    setError('')
    setPaso(numeroPaso)
  }

  function siguiente() {
    if (paso === 2 && !datos.nombreEmpresa.trim()) {
      setError('El nombre de tu empresa es requerido para continuar')
      return
    }
    setError('')
    if (paso < pasos.length) setPaso(p => p + 1)
  }

  function anterior() {
    const minPaso = puedeCrearSinPago ? 2 : 1
    if (paso > minPaso) {
      setError('')
      setPaso(p => p - 1)
    }
  }

  async function generarSinPago() {
    if (!datos.nombreEmpresa.trim()) {
      setError('El nombre de tu empresa es requerido')
      return
    }
    setLoading(true)
    setError('')
    try {
      const resSitio = await fetch('/api/sitios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: datos.nombreEmpresa, plan: datos.plan, contenidoJson: datos }),
      })
      if (!resSitio.ok) {
        const e = await resSitio.json().catch(() => ({}))
        throw new Error(e.error || 'Error al crear el sitio')
      }
      const { sitio } = await resSitio.json()
      // El GET /api/generar arranca la generación en background automáticamente.
      // No hace falta activar manualmente el sitio.
      router.push(`/dashboard/sitios/${sitio.id}/generando`)
    } catch (err: any) {
      setError(err.message || 'Error al procesar. Intenta de nuevo.')
      setLoading(false)
    }
  }

  async function iniciarPago() {
    if (!datos.nombreEmpresa.trim()) {
      setError('El nombre de tu empresa es requerido antes de pagar')
      return
    }
    setLoading(true)
    setError('')
    try {
      const resSitio = await fetch('/api/sitios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: datos.nombreEmpresa, plan: datos.plan, contenidoJson: datos }),
      })
      if (!resSitio.ok) {
        const e = await resSitio.json().catch(() => ({}))
        throw new Error(e.error || 'Error al crear el sitio')
      }
      const { sitio } = await resSitio.json()

      const resPago = await fetch('/api/pagos/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: datos.plan, sitioId: sitio.id, nombreEmpresa: datos.nombreEmpresa }),
      })
      const dataPago = await resPago.json().catch(() => ({}))
      if (!resPago.ok) throw new Error(dataPago.error || 'Error al procesar el pago')

      window.location.href = dataPago.checkoutUrl
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
            const isReachable = p.id <= paso && (!puedeCrearSinPago || p.id >= 2)

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
                    ? 'bg-indigo-500 glow-purple group-hover:bg-indigo-400'
                    : isCurrent
                    ? 'bg-indigo-500/20 border-2 border-indigo-500'
                    : isReachable
                    ? 'bg-white/5 border border-white/10 group-hover:border-indigo-500/40 group-hover:bg-indigo-500/10'
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

      {/* Contenido del paso */}
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

        {paso === 1 && <StepResumenPago datos={datos} />}
        {paso === 2 && <StepNegocio datos={datos} onChange={actualizarDatos} />}
        {paso === 3 && <StepServicios datos={datos} onChange={actualizarDatos} />}

        {paso === 4 && datos.plan === 'broker' && <StepPropiedades datos={datos} onChange={actualizarDatos} />}
        {paso === 4 && datos.plan !== 'broker' && <StepDiseno datos={datos} onChange={actualizarDatos} plan={datos.plan} />}

        {paso === 5 && datos.plan === 'broker' && <StepDiseno datos={datos} onChange={actualizarDatos} plan={datos.plan} />}
        {paso === 5 && datos.plan !== 'broker' && <StepMedia datos={datos} onChange={actualizarDatos} plan={datos.plan} />}

        {paso === 6 && datos.plan === 'broker' && <StepMedia datos={datos} onChange={actualizarDatos} plan={datos.plan} />}
        {paso === 6 && datos.plan !== 'broker' && <StepContacto datos={datos} onChange={actualizarDatos} />}

        {paso === 7 && datos.plan === 'broker' && <StepContacto datos={datos} onChange={actualizarDatos} />}
      </div>

      {/* Navegación */}
      <div className="space-y-3">
        {/* Dev mode: skip pago (solo en desarrollo y el usuario no está exento de pago) */}
        {esUltimoPaso && !puedeCrearSinPago && process.env.NODE_ENV === 'development' && (
          <div className="rounded-xl border border-dashed border-yellow-500/40 bg-yellow-500/5 p-4 space-y-3">
            <div className="flex items-center gap-2 text-yellow-400 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5" />
              MODO LOCAL — Saltar pago
            </div>
            <button
              onClick={generarSinPago}
              disabled={loading}
              className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-300 font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 text-sm disabled:opacity-50 transition-all"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
                : <><Zap className="w-4 h-4" /> Generar sin pago (modo local)</>
              }
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={anterior}
            disabled={paso === (puedeCrearSinPago ? 2 : 1) || loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass glass-hover text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>

          <span className="text-xs text-muted-foreground">
            Paso {paso} de {pasos.length}
          </span>

          {esUltimoPaso ? (
            puedeCrearSinPago ? (
              <button
                onClick={generarSinPago}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl btn-gradient text-white text-sm font-bold hover:scale-105 transition-transform glow-purple disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando sitio...</>
                  : <><Zap className="w-4 h-4" /> Crear sitio</>
                }
              </button>
            ) : (
              <button
                onClick={iniciarPago}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl btn-gradient text-white text-sm font-bold hover:scale-105 transition-transform glow-purple disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</>
                  : <><CreditCard className="w-4 h-4" /> Pagar {formatCLP(PLAN_PRECIOS[datos.plan as keyof typeof PLAN_PRECIOS])}</>
                }
              </button>
            )
          ) : (
            <button
              onClick={siguiente}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-gradient text-white text-sm font-semibold hover:scale-105 transition-transform disabled:opacity-50"
            >
              {paso === 1 ? 'Empezar' : 'Siguiente'}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
