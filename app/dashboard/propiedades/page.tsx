'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2, Plus, Pencil, Trash2, Star, StarOff,
  Loader2, RefreshCw, X, Check, Upload, Home,
  Maximize2, Bath, Car, MapPin, ImagePlus,
  AlertCircle, CheckCircle2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Propiedad {
  id: string
  titulo: string
  descripcion: string | null
  precio: number | null
  moneda: string
  tipo: string
  tipoPropiedad: string
  superficie: number | null
  habitaciones: number | null
  banos: number | null
  estacionamientos: number | null
  ubicacion: string | null
  ciudad: string | null
  imagenes: string[]
  destacada: boolean
  activa: boolean
  createdAt: string
}

const tiposPropiedad = ['casa', 'departamento', 'oficina', 'local', 'terreno', 'bodega', 'parcela']
const tiposOperacion = ['venta', 'arriendo']
const monedas = ['CLP', 'UF', 'USD']

const propiedadVacia = (): Partial<Propiedad> => ({
  titulo: '',
  descripcion: '',
  precio: undefined,
  moneda: 'UF',
  tipo: 'venta',
  tipoPropiedad: 'casa',
  superficie: undefined,
  habitaciones: undefined,
  banos: undefined,
  estacionamientos: undefined,
  ubicacion: '',
  ciudad: '',
  imagenes: [],
  destacada: false,
})

export default function PropiedadesPage() {
  const [propiedades, setPropiedades] = useState<Propiedad[]>([])
  const [cargando, setCargando] = useState(true)
  const [publicando, setPublicando] = useState(false)
  const [modal, setModal] = useState<'crear' | 'editar' | null>(null)
  const [propiedadActual, setPropiedadActual] = useState<Partial<Propiedad>>(propiedadVacia())
  const [guardando, setGuardando] = useState(false)
  const [uploadingImg, setUploadingImg] = useState(false)
  const [notif, setNotif] = useState<{ tipo: 'ok' | 'error'; msg: string } | null>(null)

  const mostrarNotif = (tipo: 'ok' | 'error', msg: string) => {
    setNotif({ tipo, msg })
    setTimeout(() => setNotif(null), 4000)
  }

  const cargarPropiedades = useCallback(async () => {
    setCargando(true)
    try {
      const res = await fetch('/api/propiedades')
      const data = await res.json()
      if (data.propiedades) setPropiedades(data.propiedades)
    } catch {
      mostrarNotif('error', 'Error al cargar propiedades')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargarPropiedades() }, [cargarPropiedades])

  const abrirCrear = () => {
    setPropiedadActual(propiedadVacia())
    setModal('crear')
  }

  const abrirEditar = (p: Propiedad) => {
    setPropiedadActual({ ...p })
    setModal('editar')
  }

  const cerrarModal = () => {
    setModal(null)
    setPropiedadActual(propiedadVacia())
  }

  const guardar = async () => {
    if (!propiedadActual.titulo?.trim()) {
      mostrarNotif('error', 'El título es requerido')
      return
    }
    setGuardando(true)
    try {
      const url = modal === 'editar' && propiedadActual.id
        ? `/api/propiedades/${propiedadActual.id}`
        : '/api/propiedades'
      const method = modal === 'editar' ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(propiedadActual),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar')

      mostrarNotif('ok', modal === 'editar' ? 'Propiedad actualizada' : 'Propiedad creada')
      cerrarModal()
      await cargarPropiedades()
    } catch (e: any) {
      mostrarNotif('error', e.message)
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar esta propiedad? Esta acción no se puede deshacer.')) return
    try {
      const res = await fetch(`/api/propiedades/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      mostrarNotif('ok', 'Propiedad eliminada')
      await cargarPropiedades()
    } catch {
      mostrarNotif('error', 'Error al eliminar')
    }
  }

  const toggleDestacada = async (p: Propiedad) => {
    try {
      await fetch(`/api/propiedades/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destacada: !p.destacada }),
      })
      await cargarPropiedades()
    } catch {
      mostrarNotif('error', 'Error al actualizar')
    }
  }

  const publicar = async () => {
    setPublicando(true)
    try {
      const res = await fetch('/api/propiedades/publicar', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al publicar')

      if (data.publicado) {
        mostrarNotif('ok', `✅ Sitio actualizado y publicado con ${data.propiedades} propiedades`)
      } else {
        mostrarNotif('ok', data.mensaje || 'HTML actualizado correctamente')
      }
    } catch (e: any) {
      mostrarNotif('error', e.message)
    } finally {
      setPublicando(false)
    }
  }

  const uploadImagen = async (file: File) => {
    if (!file) return
    setUploadingImg(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('tipo', 'propiedades')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al subir imagen')
      setPropiedadActual(prev => ({
        ...prev,
        imagenes: [...(prev.imagenes || []), data.url],
      }))
    } catch (e: any) {
      mostrarNotif('error', e.message)
    } finally {
      setUploadingImg(false)
    }
  }

  const eliminarImagen = (url: string) => {
    setPropiedadActual(prev => ({
      ...prev,
      imagenes: (prev.imagenes || []).filter(img => img !== url),
    }))
  }

  const setField = (k: keyof Propiedad, v: any) =>
    setPropiedadActual(prev => ({ ...prev, [k]: v }))

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Notificación */}
      {notif && (
        <div className={cn(
          'fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium shadow-xl transition-all',
          notif.tipo === 'ok'
            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
            : 'bg-red-500/20 border-red-500/40 text-red-300'
        )}>
          {notif.tipo === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {notif.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-400" />
            Mis Propiedades
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona el catálogo de tu portal inmobiliario
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={publicar}
            disabled={publicando || propiedades.length === 0}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all',
              'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
              'hover:bg-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          >
            {publicando
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <RefreshCw className="w-4 h-4" />
            }
            Actualizar propiedades en la web
          </button>
          <button
            onClick={abrirCrear}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva propiedad
          </button>
        </div>
      </div>

      {/* Contador */}
      <div className="flex gap-4 mb-6">
        <div className="glass rounded-xl px-4 py-3 border border-white/5">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-bold text-white">{propiedades.length}</p>
        </div>
        <div className="glass rounded-xl px-4 py-3 border border-white/5">
          <p className="text-xs text-muted-foreground">Destacadas</p>
          <p className="text-2xl font-bold text-amber-400">{propiedades.filter(p => p.destacada).length}</p>
        </div>
        <div className="glass rounded-xl px-4 py-3 border border-white/5">
          <p className="text-xs text-muted-foreground">Venta</p>
          <p className="text-2xl font-bold text-blue-400">{propiedades.filter(p => p.tipo === 'venta').length}</p>
        </div>
        <div className="glass rounded-xl px-4 py-3 border border-white/5">
          <p className="text-xs text-muted-foreground">Arriendo</p>
          <p className="text-2xl font-bold text-violet-400">{propiedades.filter(p => p.tipo === 'arriendo').length}</p>
        </div>
      </div>

      {/* Lista */}
      {cargando ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        </div>
      ) : propiedades.length === 0 ? (
        <div className="glass border border-white/5 rounded-2xl flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-white font-medium">No tienes propiedades aún</p>
          <p className="text-sm text-muted-foreground mt-1">Crea tu primera propiedad para que aparezca en tu portal</p>
          <button
            onClick={abrirCrear}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            Crear propiedad
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {propiedades.map(p => (
            <div key={p.id} className="glass border border-white/5 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all group">
              {/* Imagen placeholder */}
              <div className="h-36 bg-gradient-to-br from-emerald-900/30 to-slate-800/50 relative">
                {p.imagenes?.[0] ? (
                  <img src={p.imagenes[0]} alt={p.titulo} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Home className="w-10 h-10 text-emerald-700" />
                  </div>
                )}
                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-1.5">
                  <span className={cn(
                    'text-xs font-semibold px-2 py-0.5 rounded-full',
                    p.tipo === 'venta' ? 'bg-blue-500/80 text-white' : 'bg-violet-500/80 text-white'
                  )}>
                    {p.tipo === 'venta' ? 'Venta' : 'Arriendo'}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-700/80 text-slate-200 capitalize">
                    {p.tipoPropiedad}
                  </span>
                </div>
                {p.destacada && (
                  <div className="absolute top-2 right-2">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-white text-sm leading-tight mb-1">{p.titulo}</h3>
                {p.ciudad && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                    <MapPin className="w-3 h-3" /> {p.ciudad}
                  </p>
                )}
                {p.precio && (
                  <p className="text-emerald-400 font-bold text-sm mb-2">
                    {p.moneda === 'CLP'
                      ? `$ ${p.precio.toLocaleString('es-CL')}`
                      : `${p.precio.toLocaleString()} ${p.moneda}`
                    }
                  </p>
                )}
                {/* Detalles */}
                <div className="flex gap-3 text-xs text-muted-foreground mb-4">
                  {p.habitaciones && <span className="flex items-center gap-1"><Home className="w-3 h-3" />{p.habitaciones}</span>}
                  {p.banos && <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{p.banos}</span>}
                  {p.superficie && <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3" />{p.superficie}m²</span>}
                  {p.estacionamientos && <span className="flex items-center gap-1"><Car className="w-3 h-3" />{p.estacionamientos}</span>}
                </div>
                {/* Acciones */}
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleDestacada(p)}
                    title={p.destacada ? 'Quitar destacada' : 'Marcar destacada'}
                    className={cn(
                      'p-1.5 rounded-lg border transition-all',
                      p.destacada
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                        : 'border-white/10 text-muted-foreground hover:text-amber-400'
                    )}
                  >
                    {p.destacada ? <Star className="w-3.5 h-3.5 fill-amber-400" /> : <StarOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => abrirEditar(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs font-medium text-slate-300 hover:bg-white/5 transition-all"
                  >
                    <Pencil className="w-3 h-3" /> Editar
                  </button>
                  <button
                    onClick={() => eliminar(p.id)}
                    className="p-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          onClick={e => { if (e.target === e.currentTarget) cerrarModal() }}
        >
          <div className="w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-700" style={{ backgroundColor: '#111827' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                {modal === 'crear' ? 'Nueva propiedad' : 'Editar propiedad'}
              </h2>
              <button
                onClick={cerrarModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5 max-h-[75vh] overflow-y-auto">

              {/* Título */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Título *</label>
                <input
                  type="text"
                  value={propiedadActual.titulo || ''}
                  onChange={e => setField('titulo', e.target.value)}
                  placeholder="Ej: Departamento 3D/2B en Providencia con vista al parque"
                  autoFocus
                  className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border border-slate-600 bg-slate-800"
                />
              </div>

              {/* Operación + Tipo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Operación</label>
                  <div className="flex gap-2">
                    {(['venta', 'arriendo'] as const).map(op => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => setField('tipo', op)}
                        className={cn(
                          'flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all capitalize',
                          propiedadActual.tipo === op
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'
                        )}
                      >
                        {op}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Tipo propiedad</label>
                  <select
                    value={propiedadActual.tipoPropiedad || 'casa'}
                    onChange={e => setField('tipoPropiedad', e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border border-slate-600 bg-slate-800"
                  >
                    {tiposPropiedad.map(t => (
                      <option key={t} value={t} className="bg-slate-800">
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Precio + Moneda */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Precio</label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={propiedadActual.precio || ''}
                    onChange={e => setField('precio', e.target.value ? Number(e.target.value) : null)}
                    placeholder="Ej: 3500"
                    className="flex-1 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border border-slate-600 bg-slate-800"
                  />
                  <div className="flex gap-1.5">
                    {(['UF', 'CLP', 'USD'] as const).map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setField('moneda', m)}
                        className={cn(
                          'px-3 rounded-xl text-xs font-bold border transition-all',
                          propiedadActual.moneda === m
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Características numéricas */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Características</label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { key: 'habitaciones', label: 'Dormitorios', icon: Home },
                    { key: 'banos', label: 'Baños', icon: Bath },
                    { key: 'superficie', label: 'M²', icon: Maximize2 },
                    { key: 'estacionamientos', label: 'Estac.', icon: Car },
                  ].map(({ key, label, icon: Icon }) => (
                    <div key={key} className="relative">
                      <div className="flex items-center gap-1 text-xs text-slate-500 mb-1.5">
                        <Icon className="w-3 h-3" /> {label}
                      </div>
                      <input
                        type="number"
                        min={0}
                        value={(propiedadActual as any)[key] || ''}
                        onChange={e => setField(key as keyof Propiedad, e.target.value ? Number(e.target.value) : null)}
                        className="w-full rounded-xl px-3 py-2.5 text-sm text-white text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border border-slate-600 bg-slate-800"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Ciudad + Dirección */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Ciudad / Comuna</label>
                  <input
                    type="text"
                    value={propiedadActual.ciudad || ''}
                    onChange={e => setField('ciudad', e.target.value)}
                    placeholder="Santiago"
                    className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border border-slate-600 bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Dirección / Sector</label>
                  <input
                    type="text"
                    value={propiedadActual.ubicacion || ''}
                    onChange={e => setField('ubicacion', e.target.value)}
                    placeholder="Av. Providencia 1234"
                    className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border border-slate-600 bg-slate-800"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Descripción</label>
                <textarea
                  value={propiedadActual.descripcion || ''}
                  onChange={e => setField('descripcion', e.target.value)}
                  rows={3}
                  placeholder="Describe las características principales, entorno, condiciones, etc."
                  className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border border-slate-600 bg-slate-800 resize-none"
                />
              </div>

              {/* Imágenes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Imágenes</label>
                  <span className="text-xs text-slate-500">
                    {(propiedadActual.imagenes || []).length}/7
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(propiedadActual.imagenes || []).map((url, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-600 group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      {i === 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-xs text-center py-0.5 text-slate-300">
                          Principal
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => eliminarImagen(url)}
                        className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  ))}
                  {(propiedadActual.imagenes || []).length < 7 && (
                    <label className={cn(
                      'w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all text-xs text-slate-500 gap-1',
                      uploadingImg
                        ? 'border-emerald-500/50 bg-emerald-500/5 cursor-wait'
                        : 'border-slate-600 hover:border-emerald-500/50 hover:bg-emerald-500/5 hover:text-emerald-400'
                    )}>
                      {uploadingImg
                        ? <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                        : <><Upload className="w-5 h-5" /><span>Subir</span></>
                      }
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingImg}
                        onChange={e => { if (e.target.files?.[0]) uploadImagen(e.target.files[0]) }}
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-slate-600">JPG, PNG, WebP · máx. 5 MB · la primera imagen es la principal</p>
              </div>

              {/* Destacada toggle */}
              <div
                onClick={() => setField('destacada', !propiedadActual.destacada)}
                className={cn(
                  'flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all',
                  propiedadActual.destacada
                    ? 'border-amber-500/40 bg-amber-500/10'
                    : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                )}
              >
                <div className="flex items-center gap-3">
                  <Star className={cn('w-5 h-5', propiedadActual.destacada ? 'text-amber-400 fill-amber-400' : 'text-slate-500')} />
                  <div>
                    <p className="text-sm font-medium text-white">Propiedad destacada</p>
                    <p className="text-xs text-slate-500">Aparece primero en el portal y en la sección de destacadas</p>
                  </div>
                </div>
                <div className={cn(
                  'w-10 h-6 rounded-full transition-colors relative shrink-0',
                  propiedadActual.destacada ? 'bg-amber-500' : 'bg-slate-600'
                )}>
                  <div className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow',
                    propiedadActual.destacada ? 'left-5' : 'left-1'
                  )} />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/60">
              <p className="text-xs text-slate-500">* Campo obligatorio</p>
              <div className="flex gap-3">
                <button
                  onClick={cerrarModal}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white border border-slate-600 hover:bg-slate-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardar}
                  disabled={guardando || !propiedadActual.titulo?.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {guardando
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                    : <><Check className="w-4 h-4" /> {modal === 'crear' ? 'Crear propiedad' : 'Guardar cambios'}</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
