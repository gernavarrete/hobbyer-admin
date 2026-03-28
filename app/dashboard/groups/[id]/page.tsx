'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import TableSkeleton from '@/components/TableSkeleton'
import ErrorState from '@/components/ErrorState'
import Toast from '@/components/Toast'
import useToast from '@/hooks/useToast'

interface GroupDetail {
  id: string
  name: string
  description: string | null
  hobby_name: string | null
  status: string
  max_capacity: number | null
  lat: number | null
  lng: number | null
  created_at: string
  members: { user_id: string; name: string; role: string; joined_at: string | null }[]
}

const STATUS_BADGE: Record<string, string> = {
  OPEN: 'bg-green-500/10 text-green-400',
  CLOSED: 'bg-yellow-500/10 text-yellow-400',
  HIDDEN: 'bg-red-500/10 text-red-400',
}

export default function GroupDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [group, setGroup] = useState<GroupDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const { toast, showSuccess, showError, hide } = useToast()

  const fetchGroup = () => {
    setLoading(true)
    setError(false)
    api.get(`/admin/groups/${id}`)
      .then(res => setGroup(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchGroup() }, [id])

  const changeStatus = async (newStatus: string) => {
    try {
      await api.patch(`/admin/groups/${id}/status`, { status: newStatus })
      showSuccess(`Estado cambiado a ${newStatus}`)
      fetchGroup()
    } catch {
      showError('Error al cambiar estado')
    }
  }

  if (loading) return (
    <div className="p-8 max-w-4xl">
      <div className="h-8 w-48 bg-[#252b3b] rounded animate-pulse mb-6" />
      <TableSkeleton rows={4} cols={3} />
    </div>
  )

  if (error || !group) return (
    <div className="p-8">
      <ErrorState message="Grupo no encontrado" onRetry={fetchGroup} />
    </div>
  )

  return (
    <div className="p-8 max-w-4xl">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={hide} />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-extrabold text-white">{group.name}</h2>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[group.status] || 'bg-slate-500/10 text-slate-400'}`}>
            {group.status}
          </span>
        </div>
        <div className="flex gap-2">
          {['OPEN', 'CLOSED', 'HIDDEN'].filter(s => s !== group.status).map(s => (
            <button
              key={s}
              onClick={() => changeStatus(s)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                s === 'OPEN' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' :
                s === 'CLOSED' ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' :
                'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Hobby</p>
          <p className="text-white font-medium">{group.hobby_name || '—'}</p>
        </div>
        <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Capacidad</p>
          <p className="text-white font-medium">
            {group.members.length}{group.max_capacity ? `/${group.max_capacity}` : ''} miembros
          </p>
        </div>
        <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Coordenadas</p>
          <p className="text-white font-mono text-xs">
            {group.lat && group.lng ? `${group.lat.toFixed(4)}, ${group.lng.toFixed(4)}` : '—'}
          </p>
        </div>
        <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Creado</p>
          <p className="text-white text-sm">
            {new Date(group.created_at).toLocaleDateString('es-AR')}
          </p>
        </div>
      </div>

      {group.description && (
        <div className="mb-8">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Descripción</h3>
          <p className="text-slate-300 text-sm bg-[#1b212d] rounded-2xl border border-[#252b3b] p-5">
            {group.description}
          </p>
        </div>
      )}

      {/* Members */}
      <div>
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
          Miembros ({group.members.length})
        </h3>
        {group.members.length === 0 ? (
          <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-12 text-center">
            <p className="text-slate-400 text-sm">Sin miembros</p>
          </div>
        ) : (
          <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#252b3b]">
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Rol</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha unión</th>
                </tr>
              </thead>
              <tbody>
                {group.members.map(m => (
                  <tr key={m.user_id} className="border-b border-[#252b3b]/50 hover:bg-[#252b3b]/50 transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{m.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        m.role === 'ADMIN' ? 'bg-[#0d59f2]/10 text-[#0d59f2]' : 'bg-slate-500/10 text-slate-400'
                      }`}>
                        {m.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {m.joined_at ? new Date(m.joined_at).toLocaleDateString('es-AR') : '—'}
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
