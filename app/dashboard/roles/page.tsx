'use client'
import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import api from '@/lib/api'
import { useAdminRole } from '@/hooks/useAdminRole'
import Toast from '@/components/Toast'
import useToast from '@/hooks/useToast'

interface AdminUser {
  email: string
  sub: string
  role: string
  last_modified: string
}

const ROLES = [
  { value: 'superadmin', label: 'Superadmin' },
  { value: 'admin', label: 'Admin' },
  { value: 'support', label: 'Support' },
]

export default function RolesPage() {
  const role = useAdminRole()
  const { toast, showSuccess, showError, hide } = useToast()

  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState('admin')
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')

  const [revokeTarget, setRevokeTarget] = useState<string | null>(null)
  const [revokeLoading, setRevokeLoading] = useState(false)

  const [changingRole, setChangingRole] = useState<Record<string, string>>({})
  const [savingRole, setSavingRole] = useState<string | null>(null)

  const fetchAdmins = () => {
    setLoading(true)
    setError(false)
    api.get('/admin/roles/admins')
      .then(res => setAdmins(res.data.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (role === 'superadmin') fetchAdmins()
  }, [role])

  const saveRole = async (email: string) => {
    const newRoleVal = changingRole[email]
    if (!newRoleVal) return
    setSavingRole(email)
    try {
      await api.patch(`/admin/roles/admins/${encodeURIComponent(email)}`, { role: newRoleVal })
      showSuccess(`Rol de ${email} actualizado a ${newRoleVal}`)
      setAdmins(prev => prev.map(a => a.email === email ? { ...a, role: newRoleVal } : a))
      setChangingRole(prev => { const c = { ...prev }; delete c[email]; return c })
    } catch {
      showError(`Error al actualizar rol de ${email}`)
    } finally {
      setSavingRole(null)
    }
  }

  const revokeAccess = async (email: string) => {
    setRevokeLoading(true)
    try {
      await api.patch(`/admin/roles/admins/${encodeURIComponent(email)}`, { role: '' })
      showSuccess(`Acceso revocado para ${email}`)
      setAdmins(prev => prev.filter(a => a.email !== email))
    } catch {
      showError(`Error al revocar acceso de ${email}`)
    } finally {
      setRevokeLoading(false)
      setRevokeTarget(null)
    }
  }

  const addAdmin = async () => {
    setAddError('')
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setAddError('Email inválido')
      return
    }
    setAddLoading(true)
    try {
      await api.patch(`/admin/roles/admins/${encodeURIComponent(newEmail.trim())}`, { role: newRole })
      showSuccess(`Rol ${newRole} asignado a ${newEmail.trim()}`)
      setAddModalOpen(false)
      setNewEmail('')
      setNewRole('admin')
      fetchAdmins()
    } catch {
      setAddError('No se pudo asignar el rol. Verificá que el email exista en Cognito.')
    } finally {
      setAddLoading(false)
    }
  }

  if (role !== 'superadmin') {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <ShieldCheck size={40} className="text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Acceso restringido</p>
          <p className="text-slate-600 text-sm mt-1">Solo superadmin puede gestionar roles</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={hide} />

      {/* Confirm revoke dialog */}
      {revokeTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-[#1b212d] border border-[#252b3b] rounded-2xl p-8 w-full max-w-md">
            <h3 className="text-white font-bold text-lg mb-2">Revocar acceso</h3>
            <p className="text-slate-400 text-sm mb-6">
              ¿Revocar el acceso de <span className="text-white font-semibold">{revokeTarget}</span>?
              El usuario perderá acceso al panel inmediatamente.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRevokeTarget(null)}
                className="px-4 py-2 rounded-xl bg-[#252b3b] text-slate-300 text-sm font-semibold hover:bg-[#2e3647] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => revokeAccess(revokeTarget)}
                disabled={revokeLoading}
                className="px-5 py-2 rounded-xl bg-red-500/20 text-red-400 text-sm font-bold
                  hover:bg-red-500/30 disabled:opacity-50 transition-all"
              >
                {revokeLoading ? 'Revocando...' : 'Revocar acceso'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add admin modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-[#1b212d] border border-[#252b3b] rounded-2xl p-8 w-full max-w-md">
            <h3 className="text-white font-bold text-lg mb-5">Agregar admin</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => { setNewEmail(e.target.value); setAddError('') }}
                  placeholder="usuario@email.com"
                  className="w-full bg-[#101622] border border-[#252b3b] rounded-xl px-4 py-3 text-white text-sm
                    placeholder:text-slate-600 outline-none focus:border-[#0d59f2] transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Rol</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  className="w-full bg-[#101622] border border-[#252b3b] rounded-xl px-4 py-3 text-white text-sm
                    outline-none focus:border-[#0d59f2] transition-colors"
                >
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              {addError && <p className="text-red-400 text-xs">{addError}</p>}
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => { setAddModalOpen(false); setNewEmail(''); setAddError('') }}
                className="px-4 py-2 rounded-xl bg-[#252b3b] text-slate-300 text-sm font-semibold hover:bg-[#2e3647] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={addAdmin}
                disabled={addLoading}
                className="px-5 py-2 rounded-xl bg-[#0d59f2] text-white text-sm font-bold
                  hover:bg-blue-600 disabled:opacity-50 transition-all"
              >
                {addLoading ? 'Guardando...' : 'Asignar rol'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Roles</h2>
          <p className="text-slate-400 mt-1 text-sm">Administradores con acceso al panel</p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-[#0d59f2] text-white text-sm font-semibold
            hover:bg-blue-600 transition-all"
        >
          + Agregar admin
        </button>
      </div>

      {loading ? (
        <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] overflow-hidden">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4 px-6 py-5 border-b border-[#252b3b]/50">
              <div className="h-4 w-48 bg-[#252b3b] rounded animate-pulse" />
              <div className="h-6 w-20 bg-[#252b3b] rounded animate-pulse" />
              <div className="h-4 w-32 bg-[#252b3b] rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-[#1b212d] rounded-2xl border border-red-500/20 p-8 text-center">
          <p className="text-red-400 text-sm font-medium">Error al cargar administradores</p>
          <button
            onClick={fetchAdmins}
            className="mt-3 px-4 py-2 rounded-xl bg-[#252b3b] text-slate-300 text-xs font-semibold hover:bg-[#2e3647] transition-all"
          >
            Reintentar
          </button>
        </div>
      ) : admins.length === 0 ? (
        <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-12 text-center">
          <p className="text-slate-400 text-lg font-medium">Sin administradores registrados</p>
        </div>
      ) : (
        <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#252b3b]">
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Rol actual</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Última modificación</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {admins.map(a => {
                const pendingRole = changingRole[a.email]
                const isDirty = pendingRole !== undefined && pendingRole !== a.role
                return (
                  <tr key={a.email} className="border-b border-[#252b3b]/50 hover:bg-[#252b3b]/30 transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{a.email}</td>
                    <td className="px-6 py-4">
                      <select
                        value={pendingRole ?? a.role}
                        onChange={e => setChangingRole(prev => ({ ...prev, [a.email]: e.target.value }))}
                        className="bg-[#101622] border border-[#252b3b] rounded-lg px-3 py-1.5 text-white text-xs
                          outline-none focus:border-[#0d59f2] transition-colors"
                      >
                        {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {a.last_modified
                        ? new Date(a.last_modified).toLocaleDateString('es-AR', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        {isDirty && (
                          <button
                            onClick={() => saveRole(a.email)}
                            disabled={savingRole === a.email}
                            className="px-3 py-1.5 rounded-lg bg-[#0d59f2]/20 text-[#0d59f2] text-xs font-semibold
                              hover:bg-[#0d59f2]/30 disabled:opacity-50 transition-all"
                          >
                            {savingRole === a.email ? 'Guardando...' : 'Guardar'}
                          </button>
                        )}
                        <button
                          onClick={() => setRevokeTarget(a.email)}
                          className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-semibold
                            hover:bg-red-500/20 transition-all"
                        >
                          Revocar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
