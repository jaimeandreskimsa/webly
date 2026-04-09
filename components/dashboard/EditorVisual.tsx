'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Loader2, Edit3, Eye, Save, CheckCircle2, AlertCircle,
  Image as ImageIcon, X, Upload, Wand2, MousePointerClick, Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Inyectar script de edición inline en el HTML del sitio ─────────────────
function injectEditor(html: string): string {
  const code = `<style id="__we_s">
[data-we]:hover { outline: 2px dashed rgba(99,102,241,.65) !important; outline-offset: 1px; cursor: text !important; border-radius: 2px; }
[data-we][contenteditable="true"] { outline: 2px solid #6366f1 !important; outline-offset: 1px; background: rgba(99,102,241,.06) !important; cursor: text !important; }
img[data-wi] { cursor: pointer !important; }
img[data-wi]:hover { outline: 2px dashed rgba(251,146,60,.8) !important; outline-offset: 2px; }
a { pointer-events: none !important; }
</style>
<script id="__we_js">(function() {
  var T = 'h1,h2,h3,h4,h5,h6,p,li,button,label,td,th,figcaption,blockquote,small,strong,em,span';
  document.querySelectorAll(T).forEach(function(el, i) {
    if (el.closest('[data-we]')) return;
    var inner = 0;
    el.querySelectorAll(T).forEach(function() { inner++; });
    if (inner > 0) return;
    if (!el.textContent.trim()) return;
    el.dataset.we = i;
    el.title = 'Doble-click para editar';
    el.addEventListener('dblclick', function(e) {
      e.stopPropagation(); e.preventDefault();
      document.querySelectorAll('[contenteditable="true"]').forEach(function(o) {
        if (o !== el) o.contentEditable = 'false';
      });
      el.contentEditable = 'true'; el.focus();
      try {
        var r = document.createRange(); r.selectNodeContents(el);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      } catch(err) {}
    });
    el.addEventListener('blur', function() {
      el.contentEditable = 'false';
      window.parent.postMessage({ type: 'webtory-changed', html: document.documentElement.outerHTML }, '*');
    });
    el.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
        e.preventDefault(); el.blur();
      }
    });
  });
  document.querySelectorAll('img').forEach(function(img, i) {
    img.dataset.wi = i; img.title = 'Click para cambiar imagen';
    img.addEventListener('click', function(e) {
      e.preventDefault(); e.stopPropagation();
      window.parent.postMessage({ type: 'webtory-image', src: img.src, idx: i }, '*');
    });
  });
})();</script>`

  return html.includes('</body>') ? html.replace('</body>', code + '</body>') : html + code
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface EditorVisualProps {
  sitioId: string
  htmlActual: string
  onIrIA: () => void
}

// ─── Componente ───────────────────────────────────────────────────────────────
export function EditorVisual({ sitioId, htmlActual, onIrIA }: EditorVisualProps) {
  const [pendingHtml, setPendingHtml] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [error, setError] = useState('')

  // Imagen seleccionada para reemplazar
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const currentHtml = pendingHtml ?? htmlActual
  const hayPendientes = pendingHtml !== null && !guardado

  // Escuchar mensajes del iframe
  useEffect(() => {
    function handler(e: MessageEvent) {
      if (!e.data?.type) return
      if (e.data.type === 'webtory-changed') {
        setPendingHtml(e.data.html as string)
        setGuardado(false)
      }
      if (e.data.type === 'webtory-image') {
        setImgSrc(e.data.src as string)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  function toggleEditMode() {
    setEditMode(m => !m)
    setIframeKey(k => k + 1) // forzar reload del iframe
    setImgSrc(null)
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
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Error al guardar')
      }
      setGuardado(true)
    } catch (err: any) {
      setError(err.message || 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  async function reemplazarImagen(file: File) {
    if (!imgSrc) return
    setSubiendo(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('tipo', 'galeria')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al subir imagen')

      // Reemplazar src en el HTML actual
      const base = pendingHtml ?? htmlActual
      const escaped = imgSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const newHtml = base.replace(new RegExp(escaped, 'g'), data.url as string)
      setPendingHtml(newHtml)
      setGuardado(false)
      setImgSrc(null)
      setIframeKey(k => k + 1) // reload con nueva imagen
    } catch (err: any) {
      setError(err.message || 'Error al reemplazar imagen')
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className="flex gap-5" style={{ height: 'calc(100vh - 230px)', minHeight: 520 }}>

      {/* ── Panel izquierdo: preview iframe ──────────────────────────── */}
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        {/* Toolbar del iframe */}
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
            {editMode
              ? <><Edit3 className="w-3.5 h-3.5" /> Editando</>
              : <><Eye className="w-3.5 h-3.5" /> Solo ver</>
            }
          </button>
          {editMode && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <MousePointerClick className="w-3 h-3" />
              Doble-click en texto · Click en imagen para reemplazar
            </span>
          )}
          {!editMode && (
            <span className="text-xs text-muted-foreground">
              Activa "Editando" para modificar texto e imágenes
            </span>
          )}
        </div>

        {/* iframe */}
        <div className="flex-1 rounded-2xl border border-white/10 overflow-hidden bg-white">
          <iframe
            key={iframeKey}
            srcDoc={editMode ? injectEditor(currentHtml) : currentHtml}
            className="w-full h-full"
            sandbox="allow-scripts allow-same-origin"
            title="Preview del sitio"
          />
        </div>
      </div>

      {/* ── Panel derecho: acciones ───────────────────────────────────── */}
      <div className="w-72 flex flex-col gap-3 flex-shrink-0 overflow-y-auto">

        {/* Estado */}
        {hayPendientes && (
          <div className="glass rounded-xl border border-amber-500/30 px-3 py-2.5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <span className="text-xs text-amber-300 font-medium">Hay cambios sin guardar</span>
          </div>
        )}
        {guardado && (
          <div className="glass rounded-xl border border-green-500/30 px-3 py-2.5 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
            <span className="text-xs text-green-400 font-medium">Cambios guardados correctamente</span>
          </div>
        )}
        {error && (
          <div className="glass rounded-xl border border-red-500/30 px-3 py-2.5 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-xs text-red-400">{error}</span>
          </div>
        )}

        {/* Guardar cambios directos */}
        <div className="glass rounded-2xl border border-white/5 p-4 space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-1.5">
            <Edit3 className="w-4 h-4 text-white/60" />
            Edición directa
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Edita textos e imágenes directamente en el preview.
            <span className="text-green-400 font-medium"> No consume ediciones.</span>
          </p>
          <div className="bg-white/3 rounded-lg p-3 space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-start gap-1.5">
              <span className="text-indigo-400 shrink-0">①</span>
              Activa modo "Editando"
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-indigo-400 shrink-0">②</span>
              Doble-click en cualquier texto para editarlo
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-indigo-400 shrink-0">③</span>
              Click en una imagen para reemplazarla
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-indigo-400 shrink-0">④</span>
              Presiona Enter o Escape para confirmar
            </div>
          </div>
          <button
            onClick={guardarCambios}
            disabled={!hayPendientes || guardando}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/15 border border-green-500/30 text-green-300 text-sm font-semibold hover:bg-green-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {guardando
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
              : <><Save className="w-4 h-4" /> Guardar cambios</>
            }
          </button>
        </div>

        {/* Reemplazar imagen (aparece al hacer click en una imagen) */}
        {imgSrc && (
          <div className="glass rounded-2xl border border-orange-500/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-orange-300 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4" />
                Reemplazar imagen
              </h3>
              <button
                onClick={() => setImgSrc(null)}
                className="text-muted-foreground hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Preview imagen actual */}
            <div className="rounded-lg overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center max-h-28">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgSrc} alt="" className="w-full object-cover max-h-28" />
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) reemplazarImagen(f)
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={subiendo}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-300 text-sm font-semibold hover:bg-orange-500/25 transition-all disabled:opacity-40"
            >
              {subiendo
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo...</>
                : <><Upload className="w-4 h-4" /> Elegir nueva imagen</>
              }
            </button>
          </div>
        )}

        {/* Cambios con IA */}
        <div className="glass rounded-2xl border border-white/5 p-4 space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-1.5">
            <Wand2 className="w-4 h-4 text-indigo-400" />
            Cambios con IA
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Para cambios de diseño, estructura o contenido más profundos.
            <span className="text-amber-400 font-medium"> Consume 1 edición.</span>
          </p>
          <button
            onClick={onIrIA}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl btn-gradient text-white text-xs font-semibold hover:scale-[1.02] transition-transform"
          >
            <Wand2 className="w-4 h-4" />
            Ir a cambios con IA
          </button>
        </div>

        {/* Tip */}
        <div className="glass rounded-xl border border-white/5 px-3 py-2.5 flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Los cambios directos no afectan el historial de versiones ni el contador de ediciones.
          </p>
        </div>
      </div>
    </div>
  )
}
