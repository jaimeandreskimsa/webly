'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Zap, LayoutDashboard, Globe, Plus, Settings,
  CreditCard, LogOut, Sparkles, Crown, Building2
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/dashboard/sitios', icon: Globe, label: 'Mis sitios' },
  { href: '/dashboard/facturacion', icon: CreditCard, label: 'Facturación' },
  { href: '/dashboard/configuracion', icon: Settings, label: 'Configuración' },
]

const planBadges = {
  basico: { label: 'Básico', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  pro: { label: 'Pro', color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
  premium: { label: 'Premium', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  broker: { label: 'Broker', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
}

interface SidebarProps {
  user: {
    name?: string | null
    email?: string | null
    plan?: string
  }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const plan = (user as any)?.plan || 'basico'
  const badge = planBadges[plan as keyof typeof planBadges] ?? planBadges.basico

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 flex flex-col glass border-r border-white/5 z-40">
      {/* Logo */}
      <div className="p-5 border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center glow-purple">
            <Zap className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-lg font-black gradient-text">Webtory</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {plan === 'broker' && (
          <Link
            href="/dashboard/propiedades"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group mb-1',
              pathname.startsWith('/dashboard/propiedades')
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-muted-foreground hover:text-white hover:bg-white/5'
            )}
          >
            <Building2 className={cn(
              'w-4 h-4 transition-transform group-hover:scale-110',
              pathname.startsWith('/dashboard/propiedades') ? 'text-emerald-400' : ''
            )} />
            Mis Propiedades
          </Link>
        )}
      {/* Crear sitio — siempre visible con el plan correcto */}
        <Link
          href={`/dashboard/nuevo?plan=${plan}`}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group mb-1',
            pathname === '/dashboard/nuevo'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              : 'bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-indigo-300 border border-indigo-500/20 hover:from-indigo-600/40 hover:to-purple-600/40'
          )}
        >
          <Plus className="w-4 h-4 text-indigo-400 transition-transform group-hover:scale-110" />
          Crear sitio
          <Sparkles className="w-3 h-3 ml-auto text-indigo-400" />
        </Link>

        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-muted-foreground hover:text-white hover:bg-white/5'
              )}
            >
              <item.icon className={cn(
                'w-4 h-4 transition-transform group-hover:scale-110',
                isActive ? 'text-indigo-400' : ''
              )} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-white/5">
        {/* Plan badge */}
        <div className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border mb-3', badge.color)}>
          <Crown className="w-3 h-3" />
          Plan {badge.label}
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {user.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-red-400 transition-colors w-full px-2 py-1.5 rounded-lg hover:bg-red-500/10"
        >
          <LogOut className="w-3.5 h-3.5" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
