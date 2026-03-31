'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import TableSkeleton from '@/components/TableSkeleton'
import ErrorState from '@/components/ErrorState'

interface Subscription {
  subscription_id: string
  partner_id: string
  partner_name: string
  partner_city: string
  plan: string
  status: string
  started_at: string | null
  expires_at: string | null
  days_until_expiry: number | null
}

const PLAN_BADGE: Record<string, string> = {
  starter: 'bg-slate-500/20 text-slate-300',
  pro: 'bg-orange-500/20 text-orange-400',
  business: 'bg-[#0d59f2]/20 text-[#0d59f2]',
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-500/10 text-green-400',
  suspended: 'bg-yellow-500/10 text-yellow-400',
  cancelled: 'bg-red-500/10 text-red-400',
}

const FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'suspended', label: 'Suspendidos' },
  { value: 'expiring', label: 'Por vencer' },
]

export default function SubscriptionsPage() {
  const router = useRouter()
  const [data, setData] = useState<Subscription[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [filter, setFilter] = useState('')

  const fetchSubscriptions = (statusFilter: string) => {
    setLoading(true)
    setError(false)
    const params = statusFilter && statusFilter !== 'expiring'
      ? `?status=${statusFilter}&limit=100`
      : '?limit=100'
    api.get(`/admin/subscriptions${params}`)
      .then(res => {
        let rows: Subscription[] = res.data.data
        if (statusFilter === 'expiring') {
          rows = rows.filter(r =>
            r.days_until_expiry !== null && r.days_until_expiry <= 7
          )
        }
        setData(rows)
        setTotal(res.data.total)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchSubscriptions(filter) }, [filter])

  const isExpiring = (r: Subscription) =>
    r.days_until_expiry !== null && r.days_until_expiry <= 7 && r.status === 'active'

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Suscripciones</h2>
        <p className="text-slate-400 mt-1 text-sm">Estado de los planes de partners</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === f.value
                ? 'bg-[#0d59f2] text-white'
                : 'text-slate-400 hover:text-white hover:bg-[#1b212d]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : error ? (
        <ErrorState message="Error al cargar suscripciones" onRetry={() => fetchSubscriptions(filter)} />
      ) : data.length === 0 ? (
        <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-12 text-center">
          <p className="text-slate-400 text-lg font-medium">Sin suscripciones</p>
        </div>
      ) : (
        <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#252b3b]">
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Partner</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Plan</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Inicio</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Vencimiento</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Días restantes</th>
              </tr>
            </thead>
            <tbody>
              {data.map(r => (
                <tr
                  key={r.subscription_id}
                  onClick={() => router.push(`/dashboard/partners/${r.partner_id}`)}
                  className={`border-b border-[#252b3b]/50 hover:bg-[#252b3b]/50 transition-colors cursor-pointer ${
                    isExpiring(r) ? 'bg-amber-500/10' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <p className={`font-medium ${r.status === 'suspended' ? 'text-slate-500' : 'text-white'}`}>
                      {r.partner_name}
                    </p>
                    <p className="text-slate-500 text-xs">{r.partner_city}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${PLAN_BADGE[r.plan] ?? 'bg-slate-500/20 text-slate-300'}`}>
                      {r.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[r.status] ?? 'bg-slate-500/20 text-slate-300'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs">
                    {r.started_at ? new Date(r.started_at).toLocaleDateString('es-AR') : '—'}
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs">
                    {r.expires_at ? new Date(r.expires_at).toLocaleDateString('es-AR') : 'Sin vencimiento'}
                  </td>
                  <td className="px-6 py-4">
                    {r.days_until_expiry === null ? (
                      <span className="text-slate-500 text-xs">—</span>
                    ) : isExpiring(r) ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400">
                        Por vencer ({r.days_until_expiry}d)
                      </span>
                    ) : (
                      <span className="text-slate-300 text-xs">{r.days_until_expiry} días</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
