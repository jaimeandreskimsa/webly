'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2, Sparkles, ArrowLeft, ArrowRight, MessageSquare,
  AlertTriangle, Building2, Briefcase, Palette, ImagePlus,
  Phone, CheckCircle2, RefreshCw, Save, Wand2,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Sitio } from '@/lib/db/schema'
import type { DatosWizard } from '@/components/wizard/WizardCreacion'
import { StepNegocio } from '@/components/wizard/steps/StepNegocio'
import { StepServicios } from '@/components/wizard/steps/StepServicios'
import { StepDiseno } from '@/components/wizard/steps/StepDiseno'
import { StepMedia } from '@/components/wizard/steps/StepMedia'
import { StepContacto } from '@/components/wizard/steps/StepContacto'

interface EditorSitioProps {
  sitio: Sitio
  edicionesUsadas: number
  limiteEdiciones: number
}

// ─── Pasos del wizard de edición (sin pago) ──────────────────────────────────
const PASOS = [
  { id: 1, icon: Building2, titulo: 'Negocio',   descripcion: 'Nombre, rubro y descripción de tu empresa' },
  { id: 2, icon: Briefcase, titulo: 'Servicios', descripcion: 'Los servicios o productos que ofreces' },
  { id: 3, icon: Palette,   titulo: 'Diseño',    descripcion: 'Estilo visual, colores y tipografía' },
  { id: 4, icon: ImagePlus, titulo: 'Imágenes',  descripcion: 'Logo, fotos y multimedia' },
  { id: 5, icon: Phone,     titulo: 'Contacto',  descripcion: 'Teléfono, email y redes sociales' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parsePlan(p: string | null | undefined): DatosWizard['plan'] {
  if (p === 'basico' || p === 'pro' || p === 'premium' || p === 'broker') return p
  return 'pro'
}

export function EditorSitio({ sitio, edicionesUsadas, limiteEdiciones }: EditorSitioProps) {
  const router = useRouter()
  const restantes = limiteEdiciones - edicionesUsadas

  // ─── Tab activo ──────────────────────────────────────────────────────────
  const [tab, setTab] = useState<'secciones' | 'ia'>('secciones')

  // ─── Estado wizard de secciones ─────────────────────────────────────────
  const existing = (sitio.contenidoJson ?? {}) as Partial<DatosWizard>
  const [paso, setPaso] = useState(1)
  const [datos, setDatos] = useState<DatosWizard>({
    plan: parsePlan(sitio.plan),
    nombreEmpresa: existing.nombreEmpresa ?? sitio.nombre ?? '',
    rubro: existing.rubro ?? '',
    descripcion: existing.descripcion ?? '',
    ciudad: existing.ciudad ?? '',
    estilo: existing.estilo ?? 'moderno',
    servicios: existing.servicios?.length
      ? existing.servicios
      : [{ nombre: '', descripcion: '', precio: '' }],
    propuestaValor: existing.propuestaValor ?? '',
    marcaAnalizada: existing.marcaAnalizada ?? null,
    coloresPrimarios: existing.coloresPrimarios ?? '#6366f1',
    coloresSecundarios: existing.coloresSecundarios ?? '#a855f7',
    tipoDiseno: existing.tipoDiseno ?? 'moderno',
    tipografia: existing.tipografia ?? 'inter',
    logo: existing.logo,
    imagenes: existing.imagenes ?? [],
    imagenesIA: existing.imagenesIA ?? [],
    videoUrl: existing.videoUrl,
    telefono: existing.telefono ?? '',
    email: existing.email ?? '',
    direccion: existing.direccion ?? '',
    horario: existing.horario ?? '',
    redesSociales: existing.redesSociales ?? {},
    sitiosReferencia: existing.sitiosReferencia ?? ['', ''],
    propiedadesIniciales: existing.propiedadesIniciales ?? [],
  })
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [errorWizard, setErrorWizard] = useState('')

  function actualizarDatos(parcial: Partial<DatosWizard>) {
    setDatos(prev => ({ ...prev, ...parcial }))
    setGuardado(false)
  }

  async function guardarDatos() {
    setGuardando(true)
    setErrorWizard('')
    try {
      const res = await fetch(`/api/sitios/${sitio.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: datos.nombreEmpresa || sitio.nombre,
          contenidoJson: datos,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Error al guardar')
      }
      setGuardado(true)
    } catch (err: any) {
      setErrorWizard(err.message || 'Error al guardar los datos')
    } finally {
      setGuardando(false)
    }
  }

  async function guardarYRegenerar() {
    setGuardando(true)
    setErrorWizard('')
    try {
      const res = await fetch(`/api/sitios/${sitio.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: datos.nombreEmpresa || sitio.nombre,
          contenidoJson: datos,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Error al guardar')
      }
      router.push(`/dashboard/sitios/${sitio.id}/generando`)
    } catch (err: any) {
      setErrorWizard(err.message || 'Error al iniciar la regeneración')
      setGuardando(false)
    }
  }

  // ─── Estado IA libre ─────────────────────────────────────────────────────
  const [instrucciones, setInstrucciones] = useState('')
  const [generandoIA, setGenerandoIA] = useState(false)
  const [errorIA, setErrorIA] = useState('')
  const [exitoIA, setExitoIA] = useState(false)

  async function aplicarCambiosIA() {
    if (!instrucciones.trim()) {
      setErrorIA('Escribe los cambios que deseas realizar')
      return
    }
    setGenerandoIA(true)
    setErrorIA('')
    try {
      const res = await fetch('/api/generar/editar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sitioId: sitio.id, instrucciones: instrucciones.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al aplicar cambios')
      }
      setExitoIA(true)
      setTimeout(() => {
        router.push(`/dashboard/sitios/${sitio.id}`)
        router.refresh()
      }, 1500)
    } catch (err: any) {
      setErrorIA(err.message || 'Error inesperado')
    } finally {
      setGenerandoIA(false)
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Ediciones counter */}
      <div className="glass rounded-xl border border-white/5 p-4 flex items-center justify-between">
        <div>
          <span className="text-sm font-medium">
            Ediciones disponibles:{' '}
            <span className="text-indigo-400">{restantes}</span> de {limiteEdiciones}
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
                i < edicionesUsadas ? 'bg-indigo-500' : 'bg-white/10 border border-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 glass rounded-xl border border-white/5">
        <TabBtn
          active={tab === 'secciones'}
          onClick={() => setTab('secciones')}
          icon={Building2}
          label="Editar secciones"
        />
        <TabBtn
          active={tab === 'ia'}
          onClick={() => setTab('ia')}
          icon={Wand2}
          label="Cambios con IA"
          badge={`${restantes}`}
        />
      </div>

      {/* ── Tab: Secciones ──────────────────────────────────────────────── */}
      {tab === 'secciones' && (
        <div className="space-y-5">
          {/* Barra de pasos */}
          <div className="glass rounded-2xl border border-white/5 p-5">
            <div className="relative mb-5">
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${((paso - 1) / (PASOS.length - 1)) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex items-start justify-between">
              {PASOS.map(p => {
                const isCompleted = paso > p.id
                const isCurrent   = paso === p.id
                const isReachable = p.id <= paso
                return (
                  <button
                    key={p.id}
                    onClick={() => isReachable && !guardando && setPaso(p.id)}
                    disabled={!isReachable || guardando}
                    title={p.titulo}
                    className={cn(
                      'flex flex-col items-center gap-1.5 flex-1 transition-all',
                      isReachable && !guardando ? 'cursor-pointer' : 'cursor-default',
                      !isReachable && 'opacity-40',
                    )}
                  >
                    <div className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300',
                      isCompleted
                        ? 'bg-indigo-500 hover:bg-indigo-400'
                        : isCurrent
                        ? 'bg-indigo-500/20 border-2 border-indigo-500'
                        : 'bg-white/5 border border-white/10',
                    )}>
                      {isCompleted
                        ? <CheckCircle2 className="w-4 h-4 text-white" />
                        : <p.icon className={cn('w-4 h-4', isCurrent ? 'text-indigo-400' : 'text-muted-foreground')} />
                      }
                    </div>
                    <span className={cn(
                      'text-xs font-medium hidden sm:block text-center',
                      isCurrent    ? 'text-indigo-300'
                      : isCompleted ? 'text-white'
                      : 'text-muted-foreground',
                    )}>
                      {p.titulo}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Contenido del paso */}
          <div className="glass rounded-2xl border border-white/5 p-6 min-h-[340px]">
            <div className="mb-5">
              <h2 className="text-lg font-bold">{PASOS[paso - 1].titulo}</h2>
              <p className="text-muted-foreground text-sm">{PASOS[paso - 1].descripcion}</p>
            </div>
            {paso === 1 && <StepNegocio   datos={datos} onChange={actualizarDatos} />}
            {paso === 2 && <StepServicios datos={datos} onChange={actualizarDatos} />}
            {paso === 3 && <StepDiseno    datos={datos} onChange={actualizarDatos} plan={datos.plan} />}
            {paso === 4 && (
              <StepMedia
                datos={datos}
                onChange={actualizarDatos}
                plan={parsePlan(datos.plan)}
              />
            )}
            {paso === 5 && <StepContacto  datos={datos} onChange={actualizarDatos} />}
          </div>

          {errorWizard && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {errorWizard}
            </div>
          )}
          {guardado && !errorWizard && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Datos guardados. Puedes seguir editando o regenerar el sitio.
            </div>
          )}

          {/* Navegación */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Link
              href={`/dashboard/sitios/${sitio.id}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass glass-hover text-sm text-muted-foreground hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Cancelar
            </Link>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              {paso > 1 && (
                <button
                  onClick={() => setPaso(p => p - 1)}
                  disabled={guardando}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl glass glass-hover text-sm disabled:opacity-40"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Anterior
                </button>
              )}

              {paso < PASOS.length ? (
                <button
                  onClick={() => setPaso(p => p + 1)}
                  disabled={guardando}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-gradient text-white text-sm font-semibold hover:scale-105 transition-transform disabled:opacity-50"
                >
                  Siguiente
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <button
                    onClick={guardarDatos}
                    disabled={guardando}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass glass-hover border border-white/10 text-sm font-medium disabled:opacity-40"
                  >
                    {guardando
                      ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</>
                      : <><Save className="w-4 h-4" />Guardar datos</>
                    }
                  </button>
                  <button
                    onClick={guardarYRegenerar}
                    disabled={guardando || restantes === 0}
                    title={restantes === 0 ? 'Sin ediciones disponibles' : undefined}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-gradient text-white text-sm font-bold hover:scale-105 transition-transform glow-purple disabled:opacity-50 disabled:scale-100"
                  >
                    {guardando
                      ? <><Loader2 className="w-4 h-4 animate-spin" />Procesando...</>
                      : <><RefreshCw className="w-4 h-4" />Guardar y regenerar</>
                    }
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: IA libre ───────────────────────────────────────────────── */}
      {tab === 'ia' && (
        <div className="space-y-5">
          <div className="glass rounded-2xl border border-white/5 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="font-bold text-base">¿Qué quieres cambiar?</h2>
                <p className="text-xs text-muted-foreground">
                  Describe los cambios y nuestro agente IA los aplicará directamente al HTML
                </p>
              </div>
            </div>

            <textarea
              value={instrucciones}
              onChange={e => setInstrucciones(e.target.value)}
              placeholder="Ejemplo: Cambia el color principal a azul marino, agrega un servicio llamado 'Consultoría digital' con precio $50.000, cambia la foto del hero por algo más moderno, agranda el botón de WhatsApp..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 min-h-[200px] resize-y leading-relaxed"
              disabled={generandoIA}
            />

            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-white/3 rounded-lg px-3 py-2.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400/70" />
              <p>
                Puedes pedir cambios de colores, textos, imágenes, estructura, agregar o quitar secciones y más.
                Sé lo más específico posible.{' '}
                <span className="text-amber-300/70 font-medium">Consume 1 edición del plan.</span>
              </p>
            </div>
          </div>

          {errorIA && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {errorIA}
            </div>
          )}
          {exitoIA && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              ¡Cambios aplicados! Redirigiendo...
            </div>
          )}
          {generandoIA && (
            <div className="glass rounded-xl border border-indigo-500/30 p-4 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
              <div>
                <p className="font-medium text-sm">Aplicando tus cambios con IA...</p>
                <p className="text-xs text-muted-foreground">Esto puede tomar 30–90 segundos</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Link
              href={`/dashboard/sitios/${sitio.id}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass glass-hover text-sm text-muted-foreground hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Cancelar
            </Link>
            <button
              onClick={aplicarCambiosIA}
              disabled={generandoIA || !instrucciones.trim() || restantes === 0}
              className="flex items-center gap-2 btn-gradient text-white font-semibold px-6 py-2.5 rounded-xl text-sm disabled:opacity-50 hover:scale-105 transition-transform"
            >
              {generandoIA
                ? <><Loader2 className="w-4 h-4 animate-spin" />Aplicando cambios...</>
                : <><Wand2 className="w-4 h-4" />Aplicar cambios ({restantes} restantes)</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab Button ──────────────────────────────────────────────────────────────
function TabBtn({
  active, onClick, icon: Icon, label, badge,
}: {
  active: boolean
  onClick: () => void
  icon: React.ElementType
  label: string
  badge?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all',
        active
          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
          : 'text-muted-foreground hover:text-white hover:bg-white/5',
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
      {badge && (
        <span className="text-xs bg-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded-full font-mono">
          {badge}
        </span>
      )}
    </button>
  )
}
