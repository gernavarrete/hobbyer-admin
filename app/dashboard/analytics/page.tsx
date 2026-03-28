'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import MetricCard from '@/components/MetricCard'
import TableSkeleton from '@/components/TableSkeleton'
import ErrorState from '@/components/ErrorState'
import Toast from '@/components/Toast'
import useToast from '@/hooks/useToast'
import { Download } from 'lucide-react'

interface Overview {
  users: { total: number; today: number; last_7_days: number; this_month: number }
  waitlist: { total: number; today: number }
  groups: { active: number }
  matches: { total: number }
}

interface HobbyRow {
  name: string
  category_name: string | null
  user_count: number
}

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [hobbies, setHobbies] = useState<HobbyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const { toast, showSuccess, hide } = useToast()

  const fetchData = () => {
    setLoading(true)
    setError(false)
    Promise.all([
      api.get('/admin/overview'),
      api.get('/admin/users?limit=1').catch(() => ({ data: { total: 0 } })),
    ])
      .then(([overviewRes]) => {
        setOverview(overviewRes.data)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))

    // Fetch popular hobbies
    api.get('/admin/analytics/hobbies')
      .then(res => setHobbies(res.data.data || []))
      .catch(() => setHobbies([]))
  }

  useEffect(() => { fetchData() }, [])

  const exportCSV = () => {
    if (hobbies.length === 0) return
    const header = 'Hobby,Categoría,Usuarios\n'
    const rows = hobbies.map(h =>
      `"${h.name}","${h.category_name || '—'}",${h.user_count}`
    ).join('\n')
    const csv = header + rows
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `hobbies-analytics-${date}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showSuccess('CSV descargado')
  }

  if (loading) return (
    <div className="p-8">
      <div className="mb-8">
        <div className="h-8 w-40 bg-[#252b3b] rounded animate-pulse mb-2" />
        <div className="h-4 w-60 bg-[#252b3b] rounded animate-pulse" />
      </div>
      <TableSkeleton rows={5} cols={3} />
    </div>
  )

  if (error || !overview) return (
    <div className="p-8">
      <ErrorState message="Error al cargar analytics" onRetry={fetchData} />
    </div>
  )

  return (
    <div className="p-8">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={hide} />

      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Analytics</h2>
        <p className="text-slate-400 mt-1 text-sm">Métricas de crecimiento y engagement</p>
      </div>

      {/* Growth metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard title="Usuarios totales" value={overview.users.total} accent />
        <MetricCard title="Nuevos hoy" value={overview.users.today} />
        <MetricCard title="Últimos 7 días" value={overview.users.last_7_days} />
        <MetricCard title="Este mes" value={overview.users.this_month} />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <MetricCard title="Matches totales" value={overview.matches.total} accent />
        <MetricCard title="Grupos activos" value={overview.groups.active} />
        <MetricCard title="Waitlist total" value={overview.waitlist.total} />
      </div>

      {/* Hobbies populares */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Hobbies populares</h3>
          {hobbies.length > 0 && (
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1b212d] border border-[#252b3b]
                text-sm text-slate-300 hover:bg-[#252b3b] transition-all"
            >
              <Download size={14} />
              Exportar CSV
            </button>
          )}
        </div>
        {hobbies.length === 0 ? (
          <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-12 text-center">
            <p className="text-slate-400 text-sm">No hay datos de hobbies disponibles</p>
          </div>
        ) : (
          <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#252b3b]">
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Hobby</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Categoría</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Usuarios</th>
                </tr>
              </thead>
              <tbody>
                {hobbies.map(h => (
                  <tr key={h.name} className="border-b border-[#252b3b]/50 hover:bg-[#252b3b]/50 transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{h.name}</td>
                    <td className="px-6 py-4 text-slate-400">{h.category_name || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-[#0d59f2]/10 text-[#0d59f2]">
                        {h.user_count}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
