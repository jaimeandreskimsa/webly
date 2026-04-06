'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Download, Rocket, Edit2, Loader2, ExternalLink, RefreshCw, Trash2
} from 'lucide-react'
import type { Sitio } from '@/lib/db/schema'

interface SitioActionsProps {
  sitio: Sitio
}

export function SitioActions({ sitio }: SitioActionsProps) {
  const router = useRouter()
  const [deploying, setDeploying] = useState(false)
  const [deployError, setDeployError] = useState('')
  const [regenerando, setRegenerando] = useState(false)

  async function handleDeploy() {
    setDeploying(true)
    setDeployError('')
    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sitioId: sitio.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.url) window.open(data.url, '_blank')
      router.refresh()
    } catch (err: any) {
      setDeployError(err.message)
    } finally {
      setDeploying(false)
    }
  }

  async function handleRegenerar() {
    setRegenerando(true)
    try {
      const res = await fetch('/api/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sitioId: sitio.id }),
      })
      if (!res.ok) throw new Error('Error al regenerar')
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setRegenerando(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {deployError && (
        <span className="text-xs text-red-400 max-w-32">{deployError}</span>
      )}

      {/* Download */}
      <a
        href={`/api/sitios/${sitio.id}/download`}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass glass-hover text-sm text-muted-foreground hover:text-white transition-all"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Descargar</span>
      </a>

      {/* Editar */}
      <a
        href={`/dashboard/sitios/${sitio.id}/editar`}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass glass-hover text-sm text-muted-foreground hover:text-white transition-all"
      >
        <Edit2 className="w-4 h-4" />
        <span className="hidden sm:inline">Editar</span>
      </a>

      {/* Regenerar */}
      <button
        onClick={handleRegenerar}
        disabled={regenerando || sitio.estado === 'generando'}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass glass-hover text-sm text-muted-foreground hover:text-white transition-all disabled:opacity-40"
      >
        <RefreshCw className={`w-4 h-4 ${regenerando ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">Regenerar</span>
      </button>

      {/* Deploy (solo Pro y Premium) */}
      {sitio.plan !== 'basico' && (
        <button
          onClick={handleDeploy}
          disabled={deploying || sitio.estado === 'generando'}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl btn-gradient text-white text-sm font-semibold disabled:opacity-40 hover:scale-105 transition-transform"
        >
          {deploying ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Publicando...</>
          ) : sitio.deployUrl ? (
            <><RefreshCw className="w-4 h-4" /> Re-publicar</>
          ) : (
            <><Rocket className="w-4 h-4" /> Publicar</>
          )}
        </button>
      )}

      {/* Ver publicado */}
      {sitio.deployUrl && (
        <a
          href={sitio.deployUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-xl glass glass-hover text-green-400 hover:text-green-300 transition-colors"
          title="Ver sitio publicado"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      )}
    </div>
  )
}
