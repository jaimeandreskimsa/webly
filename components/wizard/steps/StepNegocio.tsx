'use client'

import type { DatosWizard } from '../WizardCreacion'

const rubros = [
  'Restaurante / Café', 'Tienda / Comercio', 'Servicios profesionales',
  'Salud / Clínica', 'Construcción / Inmobiliaria', 'Inmobiliario / Portal de propiedades',
  'Educación / Academia',
  'Belleza / Estética', 'Tecnología', 'Turismo / Hospedaje', 'Otro',
]

const estilos = [
  { id: 'moderno', label: 'Moderno', desc: 'Limpio, minimalista, profesional' },
  { id: 'corporativo', label: 'Corporativo', desc: 'Formal, confianza, estructura' },
  { id: 'creativo', label: 'Creativo', desc: 'Bold, colorido, llamativo' },
  { id: 'elegante', label: 'Elegante', desc: 'Lujo, sofisticación, premium' },
]

interface Props {
  datos: DatosWizard
  onChange: (d: Partial<DatosWizard>) => void
}

export function StepNegocio({ datos, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Nombre de la empresa <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={datos.nombreEmpresa}
            onChange={e => onChange({ nombreEmpresa: e.target.value })}
            placeholder="Ej: Café Rituales, Clínica Vital..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Ciudad</label>
          <input
            type="text"
            value={datos.ciudad}
            onChange={e => onChange({ ciudad: e.target.value })}
            placeholder="Santiago, Viña del Mar, Concepción..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Rubro <span className="text-red-400">*</span>
        </label>
        <select
          value={datos.rubro}
          onChange={e => onChange({ rubro: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all"
        >
          <option value="" className="bg-[#1a1a2e]">Selecciona tu rubro</option>
          {rubros.map(r => (
            <option key={r} value={r} className="bg-[#1a1a2e]">{r}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Descripción de tu empresa <span className="text-red-400">*</span>
        </label>
        <textarea
          value={datos.descripcion}
          onChange={e => onChange({ descripcion: e.target.value })}
          placeholder="Describe tu empresa en 2-3 oraciones: qué haces, para quién, qué te hace único..."
          rows={4}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          {datos.descripcion.length}/500 caracteres
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-3">Estilo visual del sitio</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {estilos.map(e => (
            <button
              key={e.id}
              type="button"
              onClick={() => onChange({ estilo: e.id })}
              className={`p-3 rounded-xl border text-left transition-all ${
                datos.estilo === e.id
                  ? 'border-indigo-500/60 bg-indigo-500/15 text-indigo-300'
                  : 'border-white/10 hover:border-white/20 bg-white/3'
              }`}
            >
              <div className="font-medium text-sm">{e.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{e.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
