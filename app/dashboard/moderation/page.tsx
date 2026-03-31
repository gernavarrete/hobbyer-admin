'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import TableSkeleton from '@/components/TableSkeleton'
import ErrorState from '@/components/ErrorState'
import Toast from '@/components/Toast'
import ModerationActionModal from '@/components/ModerationActionModal'
import useToast from '@/hooks/useToast'
import { useAdminRole } from '@/hooks/useAdminRole'

interface Report {
  id: string
  reported_user_id: string
  reporter_user_id: string
  reason: string
  status: string
  created_at: string
}

interface FoundUser {
  id: string
  name: string
  email: string | null
  status: string
}

interface ActiveModal {
  reportId: string
  reportedUserId: string
  reportedUserName: string
}

export default function ModerationPage() {
  const role = useAdminRole()
  const [tab, setTab] = useState<'reports' | 'quick'>('reports')
  const [reports, setReports] = useState<Report[]>([])
  const [reportsTotal, setReportsTotal] = useState(0)
  const [loadingReports, setLoadingReports] = useState(true)
  const [errorReports, setErrorReports] = useState(false)

  // Quick actions
  const [searchEmail, setSearchEmail] = useState('')
  const [foundUsers, setFoundUsers] = useState<FoundUser[]>([])
  const [searching, setSearching] = useState(false)

  // Modal
  const [activeModal, setActiveModal] = useState<ActiveModal | null>(null)

  const { toast, showSuccess, showError, hide } = useToast()

  const fetchReports = () => {
    setLoadingReports(true)
    setErrorReports(false)
    api.get('/admin/reports?limit=20&status=pending')
      .then(res => {
        setReports(res.data.data)
        setReportsTotal(res.data.total)
      })
      .catch(() => setErrorReports(true))
      .finally(() => setLoadingReports(false))
  }

  useEffect(() => { fetchReports() }, [])

  const searchUser = () => {
    if (!searchEmail.trim()) return
    setSearching(true)
    api.get(`/admin/users?search=${encodeURIComponent(searchEmail)}&limit=5`)
      .then(res => setFoundUsers(res.data.data))
      .catch(() => setFoundUsers([]))
      .finally(() => setSearching(false))
  }

  const quickAction = async (userId: string, status: string) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, {
        status,
        note: `Acción rápida desde moderación`,
      })
      showSuccess(`Usuario actualizado a ${status}`)
      searchUser()
    } catch {
      showError('Error al actualizar usuario')
    }
  }

  const tabClass = (t: string) =>
    `px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
      tab === t
        ? 'bg-[#0d59f2] text-white'
        : 'text-slate-400 hover:text-white hover:bg-[#1b212d]'
    }`

  return (
    <div className="p-8">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={hide} />

      {activeModal && (
        <ModerationActionModal
          reportId={activeModal.reportId}
          reportedUserId={activeModal.reportedUserId}
          reportedUserName={activeModal.reportedUserName}
          onClose={() => setActiveModal(null)}
          onSuccess={() => {
            showSuccess('Acción aplicada correctamente')
            fetchReports()
          }}
        />
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Moderación</h2>
        <p className="text-slate-400 mt-1 text-sm">Gestionar reportes y acciones sobre usuarios</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('reports')} className={tabClass('reports')}>
          Reportes ({reportsTotal})
        </button>
        <button onClick={() => setTab('quick')} className={tabClass('quick')}>
          Acciones rápidas
        </button>
      </div>

      {/* Reports Tab */}
      {tab === 'reports' && (
        <>
          {loadingReports ? (
            <TableSkeleton rows={5} cols={5} />
          ) : errorReports ? (
            <ErrorState message="Error al cargar reportes" onRetry={fetchReports} />
          ) : reports.length === 0 ? (
            <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-12 text-center">
              <p className="text-slate-400 text-lg font-medium">Sin reportes pendientes</p>
              <p className="text-slate-500 text-sm mt-1">No hay reportes que requieran atención</p>
            </div>
          ) : (
            <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#252b3b]">
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Reportado</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Motivo</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                    {role !== 'support' && (
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Acción</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {reports.map(r => (
                    <tr key={r.id} className="border-b border-[#252b3b]/50 hover:bg-[#252b3b]/50 transition-colors">
                      <td className="px-6 py-4 text-white font-mono text-xs">{r.reported_user_id.slice(0, 8)}...</td>
                      <td className="px-6 py-4 text-slate-300">{r.reason}</td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {new Date(r.created_at).toLocaleDateString('es-AR')}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-400">
                          {r.status}
                        </span>
                      </td>
                      {role !== 'support' && (
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setActiveModal({
                              reportId: r.id,
                              reportedUserId: r.reported_user_id,
                              reportedUserName: r.reported_user_id.slice(0, 8),
                            })}
                            className="px-3 py-1.5 rounded-lg bg-[#0d59f2]/20 text-[#0d59f2]
                              text-xs font-semibold hover:bg-[#0d59f2]/30 transition-all"
                          >
                            Tomar acción
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Quick Actions Tab */}
      {tab === 'quick' && (
        <div>
          <div className="flex gap-3 mb-6">
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchEmail}
              onChange={e => setSearchEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchUser()}
              className="px-4 py-2.5 rounded-xl bg-[#1b212d] border border-[#252b3b] text-white
                text-sm placeholder-slate-500 focus:outline-none focus:border-[#0d59f2]
                transition-colors flex-1"
            />
            <button onClick={searchUser} disabled={searching}
              className="px-5 py-2.5 rounded-xl bg-[#0d59f2] text-white text-sm font-semibold
                hover:bg-blue-600 disabled:opacity-50 transition-all">
              {searching ? 'Buscando...' : 'Buscar'}
            </button>
          </div>

          {foundUsers.length > 0 && (
            <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#252b3b]">
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase">Nombre</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase">Email</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase">Status</th>
                    {role !== 'support' && <th className="px-6 py-4"></th>}
                  </tr>
                </thead>
                <tbody>
                  {foundUsers.map(u => (
                    <tr key={u.id} className="border-b border-[#252b3b]/50">
                      <td className="px-6 py-4 text-white font-medium">{u.name}</td>
                      <td className="px-6 py-4 text-slate-300">{u.email || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          u.status === 'active' ? 'bg-green-500/10 text-green-400' :
                          u.status === 'suspended' ? 'bg-yellow-500/10 text-yellow-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>{u.status}</span>
                      </td>
                      {role !== 'support' && (
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {u.status !== 'active' && (
                              <button onClick={() => quickAction(u.id, 'active')}
                                className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400
                                  text-xs font-semibold hover:bg-green-500/30 transition-all">
                                Activar
                              </button>
                            )}
                            {u.status !== 'suspended' && (
                              <button onClick={() => quickAction(u.id, 'suspended')}
                                className="px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400
                                  text-xs font-semibold hover:bg-yellow-500/30 transition-all">
                                Suspender
                              </button>
                            )}
                            {u.status !== 'banned' && (
                              <button onClick={() => quickAction(u.id, 'banned')}
                                className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400
                                  text-xs font-semibold hover:bg-red-500/30 transition-all">
                                Banear
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
