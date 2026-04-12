'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import TableSkeleton from '@/components/TableSkeleton'
import ErrorState from '@/components/ErrorState'
import Toast from '@/components/Toast'
import useToast from '@/hooks/useToast'

interface Subscriber {
  id: string
  email: string
  name: string | null
  hobby: string | null
  source: string
  status: string
  platform: 'android' | 'ios' | null
  invited_at: string | null
  created_at: string
}

export default function WaitlistPage() {
  const [data, setData] = useState<Subscriber[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sending, setSending] = useState<string | 'all' | null>(null)
  const { toast, showSuccess, showError, hide } = useToast()

  const fetchData = () => {
    setLoading(true)
    setError(false)
    api.get('/admin/waitlist?limit=100')
      .then(res => {
        setData(res.data.data)
        setTotal(res.data.total)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    const uninvited = data.filter(r => !r.invited_at).map(r => r.id)
    setSelected(prev =>
      prev.size === uninvited.length ? new Set() : new Set(uninvited)
    )
  }

  const extractError = (err: unknown, fallback: string): string => {
    const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
    return detail ?? fallback
  }

  const inviteSelected = async () => {
    if (selected.size === 0) return
    setSending('selected')
    try {
      const res = await api.post('/admin/waitlist/invite', { ids: Array.from(selected) })
      showSuccess(`${res.data.invited} invitaciones enviadas`)
      setSelected(new Set())
      fetchData()
    } catch (err) {
      showError(extractError(err, 'Error al enviar invitaciones'))
    } finally {
      setSending(null)
    }
  }

  const inviteOne = async (id: string) => {
    setSending(id)
    try {
      await api.post('/admin/waitlist/invite', { ids: [id] })
      showSuccess('Invitación enviada')
      fetchData()
    } catch (err) {
      showError(extractError(err, 'Error al enviar invitación'))
    } finally {
      setSending(null)
    }
  }

  const inviteAll = async () => {
    setSending('all')
    try {
      const res = await api.post('/admin/waitlist/invite-all', {})
      showSuccess(`${res.data.invited} invitaciones enviadas`)
      fetchData()
    } catch (err) {
      showError(extractError(err, 'Error al enviar invitaciones'))
    } finally {
      setSending(null)
    }
  }

  const uninvitedCount = data.filter(r => !r.invited_at).length

  return (
    <div className="p-8">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={hide} />

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Waitlist</h2>
          <p className="text-slate-400 mt-1 text-sm">{total} registros — {uninvitedCount} sin invitar</p>
        </div>
        <div className="flex gap-3">
          {selected.size > 0 && (
            <button
              onClick={inviteSelected}
              disabled={sending !== null}
              className="px-4 py-2 rounded-xl bg-[#0d59f2] text-white text-sm font-semibold
                hover:bg-blue-600 disabled:opacity-50 transition-all"
            >
              {sending === 'selected' ? 'Enviando...' : `Invitar seleccionados (${selected.size})`}
            </button>
          )}
          <button
            onClick={inviteAll}
            disabled={sending !== null || uninvitedCount === 0}
            className="px-4 py-2 rounded-xl bg-[#FF6B00] text-white text-sm font-semibold
              hover:bg-orange-600 disabled:opacity-50 transition-all"
          >
            {sending === 'all' ? 'Enviando...' : `Invitar todos (${uninvitedCount})`}
          </button>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : error ? (
        <ErrorState message="Error al cargar waitlist" onRetry={fetchData} />
      ) : (
        <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#252b3b]">
                <th className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selected.size === uninvitedCount && uninvitedCount > 0}
                    onChange={toggleAll}
                    className="accent-[#0d59f2]"
                  />
                </th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Hobby</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Fuente</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Plataforma</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b border-[#252b3b]/50 hover:bg-[#252b3b]/50 transition-colors
                    ${selected.has(row.id) ? 'bg-[#0d59f2]/10' : ''}`}
                >
                  <td className="px-6 py-4">
                    {!row.invited_at && (
                      <input
                        type="checkbox"
                        checked={selected.has(row.id)}
                        onChange={() => toggleSelect(row.id)}
                        className="accent-[#0d59f2]"
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 text-white font-medium">{row.name ?? '—'}</td>
                  <td className="px-6 py-4 text-slate-300">{row.email}</td>
                  <td className="px-6 py-4 text-slate-400">{row.hobby ?? '—'}</td>
                  <td className="px-6 py-4 text-slate-400">{row.source}</td>
                  <td className="px-6 py-4">
                    {row.platform === 'android' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                        bg-green-500/10 text-green-400 text-xs font-semibold">
                        Android
                      </span>
                    ) : row.platform === 'ios' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                        bg-slate-500/10 text-slate-300 text-xs font-semibold">
                        iOS
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {row.invited_at ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                        bg-green-500/10 text-green-400 text-xs font-semibold">
                        Invitado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                        bg-slate-500/10 text-slate-400 text-xs font-semibold">
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {new Date(row.created_at).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-6 py-4">
                    {!row.invited_at && (
                      <button
                        onClick={() => inviteOne(row.id)}
                        disabled={sending !== null}
                        className="px-3 py-1.5 rounded-lg bg-[#0d59f2]/20 text-[#0d59f2]
                          text-xs font-semibold hover:bg-[#0d59f2]/30 disabled:opacity-50
                          transition-all whitespace-nowrap"
                      >
                        {sending === row.id ? '...' : 'Invitar'}
                      </button>
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
