'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { Search, X } from 'lucide-react'

interface Props {
  defaultValue: string
}

export function AdminSitiosBusqueda({ defaultValue }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const handleChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams()
      if (value.trim()) params.set('q', value.trim())
      startTransition(() => {
        router.replace(`${pathname}${params.size ? '?' + params.toString() : ''}`)
      })
    },
    [router, pathname]
  )

  return (
    <div className="relative w-64">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
      <input
        type="text"
        defaultValue={defaultValue}
        placeholder="Buscar sitio o usuario..."
        onChange={e => handleChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/8 transition-all"
      />
      {defaultValue && (
        <button
          onClick={() => {
            const input = document.querySelector<HTMLInputElement>('input[placeholder="Buscar sitio o usuario..."]')
            if (input) input.value = ''
            handleChange('')
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      {isPending && (
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
          <div className="w-3.5 h-3.5 border-2 border-indigo-400/40 border-t-indigo-400 rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
