'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  LayoutDashboard, Users, Globe, CreditCard,
  Settings, LogOut, Shield, BarChart3, Zap, HelpCircle, Package, Brain
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Overview', exact: true },
  { href: '/admin/usuarios', icon: Users, label: 'Usuarios' },
  { href: '/admin/sitios', icon: Globe, label: 'Sitios' },
  { href: '/admin/pagos', icon: CreditCard, label: 'Pagos & Revenue' },
  { href: '/admin/planes', icon: Package, label: 'Planes' },
  { href: '/admin/estadisticas', icon: BarChart3, label: 'Estadísticas' },
  { href: '/admin/solicitudes', icon: HelpCircle, label: 'Solicitudes', badge: true },
  { href: '/admin/configuracion', icon: Settings, label: 'Configuración' },
  { href: '/admin/configuracion?tab=prompts', icon: Brain, label: 'Prompts IA', sub: true },
]

interface AdminSidebarProps {
  user: { name?: string | null; email?: string | null }
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab')
  const [solicitudesPendientes, setSolicitudesPendientes] = useState(0)

  useEffect(() => {
    fetch('/api/admin/solicitudes')
      .then(r => r.json())
      .then((data: Array<{ atendida: boolean | null }>) => {
        if (Array.isArray(data)) {
          setSolicitudesPendientes(data.filter(s => !s.atendida).length)
        }
      })
      .catch(() => {})
  }, [pathname])

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 flex flex-col border-r border-red-500/10 z-40"
      style={{ background: 'linear-gradient(180deg, #060810 0%, #0a0d1a 100%)' }}
    >
      {/* Logo admin */}
      <div className="p-5 border-b border-red-500/10">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/20">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-black text-white">WeblyNow</span>
            <div className="text-xs text-red-400 font-semibold tracking-widest">ADMIN</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          let isActive: boolean
          if (item.href.includes('?tab=prompts')) {
            isActive = pathname === '/admin/configuracion' && currentTab === 'prompts'
          } else if (item.exact) {
            isActive = pathname === item.href
          } else {
            // Para Configuración: activo solo si NO estamos en tab=prompts
            if (item.href === '/admin/configuracion') {
              isActive = pathname.startsWith(item.href) && currentTab !== 'prompts'
            } else {
              isActive = pathname.startsWith(item.href)
            }
          }
          const count = item.badge ? solicitudesPendientes : 0
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                item.sub ? 'ml-3 py-2' : '',
                isActive
                  ? 'bg-red-500/15 text-red-300 border border-red-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              <item.icon className={cn('w-4 h-4', isActive ? 'text-red-400' : '', item.sub ? 'w-3.5 h-3.5' : '')} />
              <span className={cn('flex-1', item.sub ? 'text-xs' : '')}>{item.label}</span>
              {count > 0 && (
                <span className="ml-auto text-xs font-bold bg-indigo-500 text-white rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </Link>
          )
        })}

        <div className="pt-4 border-t border-white/5 mt-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:text-white hover:bg-white/5 transition-all"
          >
            <Zap className="w-4 h-4" />
            Ir al Dashboard
          </Link>
        </div>
      </nav>

      {/* User */}
      <div className="p-4 border-t border-red-500/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {user.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate text-white">{user.name}</p>
            <p className="text-xs text-red-400 font-semibold">Super Admin</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-red-400 transition-colors w-full px-2 py-1.5 rounded-lg hover:bg-red-500/10"
        >
          <LogOut className="w-3.5 h-3.5" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
