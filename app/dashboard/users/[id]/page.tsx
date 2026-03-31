'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import TableSkeleton from '@/components/TableSkeleton'
import ErrorState from '@/components/ErrorState'
import Toast from '@/components/Toast'
import useToast from '@/hooks/useToast'
import { useAdminRole } from '@/hooks/useAdminRole'

interface UserDetail {
  id: string
  name: string
  email: string | null
  bio: string | null
  photo_url: string | null
  status: string
  created_at: string
  hobbies: { id: string; name: string; category_name: string | null }[]
  stats: { swipes_given: number; matches: number; groups_joined: number }
}

interface AdminAction {
  id: string
  admin_email: string
  action_type: string
  note: string | null
  created_at: string
}

interface UserReport {
  id: string
  reporter_id: string
  reported_user_id: string
  reason: string
  status: string
  created_at: string
  resolved_at: string | null
  resolution: string | null
}

interface UserBlock {
  id: string
  blocker_id: string
  blocked_id: string
  created_at: string
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-500/10 text-green-400',
  suspended: 'bg-yellow-500/10 text-yellow-400',
  banned: 'bg-red-500/10 text-red-400',
}

const ACTION_COLORS: Record<string, string> = {
  ban_permanent: 'bg-red-500/10 text-red-400',
  banned: 'bg-red-500/10 text-red-400',
  ban_temp: 'bg-orange-500/10 text-orange-400',
  suspended: 'bg-yellow-500/10 text-yellow-400',
  warn: 'bg-yellow-500/10 text-yellow-400',
  active: 'bg-green-500/10 text-green-400',
  dismiss: 'bg-slate-500/10 text-slate-400',
}

type Tab = 'profile' | 'admin'

const tabClass = (current: Tab, t: Tab) =>
  `px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
    current === t
      ? 'bg-[#0d59f2] text-white'
      : 'text-slate-400 hover:text-white hover:bg-[#1b212d]'
  }`

export default function UserDetailPage() {
  const params = useParams()
  const id = params.id as string
  const role = useAdminRole()

  const [tab, setTab] = useState<Tab>('profile')
  const [user, setUser] = useState<UserDetail | null>(null)
  const [actions, setActions] = useState<AdminAction[]>([])
  const [reports, setReports] = useState<UserReport[]>([])
  const [blocks, setBlocks] = useState<UserBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingAdmin, setLoadingAdmin] = useState(false)
  const [error, setError] = useState(false)
  const [acting, setActing] = useState(false)
  const { toast, showSuccess, showError, hide } = useToast()

  const fetchUser = () => {
    setLoading(true)
    setError(false)
    api.get(`/admin/users/${id}`)
      .then(res => setUser(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  const fetchActions = () => {
    api.get(`/admin/users/${id}/actions`)
      .then(res => setActions(res.data.data))
      .catch(() => {})
  }

  const fetchAdminTab = () => {
    setLoadingAdmin(true)
    Promise.all([
      api.get(`/admin/users/${id}/reports`).then(res => setReports(res.data.data)).catch(() => {}),
      api.get(`/admin/users/${id}/blocks`).then(res => setBlocks(res.data.data)).catch(() => {}),
    ]).finally(() => setLoadingAdmin(false))
  }

  useEffect(() => {
    fetchUser()
    fetchActions()
  }, [id])

  useEffect(() => {
    if (tab === 'admin') fetchAdminTab()
  }, [tab, id])

  const changeStatus = async (status: string) => {
    setActing(true)
    try {
      await api.patch(`/admin/users/${id}/status`, { status, note: `Cambio manual a ${status}` })
      showSuccess(`Estado cambiado a ${status}`)
      fetchUser()
      fetchActions()
    } catch {
      showError('Error al cambiar estado')
    } finally {
      setActing(false)
    }
  }

  if (loading) return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-start gap-5 mb-8">
        <div className="w-20 h-20 rounded-2xl bg-[#252b3b] animate-pulse" />
        <div className="flex-1">
          <div className="h-8 w-48 bg-[#252b3b] rounded animate-pulse mb-2" />
          <div className="h-4 w-32 bg-[#252b3b] rounded animate-pulse" />
        </div>
      </div>
      <TableSkeleton rows={3} cols={3} />
    </div>
  )

  if (error || !user) return (
    <div className="p-8">
      <ErrorState message="Usuario no encontrado" onRetry={fetchUser} />
    </div>
  )

  const initial = (user.name || '?')[0].toUpperCase()

  return (
    <div className="p-8 max-w-4xl">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={hide} />

      {/* Header */}
      <div className="flex items-start gap-5 mb-8">
        {user.photo_url ? (
          <img src={user.photo_url} alt={user.name}
            className="w-20 h-20 rounded-2xl object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-[#0d59f2]/20 flex items-center justify-center
            text-[#0d59f2] text-2xl font-bold">
            {initial}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-extrabold text-white">{user.name}</h2>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[user.status] || STATUS_BADGE.active}`}>
              {user.status}
            </span>
          </div>
          <p className="text-slate-400 mt-1">{user.email || 'Sin email'}</p>
          {user.bio && <p className="text-slate-300 mt-2 text-sm">{user.bio}</p>}
          <p className="text-slate-500 text-xs mt-2">
            Registrado el {new Date(user.created_at).toLocaleDateString('es-AR')}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        <button onClick={() => setTab('profile')} className={tabClass(tab, 'profile')}>
          Perfil
        </button>
        <button onClick={() => setTab('admin')} className={tabClass(tab, 'admin')}>
          Acciones admin {actions.length > 0 && `(${actions.length})`}
        </button>
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Swipes dados', value: user.stats.swipes_given },
              { label: 'Matches', value: user.stats.matches },
              { label: 'Grupos', value: user.stats.groups_joined },
            ].map(s => (
              <div key={s.label} className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-5">
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-slate-400 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Hobbies */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Hobbies</h3>
            {user.hobbies.length === 0 ? (
              <p className="text-slate-500 text-sm">Sin hobbies registrados</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {user.hobbies.map(h => (
                  <span key={h.id} className="px-3 py-1.5 rounded-xl bg-[#0d59f2]/10 text-[#0d59f2]
                    text-xs font-semibold">
                    {h.name}
                    {h.category_name && (
                      <span className="text-[#0d59f2]/50 ml-1">/ {h.category_name}</span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Moderation Actions */}
          {role !== 'support' && (
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                Cambiar estado
              </h3>
              <div className="flex gap-3">
                {user.status !== 'active' && (
                  <button onClick={() => changeStatus('active')} disabled={acting}
                    className="px-4 py-2 rounded-xl bg-green-500/20 text-green-400 text-sm font-semibold
                      hover:bg-green-500/30 disabled:opacity-50 transition-all">
                    Activar cuenta
                  </button>
                )}
                {user.status !== 'suspended' && (
                  <button onClick={() => changeStatus('suspended')} disabled={acting}
                    className="px-4 py-2 rounded-xl bg-yellow-500/20 text-yellow-400 text-sm font-semibold
                      hover:bg-yellow-500/30 disabled:opacity-50 transition-all">
                    Suspender
                  </button>
                )}
                {user.status !== 'banned' && (
                  <button onClick={() => changeStatus('banned')} disabled={acting}
                    className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 text-sm font-semibold
                      hover:bg-red-500/30 disabled:opacity-50 transition-all">
                    Banear
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Admin Tab */}
      {tab === 'admin' && (
        <>
          {loadingAdmin ? (
            <TableSkeleton rows={4} cols={4} />
          ) : (
            <>
              {/* Reports */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Reportes ({reports.length})
                </h3>
                {reports.length === 0 ? (
                  <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-8 text-center">
                    <p className="text-slate-500 text-sm">Sin reportes registrados</p>
                  </div>
                ) : (
                  <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#252b3b]">
                          <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase">Motivo</th>
                          <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase">Estado</th>
                          <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase">Resolución</th>
                          <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase">Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.map(r => (
                          <tr key={r.id} className="border-b border-[#252b3b]/50">
                            <td className="px-5 py-3 text-slate-300">{r.reason}</td>
                            <td className="px-5 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                r.status === 'pending'
                                  ? 'bg-yellow-500/10 text-yellow-400'
                                  : 'bg-green-500/10 text-green-400'
                              }`}>{r.status}</span>
                            </td>
                            <td className="px-5 py-3 text-slate-400 text-xs">{r.resolution || '—'}</td>
                            <td className="px-5 py-3 text-slate-400 text-xs">
                              {new Date(r.created_at).toLocaleDateString('es-AR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Blocks */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Bloqueos ({blocks.length})
                </h3>
                {blocks.length === 0 ? (
                  <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-8 text-center">
                    <p className="text-slate-500 text-sm">Sin bloqueos registrados</p>
                  </div>
                ) : (
                  <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#252b3b]">
                          <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase">Bloqueador</th>
                          <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase">Bloqueado</th>
                          <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase">Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {blocks.map(b => (
                          <tr key={b.id} className="border-b border-[#252b3b]/50">
                            <td className="px-5 py-3 text-white font-mono text-xs">{b.blocker_id.slice(0, 8)}...</td>
                            <td className="px-5 py-3 text-white font-mono text-xs">{b.blocked_id.slice(0, 8)}...</td>
                            <td className="px-5 py-3 text-slate-400 text-xs">
                              {new Date(b.created_at).toLocaleDateString('es-AR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Admin action timeline */}
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Historial de acciones admin
                </h3>
                {actions.length === 0 ? (
                  <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-8 text-center">
                    <p className="text-slate-400 text-sm font-medium">Sin acciones registradas</p>
                    <p className="text-slate-500 text-xs mt-1">No se han aplicado acciones administrativas sobre este usuario</p>
                  </div>
                ) : (
                  <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#252b3b]">
                          <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase">Admin</th>
                          <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase">Acción</th>
                          <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase">Nota</th>
                          <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase">Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {actions.map(a => (
                          <tr key={a.id} className="border-b border-[#252b3b]/50">
                            <td className="px-5 py-3 text-slate-300">{a.admin_email}</td>
                            <td className="px-5 py-3">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ACTION_COLORS[a.action_type] || 'bg-slate-500/10 text-slate-400'}`}>
                                {a.action_type}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-slate-400">{a.note || '—'}</td>
                            <td className="px-5 py-3 text-slate-400 text-xs">
                              {new Date(a.created_at).toLocaleDateString('es-AR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
