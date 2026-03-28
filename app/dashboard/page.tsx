'use client'
import { useEffect, useState } from 'react'
import MetricCard from '@/components/MetricCard'
import TableSkeleton from '@/components/TableSkeleton'
import ErrorState from '@/components/ErrorState'
import api from '@/lib/api'

interface Overview {
  users: {
    total: number
    today: number
    last_7_days: number
    this_month: number
  }
  waitlist: {
    total: number
    today: number
  }
  groups: { active: number }
  matches: { total: number }
}

export default function DashboardPage() {
  const [data, setData] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchData = () => {
    setLoading(true)
    setError(false)
    api.get('/admin/overview')
      .then(res => setData(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  if (loading) return (
    <div className="p-8">
      <div className="mb-8">
        <div className="h-8 w-32 bg-[#252b3b] rounded animate-pulse mb-2" />
        <div className="h-4 w-48 bg-[#252b3b] rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-6">
            <div className="h-3 w-20 bg-[#252b3b] rounded animate-pulse mb-4" />
            <div className="h-10 w-16 bg-[#252b3b] rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )

  if (error || !data) return (
    <div className="p-8">
      <ErrorState message="Error al cargar métricas" onRetry={fetchData} />
    </div>
  )

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Overview
        </h2>
        <p className="text-slate-400 mt-1 text-sm">
          Métricas generales de Hobbyer
        </p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Usuarios totales"
          value={data.users.total}
          subtitle="Registrados en la app"
          accent
        />
        <MetricCard
          title="Nuevos hoy"
          value={data.users.today}
          subtitle="Usuarios registrados hoy"
        />
        <MetricCard
          title="Esta semana"
          value={data.users.last_7_days}
          subtitle="Últimos 7 días"
        />
        <MetricCard
          title="Este mes"
          value={data.users.this_month}
          subtitle={new Date().toLocaleString('es-AR', { month: 'long', year: 'numeric' })}
        />
      </div>

      {/* Métricas secundarias */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Waitlist total"
          value={data.waitlist.total}
          subtitle="Registrados en hobbyer.club"
          accent
        />
        <MetricCard
          title="Waitlist hoy"
          value={data.waitlist.today}
          subtitle="Nuevos registros hoy"
        />
        <MetricCard
          title="Matches totales"
          value={data.matches.total}
          subtitle="Conexiones realizadas"
        />
      </div>
    </div>
  )
}
