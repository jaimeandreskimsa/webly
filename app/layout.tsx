import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'WeblyNow — Crea tu sitio web con IA en minutos',
  description:
    'Genera un sitio web profesional con inteligencia artificial. Ingresa el contenido de tu negocio y obtén un sitio listo para publicar en minutos.',
  keywords: ['sitio web', 'IA', 'inteligencia artificial', 'crear web', 'diseño web', 'Chile'],
  openGraph: {
    title: 'WeblyNow — Crea tu sitio web con IA',
    description: 'Tu sitio web profesional en minutos con IA',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
