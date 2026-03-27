'use client'
import { useEffect, useState } from 'react'
import MetricCard from '@/components/MetricCard'
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

  useEffect(() => {
    api.get('/api/admin/overview')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="p-8 text-slate-400">Cargando métricas...</div>
  )

  if (!data) return (
    <div className="p-8 text-red-400">Error al cargar métricas.</div>
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
