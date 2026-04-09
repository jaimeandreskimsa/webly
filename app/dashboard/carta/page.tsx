'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  UtensilsCrossed, Plus, Pencil, Trash2, Star, StarOff,
  Loader2, RefreshCw, X, Check, Upload,
  AlertCircle, CheckCircle2, ToggleLeft, ToggleRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Plato {
  id: string
  nombre: string
  descripcion: string | null
  precio: number | null
  categoria: string
  imagen: string | null
  disponible: boolean
  destacado: boolean
  orden: number
  createdAt: string
}

const CATEGORIAS = [
  { value: 'entrada',   label: 'Entradas',      color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/30' },
  { value: 'principal', label: 'Platos de fondo', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
  { value: 'postre',    label: 'Postres',        color: 'text-pink-400',   bg: 'bg-pink-500/10 border-pink-500/30' },
  { value: 'bebida',    label: 'Bebidas',        color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/30' },
  { value: 'otro',      label: 'Otros',          color: 'text-slate-400',  bg: 'bg-slate-500/10 border-slate-500/30' },
]

const platoVacio = (): Partial<Plato> => ({
  nombre: '',
  descripcion: '',
  precio: undefined,
  categoria: 'principal',
  imagen: null,
  disponible: true,
  destacado: false,
  orden: 0,
})

export default function CartaPage() {
  const [platos, setPlatos] = useState<Plato[]>([])
  const [cargando, setCargando] = useState(true)
  const [publicando, setPublicando] = useState(false)
  const [modal, setModal] = useState<'crear' | 'editar' | null>(null)
  const [platoActual, setPlatoActual] = useState<Partial<Plato>>(platoVacio())
  const [guardando, setGuardando] = useState(false)
  const [uploadingImg, setUploadingImg] = useState(false)
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas')
  const [notif, setNotif] = useState<{ tipo: 'ok' | 'error'; msg: string } | null>(null)

  const mostrarNotif = (tipo: 'ok' | 'error', msg: string) => {
    setNotif({ tipo, msg })
    setTimeout(() => setNotif(null), 4000)
  }

  const cargarPlatos = useCallback(async () => {
    setCargando(true)
    try {
      const res = await fetch('/api/platos')
      const data = await res.json()
      if (data.platos) setPlatos(data.platos)
    } catch {
      mostrarNotif('error', 'Error al cargar la carta')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargarPlatos() }, [cargarPlatos])

  const abrirCrear = () => {
    setPlatoActual(platoVacio())
    setModal('crear')
  }

  const abrirEditar = (p: Plato) => {
    setPlatoActual({ ...p })
    setModal('editar')
  }

  const cerrarModal = () => {
    setModal(null)
    setPlatoActual(platoVacio())
  }

  const guardar = async () => {
    if (!platoActual.nombre?.trim()) {
      mostrarNotif('error', 'El nombre del plato es requerido')
      return
    }
    setGuardando(true)
    try {
      const url = modal === 'editar' && platoActual.id
        ? `/api/platos/${platoActual.id}`
        : '/api/platos'
      const method = modal === 'editar' ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(platoActual),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar')

      mostrarNotif('ok', modal === 'editar' ? 'Plato actualizado' : 'Plato añadido a la carta')
      cerrarModal()
      await cargarPlatos()
    } catch (e: any) {
      mostrarNotif('error', e.message)
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar este plato de la carta? Esta acción no se puede deshacer.')) return
    try {
      const res = await fetch(`/api/platos/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      mostrarNotif('ok', 'Plato eliminado')
      await cargarPlatos()
    } catch {
      mostrarNotif('error', 'Error al eliminar')
    }
  }

  const toggleDisponible = async (p: Plato) => {
    try {
      await fetch(`/api/platos/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disponible: !p.disponible }),
      })
      await cargarPlatos()
    } catch {
      mostrarNotif('error', 'Error al actualizar')
    }
  }

  const toggleDestacado = async (p: Plato) => {
    try {
      await fetch(`/api/platos/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destacado: !p.destacado }),
      })
      await cargarPlatos()
    } catch {
      mostrarNotif('error', 'Error al actualizar')
    }
  }

  const publicar = async () => {
    setPublicando(true)
    try {
      const res = await fetch('/api/platos/publicar', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al publicar')

      if (data.publicado) {
        mostrarNotif('ok', `✅ Carta actualizada y publicada con ${data.platos} platos`)
      } else {
        mostrarNotif('ok', data.mensaje || 'Carta actualizada correctamente')
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
      fd.append('tipo', 'platos')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al subir imagen')
      setPlatoActual(prev => ({ ...prev, imagen: data.url }))
    } catch (e: any) {
      mostrarNotif('error', e.message)
    } finally {
      setUploadingImg(false)
    }
  }

  const setField = (k: keyof Plato, v: any) =>
    setPlatoActual(prev => ({ ...prev, [k]: v }))

  const platosFiltrados = categoriaFiltro === 'todas'
    ? platos
    : platos.filter(p => p.categoria === categoriaFiltro)

  const catInfo = (cat: string) => CATEGORIAS.find(c => c.value === cat) ?? CATEGORIAS[4]

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
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-orange-400" />
            Mi Carta
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona el menú de tu restaurante — los cambios se reflejan en tu web al publicar
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={publicar}
            disabled={publicando || platos.length === 0}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all',
              'bg-orange-500/10 border-orange-500/30 text-orange-300',
              'hover:bg-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          >
            {publicando
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <RefreshCw className="w-4 h-4" />
            }
            Publicar carta en la web
          </button>
          <button
            onClick={abrirCrear}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-orange-600 hover:bg-orange-500 text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            Agregar plato
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="glass rounded-xl px-4 py-3 border border-white/5">
          <p className="text-xs text-muted-foreground">Total platos</p>
          <p className="text-2xl font-bold text-white">{platos.length}</p>
        </div>
        <div className="glass rounded-xl px-4 py-3 border border-white/5">
          <p className="text-xs text-muted-foreground">Disponibles</p>
          <p className="text-2xl font-bold text-emerald-400">{platos.filter(p => p.disponible).length}</p>
        </div>
        <div className="glass rounded-xl px-4 py-3 border border-white/5">
          <p className="text-xs text-muted-foreground">Destacados</p>
          <p className="text-2xl font-bold text-amber-400">{platos.filter(p => p.destacado).length}</p>
        </div>
        {CATEGORIAS.map(cat => {
          const count = platos.filter(p => p.categoria === cat.value).length
          if (count === 0) return null
          return (
            <div key={cat.value} className="glass rounded-xl px-4 py-3 border border-white/5">
              <p className="text-xs text-muted-foreground">{cat.label}</p>
              <p className={cn('text-2xl font-bold', cat.color)}>{count}</p>
            </div>
          )
        })}
      </div>

      {/* Filtro por categoría */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setCategoriaFiltro('todas')}
          className={cn(
            'px-4 py-1.5 rounded-full text-xs font-semibold border transition-all',
            categoriaFiltro === 'todas'
              ? 'bg-white/10 border-white/30 text-white'
              : 'border-white/10 text-muted-foreground hover:border-white/20'
          )}
        >
          Todas
        </button>
        {CATEGORIAS.map(cat => (
          <button
            key={cat.value}
            onClick={() => setCategoriaFiltro(cat.value)}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs font-semibold border transition-all',
              categoriaFiltro === cat.value
                ? cn('border', cat.bg, cat.color)
                : 'border-white/10 text-muted-foreground hover:border-white/20'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {cargando ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
        </div>
      ) : platosFiltrados.length === 0 ? (
        <div className="glass border border-white/5 rounded-2xl flex flex-col items-center justify-center py-16 text-center">
          <UtensilsCrossed className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-white font-medium">
            {platos.length === 0 ? 'Tu carta está vacía' : 'No hay platos en esta categoría'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {platos.length === 0
              ? 'Agrega tu primer plato para que aparezca en tu menú online'
              : 'Prueba seleccionando otra categoría o agrega platos aquí'
            }
          </p>
          {platos.length === 0 && (
            <button
              onClick={abrirCrear}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-orange-600 hover:bg-orange-500 text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              Agregar primer plato
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {platosFiltrados.map(p => {
            const cat = catInfo(p.categoria)
            return (
              <div
                key={p.id}
                className={cn(
                  'glass border rounded-2xl overflow-hidden transition-all group',
                  p.disponible ? 'border-white/5 hover:border-orange-500/30' : 'border-white/5 opacity-60'
                )}
              >
                {/* Imagen */}
                <div className="h-32 bg-gradient-to-br from-orange-900/20 to-slate-800/50 relative">
                  {p.imagen ? (
                    <img src={p.imagen} alt={p.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UtensilsCrossed className="w-10 h-10 text-orange-800/60" />
                    </div>
                  )}
                  {/* Badge categoría */}
                  <div className="absolute top-2 left-2">
                    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border', cat.bg, cat.color)}>
                      {cat.label}
                    </span>
                  </div>
                  {/* Badge destacado */}
                  {p.destacado && (
                    <div className="absolute top-2 right-2">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    </div>
                  )}
                  {/* Badge no disponible */}
                  {!p.disponible && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <span className="text-xs font-bold text-white bg-red-500/80 px-2 py-0.5 rounded-full">No disponible</span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-white text-sm leading-tight mb-1">{p.nombre}</h3>
                  {p.descripcion && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{p.descripcion}</p>
                  )}
                  {p.precio && (
                    <p className="text-orange-400 font-bold text-sm mb-3">
                      ${p.precio.toLocaleString('es-CL')}
                    </p>
                  )}

                  {/* Acciones */}
                  <div className="flex gap-2">
                    {/* Toggle disponible */}
                    <button
                      onClick={() => toggleDisponible(p)}
                      title={p.disponible ? 'Marcar no disponible' : 'Marcar disponible'}
                      className={cn(
                        'p-1.5 rounded-lg border transition-all',
                        p.disponible
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                          : 'border-white/10 text-muted-foreground hover:text-emerald-400'
                      )}
                    >
                      {p.disponible
                        ? <ToggleRight className="w-3.5 h-3.5" />
                        : <ToggleLeft className="w-3.5 h-3.5" />
                      }
                    </button>
                    {/* Toggle destacado */}
                    <button
                      onClick={() => toggleDestacado(p)}
                      title={p.destacado ? 'Quitar de destacados' : 'Marcar como destacado'}
                      className={cn(
                        'p-1.5 rounded-lg border transition-all',
                        p.destacado
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                          : 'border-white/10 text-muted-foreground hover:text-amber-400'
                      )}
                    >
                      {p.destacado ? <Star className="w-3.5 h-3.5 fill-amber-400" /> : <StarOff className="w-3.5 h-3.5" />}
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
            )
          })}
        </div>
      )}

      {/* Modal crear/editar */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          onClick={e => { if (e.target === e.currentTarget) cerrarModal() }}
        >
          <div className="w-full max-w-xl rounded-2xl shadow-2xl border border-slate-700" style={{ backgroundColor: '#111827' }}>

            {/* Header modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-orange-400" />
                {modal === 'crear' ? 'Agregar plato' : 'Editar plato'}
              </h2>
              <button
                onClick={cerrarModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body modal */}
            <div className="px-6 py-5 space-y-5 max-h-[75vh] overflow-y-auto">

              {/* Nombre */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Nombre del plato *</label>
                <input
                  type="text"
                  value={platoActual.nombre || ''}
                  onChange={e => setField('nombre', e.target.value)}
                  placeholder="Ej: Lomo saltado, Pisco sour, Ensalada César..."
                  autoFocus
                  className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 border border-slate-600 bg-slate-800"
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Categoría</label>
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIAS.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setField('categoria', cat.value)}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all',
                        platoActual.categoria === cat.value
                          ? cn('border', cat.bg, cat.color)
                          : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Precio */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Precio (CLP)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">$</span>
                  <input
                    type="number"
                    min={0}
                    value={platoActual.precio || ''}
                    onChange={e => setField('precio', e.target.value ? Number(e.target.value) : null)}
                    placeholder="Ej: 12900"
                    className="w-full rounded-xl pl-8 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 border border-slate-600 bg-slate-800"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Descripción</label>
                <textarea
                  value={platoActual.descripcion || ''}
                  onChange={e => setField('descripcion', e.target.value)}
                  rows={3}
                  placeholder="Ingredientes, preparación, sabores destacados..."
                  className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 border border-slate-600 bg-slate-800 resize-none"
                />
              </div>

              {/* Imagen */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Imagen del plato</label>
                {platoActual.imagen ? (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden border border-slate-600 group">
                    <img src={platoActual.imagen} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setField('imagen', null)}
                      className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <X className="w-6 h-6 text-red-400" />
                    </button>
                  </div>
                ) : (
                  <label className={cn(
                    'w-full h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all gap-2',
                    uploadingImg
                      ? 'border-orange-500/50 bg-orange-500/5 cursor-wait'
                      : 'border-slate-600 hover:border-orange-500/50 hover:bg-orange-500/5'
                  )}>
                    {uploadingImg
                      ? <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
                      : <>
                          <Upload className="w-6 h-6 text-slate-500" />
                          <span className="text-xs text-slate-500">Subir foto del plato</span>
                        </>
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

              {/* Toggles: disponible + destacado */}
              <div className="space-y-3">
                {/* Disponible */}
                <div
                  onClick={() => setField('disponible', !platoActual.disponible)}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all',
                    platoActual.disponible
                      ? 'border-emerald-500/40 bg-emerald-500/10'
                      : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                  )}
                >
                  <div>
                    <p className="text-sm font-medium text-white">Disponible en carta</p>
                    <p className="text-xs text-slate-500">Si está desactivado, aparece tachado o se oculta en el menú</p>
                  </div>
                  <div className={cn(
                    'w-10 h-6 rounded-full transition-colors relative shrink-0',
                    platoActual.disponible ? 'bg-emerald-500' : 'bg-slate-600'
                  )}>
                    <div className={cn(
                      'absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow',
                      platoActual.disponible ? 'left-5' : 'left-1'
                    )} />
                  </div>
                </div>

                {/* Destacado */}
                <div
                  onClick={() => setField('destacado', !platoActual.destacado)}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all',
                    platoActual.destacado
                      ? 'border-amber-500/40 bg-amber-500/10'
                      : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                  )}
                >
                  <div>
                    <p className="text-sm font-medium text-white">Plato destacado ⭐</p>
                    <p className="text-xs text-slate-500">Aparece primero y con badge especial en el menú online</p>
                  </div>
                  <div className={cn(
                    'w-10 h-6 rounded-full transition-colors relative shrink-0',
                    platoActual.destacado ? 'bg-amber-500' : 'bg-slate-600'
                  )}>
                    <div className={cn(
                      'absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow',
                      platoActual.destacado ? 'left-5' : 'left-1'
                    )} />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer modal */}
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
                  disabled={guardando || !platoActual.nombre?.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-orange-600 hover:bg-orange-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {guardando
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                    : <><Check className="w-4 h-4" /> {modal === 'crear' ? 'Agregar plato' : 'Guardar cambios'}</>
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
