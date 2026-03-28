'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import TableSkeleton from '@/components/TableSkeleton'
import ErrorState from '@/components/ErrorState'
import Toast from '@/components/Toast'
import useToast from '@/hooks/useToast'

interface Group {
  id: string
  name: string
  hobby_name: string | null
  member_count: number
  max_capacity: number | null
  status: string
  created_at: string
}

const STATUS_BADGE: Record<string, string> = {
  OPEN: 'bg-green-500/10 text-green-400',
  CLOSED: 'bg-yellow-500/10 text-yellow-400',
  HIDDEN: 'bg-red-500/10 text-red-400',
}

export default function GroupsPage() {
  const router = useRouter()
  const [data, setData] = useState<Group[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [offset, setOffset] = useState(0)
  const limit = 20
  const { toast, showSuccess, showError, hide } = useToast()

  const fetchGroups = (s: string, o: number) => {
    setLoading(true)
    setError(false)
    const params = new URLSearchParams({ limit: String(limit), offset: String(o) })
    if (s) params.set('status', s)
    api.get(`/admin/groups?${params}`)
      .then(res => {
        setData(res.data.data)
        setTotal(res.data.total)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchGroups(statusFilter, offset) }, [offset, statusFilter])

  const changeStatus = async (groupId: string, newStatus: string) => {
    try {
      await api.patch(`/admin/groups/${groupId}/status`, { status: newStatus })
      showSuccess(`Grupo actualizado a ${newStatus}`)
      fetchGroups(statusFilter, offset)
    } catch {
      showError('Error al cambiar status')
    }
  }

  return (
    <div className="p-8">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={hide} />

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Grupos</h2>
          <p className="text-slate-400 mt-1 text-sm">{total} grupos registrados</p>
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setOffset(0) }}
          className="px-4 py-2.5 rounded-xl bg-[#1b212d] border border-[#252b3b] text-white
            text-sm focus:outline-none focus:border-[#0d59f2] transition-colors"
        >
          <option value="">Todos</option>
          <option value="OPEN">OPEN</option>
          <option value="CLOSED">CLOSED</option>
          <option value="HIDDEN">HIDDEN</option>
        </select>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : error ? (
        <ErrorState message="Error al cargar grupos" onRetry={() => fetchGroups(statusFilter, offset)} />
      ) : data.length === 0 ? (
        <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-12 text-center">
          <p className="text-slate-400 text-lg font-medium">Sin grupos</p>
        </div>
      ) : (
        <>
          <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#252b3b]">
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Hobby</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Miembros</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.map(g => (
                  <tr key={g.id} className="border-b border-[#252b3b]/50 hover:bg-[#252b3b]/50 transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{g.name}</td>
                    <td className="px-6 py-4">
                      {g.hobby_name ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#0d59f2]/10 text-[#0d59f2]">
                          {g.hobby_name}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {g.member_count}{g.max_capacity ? `/${g.max_capacity}` : ''}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[g.status] || 'bg-slate-500/10 text-slate-400'}`}>
                        {g.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {new Date(g.created_at).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/dashboard/groups/${g.id}`)}
                          className="px-3 py-1.5 rounded-lg bg-[#0d59f2]/20 text-[#0d59f2]
                            text-xs font-semibold hover:bg-[#0d59f2]/30 transition-all"
                        >
                          Ver
                        </button>
                        <select
                          value={g.status}
                          onChange={e => changeStatus(g.id, e.target.value)}
                          className="px-2 py-1 rounded-lg bg-[#252b3b] text-slate-300
                            text-xs focus:outline-none cursor-pointer"
                        >
                          <option value="OPEN">OPEN</option>
                          <option value="CLOSED">CLOSED</option>
                          <option value="HIDDEN">HIDDEN</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-slate-500">
              Mostrando {offset + 1}–{Math.min(offset + limit, total)} de {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setOffset(o => Math.max(0, o - limit))}
                disabled={offset === 0}
                className="px-4 py-2 rounded-xl bg-[#1b212d] border border-[#252b3b] text-sm
                  text-slate-300 disabled:opacity-30 hover:bg-[#252b3b] transition-all"
              >
                Anterior
              </button>
              <button
                onClick={() => setOffset(o => o + limit)}
                disabled={offset + limit >= total}
                className="px-4 py-2 rounded-xl bg-[#1b212d] border border-[#252b3b] text-sm
                  text-slate-300 disabled:opacity-30 hover:bg-[#252b3b] transition-all"
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
