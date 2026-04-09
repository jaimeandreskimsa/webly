'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Loader2, Edit3, Eye, Save, CheckCircle2, AlertCircle,
  Image as ImageIcon, Upload, Wand2, MousePointerClick,
} from 'lucide-react'
import { cn } from '@/lib/utils'

function extractImages(html: string): { src: string; originalSrc: string }[] {
  const seen = new Set<string>()
  const results: { src: string; originalSrc: string }[] = []
  const re = /<img[^>]+src=["']([^"']+)["'][^>]*/gi
  let m
  while ((m = re.exec(html)) !== null) {
    const src = m[1]
    if (!src || src.startsWith('data:') || seen.has(src)) continue
    seen.add(src)
    results.push({ src, originalSrc: src })
  }
  return results
}

function injectTextEditor(html: string): string {
  const code = `<style id="__we_s">
[data-we]:hover { outline: 2px dashed rgba(99,102,241,.65) !important; outline-offset: 1px; cursor: text !important; border-radius: 2px; }
[data-we][contenteditable="true"] { outline: 2px solid #6366f1 !important; outline-offset: 1px; background: rgba(99,102,241,.06) !important; cursor: text !important; }
a { pointer-events: none !important; }
</style>
<script id="__we_js">(function() {
  var T = 'h1,h2,h3,h4,h5,h6,p,li,button,label,td,th,figcaption,blockquote,small,strong,em,span';
  document.querySelectorAll(T).forEach(function(el, i) {
    if (el.closest('[data-we]')) return;
    var inner = 0; el.querySelectorAll(T).forEach(function() { inner++; });
    if (inner > 0 || !el.textContent.trim()) return;
    el.dataset.we = i; el.title = 'Doble-click para editar';
    el.addEventListener('dblclick', function(e) {
      e.stopPropagation(); e.preventDefault();
      document.querySelectorAll('[contenteditable="true"]').forEach(function(o) { if (o !== el) o.contentEditable = 'false'; });
      el.contentEditable = 'true'; el.focus();
      try { var r = document.createRange(); r.selectNodeContents(el); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); } catch(err) {}
    });
    el.addEventListener('blur', function() {
      el.contentEditable = 'false';
      window.parent.postMessage({ type: 'webtory-changed', html: document.documentElement.outerHTML }, '*');
    });
    el.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) { e.preventDefault(); el.blur(); }
    });
  });
})();</script>`
  return html.includes('</body>') ? html.replace('</body>', code + '</body>') : html + code
}

interface EditorVisualProps {
  sitioId: string
  htmlActual: string
  onIrIA: () => void
}

export function EditorVisual({ sitioId, htmlActual, onIrIA }: EditorVisualProps) {
  const [pendingHtml, setPendingHtml] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [error, setError] = useState('')
  const [subiendoIdx, setSubiendoIdx] = useState<number | null>(null)

  const currentHtml = pendingHtml ?? htmlActual
  const hayPendientes = pendingHtml !== null && !guardado
  const imagenes = useMemo(() => extractImages(currentHtml), [currentHtml])

  useEffect(() => {
    function handler(e: MessageEvent) {
      if (e.data?.type === 'webtory-changed') {
        setPendingHtml(e.data.html as string)
        setGuardado(false)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  function toggleEditMode() {
    setEditMode(m => !m)
    setIframeKey(k => k + 1)
  }

  async function guardarCambios() {
    if (!pendingHtml) return
    setGuardando(true)
    setError('')
    try {
      const res = await fetch(`/api/sitios/${sitioId}/html`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: pendingHtml }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Error al guardar')
      setGuardado(true)
    } catch (err: any) {
      setError(err.message || 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  async function reemplazarImagen(originalSrc: string, file: File, idx: number) {
    setSubiendoIdx(idx)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('tipo', 'galeria')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al subir imagen')
      const base = pendingHtml ?? htmlActual
      const escaped = originalSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const newHtml = base.replace(new RegExp(escaped, 'g'), data.url as string)
      setPendingHtml(newHtml)
      setGuardado(false)
      setIframeKey(k => k + 1)
    } catch (err: any) {
      setError(err.message || 'Error al subir imagen')
    } finally {
      setSubiendoIdx(null)
    }
  }

  return (
    <div className="flex gap-5" style={{ height: 'calc(100vh - 230px)', minHeight: 520 }}>
      {/* ── Preview iframe ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        <div className="flex items-center gap-2 glass rounded-xl border border-white/5 px-3 py-2 flex-shrink-0">
          <button
            onClick={toggleEditMode}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
              editMode
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'text-muted-foreground hover:text-white hover:bg-white/5 border border-white/10'
            )}
          >
            {editMode ? <><Edit3 className="w-3.5 h-3.5" /> Editando textos</> : <><Eye className="w-3.5 h-3.5" /> Solo vista</>}
          </button>
          {editMode && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <MousePointerClick className="w-3 h-3" />
              Doble-click en cualquier texto para editarlo
            </span>
          )}
        </div>
        <div className="flex-1 rounded-2xl border border-white/10 overflow-hidden bg-white">
          <iframe
            key={iframeKey}
            srcDoc={editMode ? injectTextEditor(currentHtml) : currentHtml}
            className="w-full h-full"
            sandbox="allow-scripts allow-same-origin"
            title="Preview del sitio"
          />
        </div>
      </div>

      {/* ── Panel derecho ───────────────────────────────────────────── */}
      <div className="w-72 flex flex-col gap-3 flex-shrink-0 overflow-y-auto">
        {/* Notificaciones */}
        {hayPendientes && (
          <div className="glass rounded-xl border border-amber-500/30 px-3 py-2.5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <span className="text-xs text-amber-300 font-medium">Cambios pendientes de guardar</span>
          </div>
        )}
        {guardado && (
          <div className="glass rounded-xl border border-green-500/30 px-3 py-2.5 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
            <span className="text-xs text-green-400 font-medium">Guardado correctamente</span>
          </div>
        )}
        {error && (
          <div className="glass rounded-xl border border-red-500/30 px-3 py-2.5 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-xs text-red-400">{error}</span>
          </div>
        )}

        {/* Imágenes del sitio */}
        <div className="glass rounded-2xl border border-white/5 p-4 space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-orange-400" />
            Imágenes del sitio
            <span className="text-xs font-normal text-muted-foreground ml-auto">{imagenes.length}</span>
          </h3>
          {imagenes.length === 0 ? (
            <p className="text-xs text-muted-foreground">No se encontraron imágenes.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {imagenes.map((img, idx) => (
                <label
                  key={idx}
                  className={cn(
                    'relative group rounded-xl overflow-hidden border h-20 flex items-center justify-center cursor-pointer transition-all',
                    subiendoIdx === idx
                      ? 'border-orange-500/50 bg-black/30'
                      : 'border-white/10 bg-white/5 hover:border-orange-500/40'
                  )}
                  title="Click para cambiar esta imagen"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.src}
                    alt={`Imagen ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.opacity = '0.2' }}
                  />
                  {/* Overlay */}
                  <div className={cn(
                    'absolute inset-0 flex flex-col items-center justify-center gap-1 transition-all rounded-xl',
                    subiendoIdx === idx ? 'bg-black/65' : 'bg-black/0 group-hover:bg-black/55'
                  )}>
                    {subiendoIdx === idx ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="text-[10px] text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity text-center leading-tight px-1">
                          Cambiar
                        </span>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    disabled={subiendoIdx !== null}
                    onChange={e => {
                      const f = e.target.files?.[0]
                      if (f) reemplazarImagen(img.originalSrc, f, idx)
                      e.target.value = ''
                    }}
                  />
                </label>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Pasa el cursor sobre una imagen y haz click para reemplazarla.{' '}
            <span className="text-green-400 font-medium">Gratis.</span>
          </p>
        </div>

        {/* Editar textos */}
        <div className="glass rounded-2xl border border-white/5 p-4 space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-1.5">
            <Edit3 className="w-4 h-4 text-indigo-400" />
            Editar textos
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Activa el modo edición y haz doble-click sobre cualquier texto del preview.{' '}
            <span className="text-green-400 font-medium">Gratis.</span>
          </p>
          <button
            onClick={toggleEditMode}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border',
              editMode
                ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300'
                : 'bg-white/5 border-white/10 text-muted-foreground hover:text-white hover:bg-white/10'
            )}
          >
            <Edit3 className="w-4 h-4" />
            {editMode ? 'Modo edición activo' : 'Activar edición de textos'}
          </button>
        </div>

        {/* Guardar */}
        <button
          onClick={guardarCambios}
          disabled={!hayPendientes || guardando}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-500/15 border border-green-500/30 text-green-300 text-sm font-bold hover:bg-green-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {guardando
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
            : <><Save className="w-4 h-4" /> Guardar todos los cambios</>
          }
        </button>

        {/* IA */}
        <div className="glass rounded-2xl border border-white/5 p-4 space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-1.5">
            <Wand2 className="w-4 h-4 text-indigo-400" />
            Cambios con IA
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Redesign, nuevas secciones o cambios profundos.{' '}
            <span className="text-amber-400 font-medium">Consume 1 edición.</span>
          </p>
          <button
            onClick={onIrIA}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl btn-gradient text-white text-xs font-semibold hover:scale-[1.02] transition-transform"
          >
            <Wand2 className="w-4 h-4" />
            Usar IA para editar
          </button>
        </div>
      </div>
    </div>
  )
}
