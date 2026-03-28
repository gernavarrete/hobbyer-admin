'use client'
import { useEffect, useState, useRef } from 'react'
import api from '@/lib/api'
import Toast from '@/components/Toast'
import useToast from '@/hooks/useToast'
import TableSkeleton from '@/components/TableSkeleton'
import ErrorState from '@/components/ErrorState'

interface Flag {
  key: string
  value: boolean
  description: string | null
  updated_by: string | null
  updated_at: string | null
}

interface Health {
  db_ok: boolean
  db_latency_ms: number
  api_version: string
  uptime: string
  timestamp: string
}

export default function ConfigPage() {
  const [flags, setFlags] = useState<Flag[]>([])
  const [loadingFlags, setLoadingFlags] = useState(true)
  const [errorFlags, setErrorFlags] = useState(false)

  const [health, setHealth] = useState<Health | null>(null)
  const [loadingHealth, setLoadingHealth] = useState(true)

  const { toast, showSuccess, showError, hide } = useToast()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchFlags = () => {
    setLoadingFlags(true)
    setErrorFlags(false)
    api.get('/admin/feature-flags')
      .then(res => setFlags(res.data.data))
      .catch(() => setErrorFlags(true))
      .finally(() => setLoadingFlags(false))
  }

  const fetchHealth = () => {
    setLoadingHealth(true)
    api.get('/admin/system/health')
      .then(res => setHealth(res.data))
      .catch(() => setHealth(null))
      .finally(() => setLoadingHealth(false))
  }

  useEffect(() => {
    fetchFlags()
    fetchHealth()
    intervalRef.current = setInterval(fetchHealth, 60000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const toggleFlag = async (key: string, currentValue: boolean) => {
    try {
      await api.put(`/admin/feature-flags/${key}`, { value: !currentValue })
      setFlags(prev =>
        prev.map(f => f.key === key ? { ...f, value: !currentValue } : f)
      )
      showSuccess(`Flag "${key}" actualizado`)
    } catch {
      showError('Error al actualizar flag')
    }
  }

  return (
    <div className="p-8">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={hide} />

      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Configuración</h2>
        <p className="text-slate-400 mt-1 text-sm">Feature flags y estado del sistema</p>
      </div>

      {/* Feature Flags */}
      <div className="mb-10">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Feature Flags</h3>
        {loadingFlags ? (
          <TableSkeleton rows={4} cols={3} />
        ) : errorFlags ? (
          <ErrorState message="Error al cargar feature flags" onRetry={fetchFlags} />
        ) : (
          <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#252b3b]">
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Flag</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Descripción</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Último cambio</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody>
                {flags.map(flag => (
                  <tr key={flag.key} className="border-b border-[#252b3b]/50 hover:bg-[#252b3b]/50 transition-colors">
                    <td className="px-6 py-4 text-white font-mono text-xs">{flag.key}</td>
                    <td className="px-6 py-4 text-slate-300 text-xs">{flag.description || '—'}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {flag.updated_by && <span className="text-slate-300">{flag.updated_by}</span>}
                      {flag.updated_at && (
                        <span className="ml-2">
                          {new Date(flag.updated_at).toLocaleDateString('es-AR', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      )}
                      {!flag.updated_by && !flag.updated_at && '—'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleFlag(flag.key, flag.value)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                          ${flag.value ? 'bg-[#0d59f2]' : 'bg-[#252b3b]'}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 rounded-full bg-white transition-transform
                            ${flag.value ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* System Health */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">System Health</h3>
          <button
            onClick={fetchHealth}
            disabled={loadingHealth}
            className="px-4 py-2 rounded-xl bg-[#1b212d] border border-[#252b3b] text-sm
              text-slate-300 hover:bg-[#252b3b] disabled:opacity-50 transition-all"
          >
            {loadingHealth ? 'Cargando...' : 'Refrescar'}
          </button>
        </div>

        {loadingHealth && !health ? (
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-6">
                <div className="h-4 w-20 bg-[#252b3b] rounded animate-pulse mb-3" />
                <div className="h-8 w-16 bg-[#252b3b] rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : health ? (
          <div className="grid grid-cols-3 gap-4">
            <div className={`rounded-2xl p-6 border ${
              health.db_ok
                ? 'bg-green-500/5 border-green-500/20'
                : 'bg-red-500/5 border-red-500/20'
            }`}>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">DB Status</p>
              <p className={`text-2xl font-extrabold ${health.db_ok ? 'text-green-400' : 'text-red-400'}`}>
                {health.db_ok ? 'OK' : 'ERROR'}
              </p>
            </div>
            <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">DB Latencia</p>
              <p className="text-2xl font-extrabold text-white">{health.db_latency_ms} ms</p>
            </div>
            <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">API Version</p>
              <p className="text-2xl font-extrabold text-white">{health.api_version}</p>
              {health.uptime !== 'N/A' && (
                <p className="text-xs text-slate-500 mt-2">Uptime: {health.uptime}</p>
              )}
            </div>
          </div>
        ) : (
          <ErrorState message="Error al cargar estado del sistema" onRetry={fetchHealth} />
        )}
      </div>
    </div>
  )
}
