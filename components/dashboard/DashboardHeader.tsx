'use client'

import { Bell, Search, ShieldCheck, Menu } from 'lucide-react'
import Link from 'next/link'

interface DashboardHeaderProps {
  user: {
    name?: string | null
    rol?: string | null
  }
  onMenuClick?: () => void
}

export function DashboardHeader({ user, onMenuClick }: DashboardHeaderProps) {
  const isAdmin = (user as any).rol === 'admin'

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-white/5 glass sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Botón hamburguesa — solo en mobile */}
        <button
          onClick={onMenuClick}
          className="md:hidden w-9 h-9 rounded-xl glass glass-hover flex items-center justify-center shrink-0"
          aria-label="Abrir menú"
        >
          <Menu className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="relative hidden sm:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar sitios..."
            className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/40 w-48 md:w-64 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-400 text-xs font-semibold hover:bg-violet-500/20 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Panel Admin</span>
          </Link>
        )}
        <button className="relative w-9 h-9 rounded-xl glass glass-hover flex items-center justify-center">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full" />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {user.name?.charAt(0).toUpperCase() || '?'}
        </div>
      </div>
    </header>
  )
}
