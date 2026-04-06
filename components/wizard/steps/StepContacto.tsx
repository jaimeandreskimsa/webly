'use client'

import { Phone, Mail, MapPin, Clock, Instagram, Facebook, Linkedin } from 'lucide-react'
import type { DatosWizard } from '../WizardCreacion'

interface Props {
  datos: DatosWizard
  onChange: (d: Partial<DatosWizard>) => void
}

export function StepContacto({ datos, onChange }: Props) {
  function updateRedes(campo: string, valor: string) {
    onChange({
      redesSociales: { ...datos.redesSociales, [campo]: valor }
    })
  }

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-indigo-400" />
            Teléfono / WhatsApp
          </label>
          <input
            type="tel"
            value={datos.telefono}
            onChange={e => onChange({ telefono: e.target.value })}
            placeholder="+56 9 1234 5678"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-indigo-400" />
            Email de contacto
          </label>
          <input
            type="email"
            value={datos.email}
            onChange={e => onChange({ email: e.target.value })}
            placeholder="contacto@tuempresa.cl"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-indigo-400" />
          Dirección
        </label>
        <input
          type="text"
          value={datos.direccion}
          onChange={e => onChange({ direccion: e.target.value })}
          placeholder="Av. Providencia 1234, Santiago"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          Horario de atención
        </label>
        <input
          type="text"
          value={datos.horario}
          onChange={e => onChange({ horario: e.target.value })}
          placeholder="Lunes a Viernes 9:00 - 18:00 hrs"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 transition-all"
        />
      </div>

      {/* Redes sociales */}
      <div>
        <label className="block text-sm font-medium mb-3">Redes sociales (opcional)</label>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center shrink-0">
              <Instagram className="w-4 h-4 text-pink-400" />
            </div>
            <input
              type="text"
              value={datos.redesSociales.instagram || ''}
              onChange={e => updateRedes('instagram', e.target.value)}
              placeholder="@tuempresa"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Facebook className="w-4 h-4 text-blue-400" />
            </div>
            <input
              type="text"
              value={datos.redesSociales.facebook || ''}
              onChange={e => updateRedes('facebook', e.target.value)}
              placeholder="facebook.com/tuempresa"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-700/10 border border-blue-700/20 flex items-center justify-center shrink-0">
              <Linkedin className="w-4 h-4 text-blue-500" />
            </div>
            <input
              type="text"
              value={datos.redesSociales.linkedin || ''}
              onChange={e => updateRedes('linkedin', e.target.value)}
              placeholder="linkedin.com/company/tuempresa"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4 text-green-400" />
            </div>
            <input
              type="text"
              value={datos.redesSociales.whatsapp || ''}
              onChange={e => updateRedes('whatsapp', e.target.value)}
              placeholder="+56 9 1234 5678 (WhatsApp)"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
