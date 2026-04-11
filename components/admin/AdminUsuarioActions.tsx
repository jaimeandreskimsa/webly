'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreVertical, Shield, UserX, UserCheck, Zap, Trash2, KeyRound } from 'lucide-react'
import type { Usuario } from '@/lib/db/schema'

interface AdminUsuarioActionsProps {
  usuario: Usuario & { totalSitios: number; totalGastado: number }
}

export function AdminUsuarioActions({ usuario }: AdminUsuarioActionsProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)
  const [nuevaPass, setNuevaPass] = useState<string | null>(null)

  async function resetearPassword() {
    setLoading(true)
    setOpen(false)
    const res = await fetch(`/api/admin/usuarios/${usuario.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'resetear_password' }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.nuevaPassword) setNuevaPass(data.nuevaPassword)
  }

  async function ejecutarAccion(accion: string, valor?: string) {
    setLoading(true)
    setOpen(false)
    await fetch(`/api/admin/usuarios/${usuario.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion, valor }),
    })
    setLoading(false)
    router.refresh()
  }

  async function eliminarCuenta() {
    setLoading(true)
    setOpen(false)
    setConfirmarEliminar(false)
    await fetch(`/api/admin/usuarios/${usuario.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'eliminar' }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={loading}
        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-50 w-52 rounded-xl border border-slate-700 shadow-2xl overflow-hidden" style={{ backgroundColor: '#111827' }}>
            <div className="p-1">
              {/* Cambiar plan */}
              <p className="text-xs text-slate-500 px-3 py-1.5 font-medium">Cambiar plan</p>
              {['basico', 'pro', 'premium', 'broker'].map(plan => (
                <button
                  key={plan}
                  onClick={() => ejecutarAccion('cambiar_plan', plan)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors hover:bg-white/10 capitalize flex items-center gap-2 ${
                    usuario.plan === plan ? 'text-indigo-400' : 'text-slate-300'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  {plan.charAt(0).toUpperCase() + plan.slice(1)}
                  {usuario.plan === plan && ' ✓'}
                </button>
              ))}

              <div className="border-t border-white/5 my-1" />
              <p className="text-xs text-slate-500 px-3 py-1.5 font-medium">Rol</p>
              <button
                onClick={() => ejecutarAccion('cambiar_rol', usuario.rol === 'admin' ? 'usuario' : 'admin')}
                className="w-full text-left px-3 py-2 text-sm rounded-lg transition-colors hover:bg-white/10 text-slate-300 flex items-center gap-2"
              >
                <Shield className="w-3.5 h-3.5 text-red-400" />
                {usuario.rol === 'admin' ? 'Quitar admin' : 'Hacer admin'}
              </button>

              <div className="border-t border-white/5 my-1" />
              <button
                onClick={resetearPassword}
                className="w-full text-left px-3 py-2 text-sm rounded-lg transition-colors hover:bg-amber-500/10 text-amber-400 flex items-center gap-2"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Resetear contraseña
              </button>

              <div className="border-t border-white/5 my-1" />
              <button
                onClick={() => ejecutarAccion('toggle_activo')}
                className="w-full text-left px-3 py-2 text-sm rounded-lg transition-colors hover:bg-red-500/10 text-slate-300 hover:text-red-400 flex items-center gap-2"
              >
                {usuario.activo !== false ? (
                  <><UserX className="w-3.5 h-3.5" /> Desactivar cuenta</>
                ) : (
                  <><UserCheck className="w-3.5 h-3.5" /> Activar cuenta</>
                )}
              </button>

              <div className="border-t border-red-900/40 my-1" />
              {!confirmarEliminar ? (
                <button
                  onClick={() => setConfirmarEliminar(true)}
                  className="w-full text-left px-3 py-2 text-sm rounded-lg transition-colors hover:bg-red-500/20 text-red-500 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar cuenta
                </button>
              ) : (
                <div className="px-3 py-2">
                  <p className="text-xs text-red-400 mb-2">¿Eliminar cuenta y todos sus sitios? Esta acción no se puede deshacer.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={eliminarCuenta}
                      className="flex-1 py-1.5 text-xs rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
                    >
                      Sí, eliminar
                    </button>
                    <button
                      onClick={() => setConfirmarEliminar(false)}
                      className="flex-1 py-1.5 text-xs rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal nueva contraseña */}
      {nuevaPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setNuevaPass(null)}>
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-bold mb-1">Contraseña reseteada ✅</h3>
            <p className="text-slate-400 text-sm mb-4">Comparte esta contraseña temporal con el usuario:</p>
            <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-3 mb-4">
              <span className="font-mono text-xl text-indigo-300 flex-1 tracking-widest">{nuevaPass}</span>
              <button
                onClick={() => { navigator.clipboard.writeText(nuevaPass); }}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >Copiar</button>
            </div>
            <p className="text-xs text-slate-500 mb-4">Esta ventana es la única vez que se muestra.</p>
            <button
              onClick={() => setNuevaPass(null)}
              className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
            >Cerrar</button>
          </div>
        </div>
      )}
    </div>
  )
}
