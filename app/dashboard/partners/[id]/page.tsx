'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import ErrorState from '@/components/ErrorState'
import { useAdminRole } from '@/hooks/useAdminRole'

interface PartnerDetail {
  id: string
  name: string
  rating: number | null
  active_offer: string | null
  hobby_name: string | null
  created_at: string
}

interface Subscription {
  subscription_id: string
  plan: string
  status: string
  started_at: string | null
  expires_at: string | null
  days_until_expiry: number | null
}

interface Performance {
  total_suggestions: number
  total_clicks: number
  total_redeemed: number
  click_rate: number
  redemption_rate: number
  last_30_days: {
    total_suggestions: number
    total_clicks: number
    total_redeemed: number
    click_rate: number
    redemption_rate: number
  }
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

export default function PartnerDetailPage() {
  const params = useParams()
  const id = params.id as string
  const role = useAdminRole()

  const [tab, setTab] = useState<'profile' | 'subscription'>('profile')
  const [partner, setPartner] = useState<PartnerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Subscription tab state
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [performance, setPerformance] = useState<Performance | null>(null)
  const [loadingSub, setLoadingSub] = useState(false)
  const [subLoaded, setSubLoaded] = useState(false)
  const [changingPlan, setChangingPlan] = useState(false)
  const [newPlan, setNewPlan] = useState('')
  const [subError, setSubError] = useState<string | null>(null)

  const fetchPartner = () => {
    setLoading(true)
    setError(false)
    api.get(`/admin/partners/${id}`)
      .then(res => setPartner(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  const fetchSubTab = () => {
    setLoadingSub(true)
    Promise.all([
      api.get<{ data: Subscription[] }>(`/admin/subscriptions?partner_id=${id}&limit=1`).catch(() => null),
      api.get<Performance>(`/admin/partners/${id}/performance`).catch(() => null),
    ]).then(([subRes, perfRes]) => {
      if (subRes?.data?.data?.length) {
        setSubscription(subRes.data.data[0])
        setNewPlan(subRes.data.data[0].plan)
      }
      if (perfRes?.data) setPerformance(perfRes.data)
      setSubLoaded(true)
    }).finally(() => setLoadingSub(false))
  }

  useEffect(() => { fetchPartner() }, [id])

  useEffect(() => {
    if (tab === 'subscription' && !subLoaded) fetchSubTab()
  }, [tab, id])

  const patchPartner = async (fields: Record<string, unknown>) => {
    setSubError(null)
    try {
      await api.patch(`/admin/partners/${id}`, fields)
      fetchSubTab()
      setSubLoaded(false)
    } catch {
      setSubError('Error al actualizar. Intenta nuevamente.')
    }
  }

  const tabClass = (t: string) =>
    `px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
      tab === t
        ? 'bg-[#0d59f2] text-white'
        : 'text-slate-400 hover:text-white hover:bg-[#1b212d]'
    }`

  if (loading) return (
    <div className="p-8 max-w-2xl">
      <div className="h-8 w-48 bg-[#252b3b] rounded animate-pulse mb-6" />
      <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-5 bg-[#252b3b] rounded animate-pulse" style={{ width: `${60 + i * 5}%` }} />
          ))}
        </div>
      </div>
    </div>
  )

  if (error || !partner) return (
    <div className="p-8">
      <ErrorState message="Partner no encontrado" onRetry={fetchPartner} />
    </div>
  )

  return (
    <div className="p-8 max-w-3xl">
      <h2 className="text-2xl font-extrabold text-white tracking-tight mb-6">{partner.name}</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('profile')} className={tabClass('profile')}>
          Perfil
        </button>
        <button onClick={() => setTab('subscription')} className={tabClass('subscription')}>
          Suscripción
        </button>
      </div>

      {/* Profile tab */}
      {tab === 'profile' && (
        <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-6">
          <div className="space-y-5">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Oferta activa</p>
              <p className="text-white">{partner.active_offer || 'Sin oferta activa'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Rating</p>
              <p className="text-white">
                {partner.rating !== null ? (
                  <span className="text-yellow-400">{'★'} {partner.rating.toFixed(1)}</span>
                ) : 'Sin calificación'}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Hobby relacionado</p>
              <p className="text-white">
                {partner.hobby_name ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#0d59f2]/10 text-[#0d59f2]">
                    {partner.hobby_name}
                  </span>
                ) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Fecha de alta</p>
              <p className="text-white text-sm">
                {new Date(partner.created_at).toLocaleDateString('es-AR', {
                  day: '2-digit', month: 'long', year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Subscription tab */}
      {tab === 'subscription' && (
        <div className="space-y-6">
          {loadingSub ? (
            <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-6 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-5 bg-[#252b3b] rounded animate-pulse" style={{ width: `${50 + i * 10}%` }} />
              ))}
            </div>
          ) : !subscription ? (
            <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-12 text-center">
              <p className="text-slate-400">Sin suscripción registrada para este partner.</p>
            </div>
          ) : (
            <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-5">Plan activo</h3>
              <div className="grid grid-cols-2 gap-5 mb-6">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Plan</p>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${PLAN_BADGE[subscription.plan] ?? 'bg-slate-500/20 text-slate-300'}`}>
                    {subscription.plan}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Estado</p>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[subscription.status] ?? 'bg-slate-500/20 text-slate-300'}`}>
                    {subscription.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Inicio</p>
                  <p className="text-white text-sm">
                    {subscription.started_at
                      ? new Date(subscription.started_at).toLocaleDateString('es-AR')
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Vencimiento</p>
                  <p className="text-white text-sm">
                    {subscription.expires_at
                      ? new Date(subscription.expires_at).toLocaleDateString('es-AR')
                      : 'Sin vencimiento'}
                  </p>
                  {subscription.days_until_expiry !== null && subscription.days_until_expiry <= 7 && (
                    <span className="text-amber-400 text-xs mt-0.5 block">
                      Vence en {subscription.days_until_expiry} días
                    </span>
                  )}
                </div>
              </div>

              {role !== 'support' && (
                <div className="border-t border-[#252b3b] pt-5 space-y-3">
                  {/* Change plan */}
                  <div className="flex items-center gap-3">
                    {changingPlan ? (
                      <>
                        <select
                          value={newPlan}
                          onChange={e => setNewPlan(e.target.value)}
                          className="px-3 py-2 rounded-xl bg-[#101622] border border-[#252b3b] text-white text-sm focus:outline-none focus:border-[#0d59f2]"
                        >
                          <option value="starter">Starter</option>
                          <option value="pro">Pro</option>
                          <option value="business">Business</option>
                        </select>
                        <button
                          onClick={() => { patchPartner({ plan: newPlan }); setChangingPlan(false) }}
                          className="px-4 py-2 rounded-xl bg-[#0d59f2] text-white text-sm font-semibold hover:bg-blue-600 transition-all"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setChangingPlan(false)}
                          className="px-4 py-2 rounded-xl text-slate-400 text-sm hover:text-white transition-all"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setChangingPlan(true)}
                        className="px-4 py-2 rounded-xl bg-[#1b212d] border border-[#252b3b] text-slate-300 text-sm font-semibold hover:bg-[#252b3b] transition-all"
                      >
                        Cambiar plan
                      </button>
                    )}
                  </div>

                  {/* Status actions */}
                  <div className="flex gap-2">
                    {subscription.status !== 'active' && (
                      <button
                        onClick={() => patchPartner({ status: 'active' })}
                        className="px-4 py-2 rounded-xl bg-green-500/20 text-green-400 text-sm font-semibold hover:bg-green-500/30 transition-all"
                      >
                        Reactivar
                      </button>
                    )}
                    {subscription.status !== 'suspended' && (
                      <button
                        onClick={() => patchPartner({ status: 'suspended' })}
                        className="px-4 py-2 rounded-xl bg-yellow-500/20 text-yellow-400 text-sm font-semibold hover:bg-yellow-500/30 transition-all"
                      >
                        Suspender
                      </button>
                    )}
                  </div>

                  {subError && <p className="text-red-400 text-sm">{subError}</p>}
                </div>
              )}
            </div>
          )}

          {/* Performance */}
          {performance && (
            <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-5">Performance (total)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Sugerencias', value: performance.total_suggestions },
                  { label: 'Clicks', value: performance.total_clicks },
                  { label: 'Redenciones', value: performance.total_redeemed },
                  { label: 'Click rate', value: `${(performance.click_rate * 100).toFixed(1)}%` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-[#101622] rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-1">{label}</p>
                    <p className="text-xl font-bold text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
