'use client'

import { Sparkles, Check, Globe } from 'lucide-react'
import type { DatosWizard } from '../WizardCreacion'

const tiposDiseno = [
  { id: 'moderno', label: 'Moderno & Clean', preview: 'from-slate-800 to-slate-900' },
  { id: 'dark', label: 'Dark Premium', preview: 'from-gray-900 to-black' },
  { id: 'colorido', label: 'Colorido & Bold', preview: 'from-violet-600 to-indigo-600' },
  { id: 'elegante', label: 'Elegante & Lux', preview: 'from-amber-900 to-stone-900' },
  { id: 'natural', label: 'Natural & Fresco', preview: 'from-emerald-800 to-teal-800' },
  { id: 'tecnologico', label: 'Tech & Digital', preview: 'from-cyan-900 to-blue-900' },
]

const tipografias = [
  { id: 'inter', label: 'Inter', desc: 'Moderna y versátil' },
  { id: 'playfair', label: 'Playfair', desc: 'Elegante y serif' },
  { id: 'montserrat', label: 'Montserrat', desc: 'Geométrica y fuerte' },
  { id: 'poppins', label: 'Poppins', desc: 'Amigable y redonda' },
  { id: 'raleway', label: 'Raleway', desc: 'Fina y sofisticada' },
  { id: 'oswald', label: 'Oswald', desc: 'Condensada e impactante' },
]

interface Props {
  datos: DatosWizard
  onChange: (d: Partial<DatosWizard>) => void
  plan?: string
}

export function StepDiseno({ datos, onChange, plan }: Props) {
  function aplicarMarca() {
    if (!datos.marcaAnalizada) return
    onChange({
      coloresPrimarios: datos.marcaAnalizada.coloresPrimarios,
      coloresSecundarios: datos.marcaAnalizada.coloresSecundarios,
      tipografia: datos.marcaAnalizada.tipografia,
      tipoDiseno: datos.marcaAnalizada.tipoDiseno,
    })
  }

  return (
    <div className="space-y-6">
      {/* Banner marca detectada */}
      {datos.marcaAnalizada && (
        <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex gap-2 shrink-0">
              <div className="w-5 h-5 rounded-full border border-white/20" style={{ backgroundColor: datos.marcaAnalizada.coloresPrimarios }} />
              <div className="w-5 h-5 rounded-full border border-white/20" style={{ backgroundColor: datos.marcaAnalizada.coloresSecundarios }} />
            </div>
            <div>
              <p className="text-sm font-medium text-violet-300 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> Manual de marca analizado
              </p>
              <p className="text-xs text-muted-foreground">{datos.marcaAnalizada.descripcion}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={aplicarMarca}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 text-violet-300 text-xs font-semibold transition-all"
          >
            <Sparkles className="w-3 h-3" /> Aplicar
          </button>
        </div>
      )}

      {/* Color palette */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Color primario</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={datos.coloresPrimarios}
              onChange={e => onChange({ coloresPrimarios: e.target.value })}
              className="w-12 h-12 rounded-xl border border-white/20 cursor-pointer bg-transparent"
            />
            <div className="flex-1">
              <input
                type="text"
                value={datos.coloresPrimarios}
                onChange={e => onChange({ coloresPrimarios: e.target.value })}
                placeholder="#6366f1"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 font-mono"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            {['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map(c => (
              <button
                key={c}
                type="button"
                onClick={() => onChange({ coloresPrimarios: c })}
                className="w-6 h-6 rounded-full border-2 transition-all hover:scale-110"
                style={{ backgroundColor: c, borderColor: datos.coloresPrimarios === c ? 'white' : 'transparent' }}
              />
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Color secundario</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={datos.coloresSecundarios}
              onChange={e => onChange({ coloresSecundarios: e.target.value })}
              className="w-12 h-12 rounded-xl border border-white/20 cursor-pointer bg-transparent"
            />
            <div className="flex-1">
              <input
                type="text"
                value={datos.coloresSecundarios}
                onChange={e => onChange({ coloresSecundarios: e.target.value })}
                placeholder="#a855f7"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Design type */}
      <div>
        <label className="block text-sm font-medium mb-3">Estilo de diseño</label>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {tiposDiseno.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange({ tipoDiseno: t.id })}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                datos.tipoDiseno === t.id
                  ? 'border-indigo-500/60 bg-indigo-500/10'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className={`w-10 h-6 rounded-md bg-gradient-to-r ${t.preview}`} />
              <span className="text-xs text-center leading-tight">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Typography */}
      <div>
        <label className="block text-sm font-medium mb-3">Tipografía principal</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {tipografias.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange({ tipografia: t.id })}
              className={`flex flex-col gap-0.5 p-3 rounded-xl border text-left transition-all ${
                datos.tipografia === t.id
                  ? 'border-indigo-500/60 bg-indigo-500/10 text-indigo-300'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <span className="font-semibold text-sm">{t.label}</span>
              <span className="text-xs text-muted-foreground">{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sitios de referencia - solo para planes pro, premium y broker */}
      {plan && plan !== 'basico' && (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-indigo-400" />
            <label className="block text-sm font-medium">Sitios web de referencia (opcional)</label>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Comparte hasta 2 sitios web que te gusten como referencia de estilo
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {[0, 1].map(i => (
              <input
                key={i}
                type="url"
                value={datos.sitiosReferencia?.[i] || ''}
                onChange={e => {
                  const nuevos = [...(datos.sitiosReferencia || ['', ''])]
                  nuevos[i] = e.target.value
                  onChange({ sitiosReferencia: nuevos })
                }}
                placeholder="https://ejemplo.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
