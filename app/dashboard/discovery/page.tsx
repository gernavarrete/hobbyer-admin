'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import MetricCard from '@/components/MetricCard'
import ErrorState from '@/components/ErrorState'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

interface SwipesStats {
  total_likes: number
  total_dislikes: number
  total_superlikes: number
  period_days: number
}

interface MatchesStats {
  total_matches: number
  match_rate_pct: number
  avg_hours_to_match: number
}

export default function DiscoveryPage() {
  const [swipes, setSwipes] = useState<SwipesStats | null>(null)
  const [matches, setMatches] = useState<MatchesStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchData = () => {
    setLoading(true)
    setError(false)
    Promise.all([
      api.get('/admin/swipes/stats'),
      api.get('/admin/matches/stats'),
    ])
      .then(([swipesRes, matchesRes]) => {
        setSwipes(swipesRes.data)
        setMatches(matchesRes.data)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  if (loading) return (
    <div className="p-8">
      <div className="mb-8">
        <div className="h-8 w-40 bg-[#252b3b] rounded animate-pulse mb-2" />
        <div className="h-4 w-60 bg-[#252b3b] rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-6">
            <div className="h-3 w-20 bg-[#252b3b] rounded animate-pulse mb-4" />
            <div className="h-10 w-16 bg-[#252b3b] rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )

  if (error) return (
    <div className="p-8">
      <ErrorState message="Error al cargar estadísticas de discovery" onRetry={fetchData} />
    </div>
  )

  const chartData = swipes ? [
    { name: 'Likes', value: swipes.total_likes, color: '#22c55e' },
    { name: 'Dislikes', value: swipes.total_dislikes, color: '#ef4444' },
    { name: 'Superlikes', value: swipes.total_superlikes, color: '#0d59f2' },
  ] : []

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Discovery</h2>
        <p className="text-slate-400 mt-1 text-sm">Estadísticas de swipes y matches</p>
      </div>

      {/* Swipes */}
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Swipes</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard title="Likes" value={swipes?.total_likes ?? 0} accent />
        <MetricCard title="Dislikes" value={swipes?.total_dislikes ?? 0} />
        <MetricCard title="Superlikes" value={swipes?.total_superlikes ?? 0} />
        <MetricCard
          title="Período"
          value={`${swipes?.period_days ?? 30} días`}
          subtitle="Ventana de análisis"
        />
      </div>

      {/* Chart */}
      {chartData.some(d => d.value > 0) && (
        <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-6 mb-8">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
            Distribución de swipes
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#252b3b" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1b212d',
                  border: '1px solid #252b3b',
                  borderRadius: '12px',
                  color: '#fff',
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Matches */}
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Matches</h3>
      <div className="grid grid-cols-3 gap-4">
        <MetricCard title="Total matches" value={matches?.total_matches ?? 0} accent />
        <MetricCard title="Match rate" value={`${matches?.match_rate_pct ?? 0}%`} />
        <MetricCard
          title="Tiempo al match"
          value={`${matches?.avg_hours_to_match ?? 0}h`}
          subtitle="Promedio"
        />
      </div>
    </div>
  )
}
