'use client'
import { useEffect, useState, useRef } from 'react'
import api from '@/lib/api'

interface Health {
  db_ok: boolean
  db_latency_ms: number
  api_version: string
  uptime: string
  timestamp: string
}

interface EndpointStatus {
  path: string
  label: string
  ok: boolean | null
  latency_ms: number | null
  error?: string
}

const CRITICAL_ENDPOINTS: { path: string; label: string }[] = [
  { path: '/health', label: 'GET /health' },
  { path: '/admin/overview', label: 'GET /admin/overview' },
  { path: '/admin/users?limit=1', label: 'GET /admin/users' },
  { path: '/admin/partners?limit=1', label: 'GET /admin/partners' },
]

function LatencyBadge({ ms }: { ms: number }) {
  const color =
    ms < 100 ? 'bg-green-500/10 text-green-400' :
    ms < 500 ? 'bg-amber-500/10 text-amber-400' :
    'bg-red-500/10 text-red-400'
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>
      {ms} ms
    </span>
  )
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<Health | null>(null)
  const [loadingHealth, setLoadingHealth] = useState(true)
  const [endpoints, setEndpoints] = useState<EndpointStatus[]>(
    CRITICAL_ENDPOINTS.map(e => ({ ...e, ok: null, latency_ms: null }))
  )
  const [checkingEndpoints, setCheckingEndpoints] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchHealth = () => {
    setLoadingHealth(true)
    api.get('/admin/system/health')
      .then(res => setHealth(res.data))
      .catch(() => setHealth(null))
      .finally(() => setLoadingHealth(false))
  }

  const checkEndpoints = async () => {
    setCheckingEndpoints(true)
    const results = await Promise.all(
      CRITICAL_ENDPOINTS.map(async (ep) => {
        const start = performance.now()
        try {
          await api.get(ep.path)
          const latency = Math.round(performance.now() - start)
          return { ...ep, ok: true, latency_ms: latency }
        } catch (err: unknown) {
          const latency = Math.round(performance.now() - start)
          let msg = 'Error desconocido'
          if (err && typeof err === 'object' && 'response' in err) {
            const r = (err as { response?: { status?: number; data?: { detail?: string } } }).response
            msg = r?.data?.detail || `HTTP ${r?.status}`
          }
          return { ...ep, ok: false, latency_ms: latency, error: msg }
        }
      })
    )
    setEndpoints(results)
    setCheckingEndpoints(false)
  }

  useEffect(() => {
    fetchHealth()
    checkEndpoints()
    intervalRef.current = setInterval(() => {
      fetchHealth()
    }, 30000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const dbColor =
    !health ? 'bg-[#1b212d] border-[#252b3b]' :
    health.db_ok ? 'bg-green-500/5 border-green-500/20' :
    'bg-red-500/5 border-red-500/20'

  const dbTextColor =
    !health ? 'text-slate-500' :
    health.db_ok ? 'text-green-400' : 'text-red-400'

  const latencyColor =
    !health ? 'text-slate-400' :
    health.db_latency_ms < 100 ? 'text-green-400' :
    health.db_latency_ms < 500 ? 'text-amber-400' : 'text-red-400'

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Sistema</h2>
          <p className="text-slate-400 mt-1 text-sm">Estado de servicios y latencia en tiempo real</p>
        </div>
        <button
          onClick={() => { fetchHealth(); checkEndpoints() }}
          disabled={loadingHealth || checkingEndpoints}
          className="px-4 py-2 rounded-xl bg-[#1b212d] border border-[#252b3b] text-sm
            text-slate-300 hover:bg-[#252b3b] disabled:opacity-50 transition-all"
        >
          {loadingHealth || checkingEndpoints ? 'Actualizando...' : 'Refrescar'}
        </button>
      </div>

      {/* Status cards 2x2 */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* API Backend */}
        <div className={`rounded-2xl p-6 border ${
          health ? 'bg-green-500/5 border-green-500/20' : 'bg-[#1b212d] border-[#252b3b]'
        }`}>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">API Backend</p>
          {loadingHealth ? (
            <div className="h-8 w-16 bg-[#252b3b] rounded animate-pulse" />
          ) : (
            <p className={`text-2xl font-extrabold ${health ? 'text-green-400' : 'text-red-400'}`}>
              {health ? 'Online' : 'Error'}
            </p>
          )}
          {health && (
            <p className="text-xs text-slate-500 mt-1">v{health.api_version}</p>
          )}
        </div>

        {/* Base de datos */}
        <div className={`rounded-2xl p-6 border ${dbColor}`}>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Base de datos</p>
          {loadingHealth ? (
            <div className="h-8 w-20 bg-[#252b3b] rounded animate-pulse" />
          ) : health ? (
            <>
              <p className={`text-2xl font-extrabold ${dbTextColor}`}>
                {health.db_ok ? 'OK' : 'ERROR'}
              </p>
              <p className={`text-xs mt-1 font-semibold ${latencyColor}`}>
                {health.db_latency_ms} ms
              </p>
            </>
          ) : (
            <p className="text-2xl font-extrabold text-slate-500">—</p>
          )}
        </div>

        {/* EC2 Uptime */}
        <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">EC2 Uptime</p>
          {loadingHealth ? (
            <div className="h-8 w-16 bg-[#252b3b] rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-extrabold text-white">
              {health?.uptime && health.uptime !== 'N/A' ? health.uptime : '—'}
            </p>
          )}
        </div>

        {/* Último check */}
        <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Último check</p>
          {loadingHealth ? (
            <div className="h-8 w-28 bg-[#252b3b] rounded animate-pulse" />
          ) : health ? (
            <p className="text-sm font-bold text-white">
              {new Date(health.timestamp).toLocaleTimeString('es-AR', {
                hour: '2-digit', minute: '2-digit', second: '2-digit',
              })}
            </p>
          ) : (
            <p className="text-2xl font-extrabold text-slate-500">—</p>
          )}
          <p className="text-xs text-slate-600 mt-1">Refresca cada 30s</p>
        </div>
      </div>

      {/* Tabla de endpoints críticos */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Endpoints críticos</h3>
        <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#252b3b]">
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Endpoint</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Latencia</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map(ep => (
                <tr key={ep.path} className="border-b border-[#252b3b]/50">
                  <td className="px-6 py-4 text-white font-mono text-xs">{ep.label}</td>
                  <td className="px-6 py-4">
                    {checkingEndpoints || ep.ok === null ? (
                      <div className="h-5 w-12 bg-[#252b3b] rounded animate-pulse" />
                    ) : ep.ok ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400">OK</span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400">ERROR</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {checkingEndpoints || ep.latency_ms === null ? (
                      <div className="h-5 w-14 bg-[#252b3b] rounded animate-pulse" />
                    ) : (
                      <LatencyBadge ms={ep.latency_ms} />
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs max-w-xs truncate">
                    {ep.ok === false && ep.error ? (
                      <span className="text-red-400">{ep.error}</span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
