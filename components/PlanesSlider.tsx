'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Plan {
  id: string
  nombre: string
  precio: string
  descripcion: string
  color: string
  border: string
  badge: string | null
  features: string[]
  limitaciones: string[]
  cta: string
  ctaColor: string
}

export default function PlanesSlider({ planes }: { planes: Plan[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [visibleCount, setVisibleCount] = useState(3)

  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 640) setVisibleCount(1)
      else if (window.innerWidth < 1024) setVisibleCount(2)
      else setVisibleCount(3)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const maxIndex = planes.length - visibleCount

  const goTo = (idx: number) => {
    const clamped = Math.max(0, Math.min(idx, maxIndex))
    setActive(clamped)
    const track = trackRef.current
    if (!track) return
    const card = track.children[clamped] as HTMLElement
    if (card) track.scrollTo({ left: card.offsetLeft, behavior: 'smooth' })
  }

  // Sync active dot on manual scroll
  const onScroll = () => {
    const track = trackRef.current
    if (!track) return
    const cardWidth = (track.children[0] as HTMLElement)?.offsetWidth ?? 0
    if (cardWidth === 0) return
    setActive(Math.round(track.scrollLeft / (cardWidth + 24)))
  }

  const badgeColor = (id: string) => {
    if (id === 'broker') return 'bg-gradient-to-r from-emerald-500 to-teal-600'
    if (id === 'premium') return 'bg-gradient-to-r from-amber-500 to-orange-500'
    if (id === 'restaurante') return 'bg-gradient-to-r from-orange-500 to-red-600'
    return 'bg-gradient-to-r from-violet-500 to-purple-600'
  }

  return (
    <div className="relative">
      {/* Prev */}
      <button
        onClick={() => goTo(active - 1)}
        disabled={active === 0}
        className={cn(
          'absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border flex items-center justify-center transition-all',
          'bg-[#0a0d1a] border-white/10 text-white hover:border-white/30 hover:bg-white/5',
          'disabled:opacity-0 disabled:pointer-events-none',
          'hidden sm:flex'
        )}
        aria-label="Anterior"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Track */}
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex gap-6 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {planes.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              'relative rounded-2xl border flex flex-col flex-shrink-0 snap-start',
              plan.border,
              `bg-gradient-to-b ${plan.color}`,
              'p-8',
              plan.badge === 'MÁS POPULAR' ? 'scale-[1.02] glow-purple' : '',
              // responsive widths
              'w-[calc(100%-2rem)] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]'
            )}
          >
            {plan.badge && (
              <div className={cn(
                'absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-4 py-1.5 rounded-full',
                badgeColor(plan.id)
              )}>
                {plan.badge}
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-xl font-bold mb-1">{plan.nombre}</h3>
              <p className="text-muted-foreground text-sm mb-4">{plan.descripcion}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-muted-foreground text-sm">CLP$</span>
                <span className="text-4xl font-black">{plan.precio}</span>
              </div>
              <p className="text-muted-foreground text-xs mt-1">Pago único · sin mensualidad</p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
              {plan.limitaciones.map((limit, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground line-through">
                  <span className="w-4 h-4 mt-0.5 shrink-0 text-center">✕</span>
                  <span>{limit}</span>
                </li>
              ))}
            </ul>

            <Link
              href={`/registro?plan=${plan.id}`}
              className={cn(
                'w-full text-center py-3 px-6 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-[1.02]',
                plan.ctaColor
              )}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* Next */}
      <button
        onClick={() => goTo(active + 1)}
        disabled={active >= maxIndex}
        className={cn(
          'absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border flex items-center justify-center transition-all',
          'bg-[#0a0d1a] border-white/10 text-white hover:border-white/30 hover:bg-white/5',
          'disabled:opacity-0 disabled:pointer-events-none',
          'hidden sm:flex'
        )}
        aria-label="Siguiente"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: maxIndex + 1 }).map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={cn(
              'rounded-full transition-all',
              active === i
                ? 'w-6 h-2 bg-indigo-400'
                : 'w-2 h-2 bg-white/20 hover:bg-white/40'
            )}
            aria-label={`Ir al plan ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
