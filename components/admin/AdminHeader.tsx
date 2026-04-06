import { Shield } from 'lucide-react'

interface AdminHeaderProps {
  user: { name?: string | null }
}

export function AdminHeader({ user }: AdminHeaderProps) {
  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-red-500/10 sticky top-0 z-30"
      style={{ background: 'rgba(6, 8, 16, 0.95)', backdropFilter: 'blur(12px)' }}
    >
      <div className="flex items-center gap-2 text-xs text-red-400 font-semibold tracking-wider">
        <Shield className="w-3.5 h-3.5" />
        PANEL DE ADMINISTRACIÓN
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        Sistema operativo
      </div>
    </header>
  )
}
