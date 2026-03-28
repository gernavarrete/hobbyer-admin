'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import MetricCard from '@/components/MetricCard'
import TableSkeleton from '@/components/TableSkeleton'
import ErrorState from '@/components/ErrorState'
import Toast from '@/components/Toast'
import useToast from '@/hooks/useToast'
import { Download, ArrowRight } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

interface GrowthPoint {
  week: string
  new_users: number
}

interface HobbyRow {
  name: string
  category_name: string | null
  user_count: number
}

interface Funnel {
  registered: number
  with_hobbies: number
  with_photo: number
  swiped_at_least_once: number
  matched: number
}

export default function AnalyticsPage() {
  const [growth, setGrowth] = useState<GrowthPoint[]>([])
  const [hobbies, setHobbies] = useState<HobbyRow[]>([])
  const [funnel, setFunnel] = useState<Funnel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const { toast, showSuccess, hide } = useToast()

  const fetchData = () => {
    setLoading(true)
    setError(false)
    Promise.all([
      api.get('/admin/analytics/growth').catch(() => ({ data: { data: [] } })),
      api.get('/admin/analytics/hobbies').catch(() => ({ data: { data: [] } })),
      api.get('/admin/analytics/funnel').catch(() => ({ data: null })),
    ])
      .then(([growthRes, hobbiesRes, funnelRes]) => {
        setGrowth(growthRes.data.data || [])
        setHobbies(hobbiesRes.data.data || [])
        setFunnel(funnelRes.data)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
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

  if (error) return (
    <div className="p-8">
      <ErrorState message="Error al cargar analytics" onRetry={fetchData} />
    </div>
  )

  // Funnel steps
  const funnelSteps = funnel ? [
    { label: 'Registrados', value: funnel.registered },
    { label: 'Con hobbies', value: funnel.with_hobbies },
    { label: 'Con foto', value: funnel.with_photo },
    { label: 'Swipearon', value: funnel.swiped_at_least_once },
    { label: 'Con match', value: funnel.matched },
  ] : []

  // Format growth chart data
  const growthChart = growth.map(g => ({
    week: new Date(g.week).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
    new_users: g.new_users,
  }))

  // Top 10 hobbies for bar chart
  const hobbiesChart = hobbies.slice(0, 10).map(h => ({
    name: h.name.length > 15 ? h.name.slice(0, 15) + '…' : h.name,
    user_count: h.user_count,
  }))

  return (
    <div className="p-8">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={hide} />

      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Analytics</h2>
        <p className="text-slate-400 mt-1 text-sm">Métricas de crecimiento, hobbies y conversión</p>
      </div>

      {/* Growth Chart */}
      {growthChart.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
            Crecimiento semanal (últimas 12 semanas)
          </h3>
          <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#252b3b" />
                <XAxis dataKey="week" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1b212d',
                    border: '1px solid #252b3b',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="new_users"
                  stroke="#0d59f2"
                  strokeWidth={2}
                  dot={{ fill: '#0d59f2', r: 4 }}
                  name="Nuevos usuarios"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Hobbies Bar Chart */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Hobbies populares (top 10)
          </h3>
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
        {hobbiesChart.length > 0 ? (
          <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-6">
            <ResponsiveContainer width="100%" height={hobbiesChart.length * 40 + 40}>
              <BarChart data={hobbiesChart} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#252b3b" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1b212d',
                    border: '1px solid #252b3b',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="user_count" fill="#0d59f2" radius={[0, 8, 8, 0]} name="Usuarios" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-12 text-center">
            <p className="text-slate-400 text-sm">No hay datos de hobbies disponibles</p>
          </div>
        )}
      </div>

      {/* Funnel */}
      {funnel && (
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
            Funnel de conversión
          </h3>
          <div className="flex items-stretch gap-2">
            {funnelSteps.map((step, i) => {
              const prevValue = i > 0 ? funnelSteps[i - 1].value : step.value
              const pct = prevValue > 0 ? Math.round((step.value / prevValue) * 100) : 0

              return (
                <div key={step.label} className="flex items-center gap-2 flex-1">
                  <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-5 flex-1 text-center">
                    <p className="text-2xl font-bold text-white">{step.value.toLocaleString()}</p>
                    <p className="text-xs text-slate-400 mt-1">{step.label}</p>
                    {i > 0 && (
                      <p className={`text-xs font-semibold mt-2 ${
                        pct >= 50 ? 'text-green-400' : pct >= 20 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {pct}%
                      </p>
                    )}
                  </div>
                  {i < funnelSteps.length - 1 && (
                    <ArrowRight size={16} className="text-slate-600 shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
