import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatFecha(date: Date | string): string {
  return new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export function generateSlug(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}

export const PLAN_PRECIOS = {
  prueba: 1000,
  basico: 50000,
  pro: 100000,
  premium: 300000,
  broker: 700000,
} as const

export const PLAN_LIMITE_EDICIONES = {
  prueba: 1,
  basico: 1,
  pro: 5,
  premium: 5,
  broker: 5,
} as const

export const PLAN_NOMBRES = {
  prueba: 'Prueba',
  basico: 'Básico',
  pro: 'Pro',
  premium: 'Premium',
  broker: 'Broker',
} as const
