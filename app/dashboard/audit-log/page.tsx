'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface AuditEntry {
  id: string
  admin_email: string
  action_type: string
  target_user_id: string | null
  target_type: string | null
  note: string | null
  created_at: string
}

const ACTION_COLORS: Record<string, string> = {
  ban_permanent: 'bg-red-500/10 text-red-400',
  banned: 'bg-red-500/10 text-red-400',
  ban_temp: 'bg-orange-500/10 text-orange-400',
  warn: 'bg-yellow-500/10 text-yellow-400',
  suspended: 'bg-yellow-500/10 text-yellow-400',
  active: 'bg-green-500/10 text-green-400',
  dismiss: 'bg-slate-500/10 text-slate-400',
}

export default function AuditLogPage() {
  const [data, setData] = useState<AuditEntry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const limit = 50

  const fetchLog = (o: number) => {
    setLoading(true)
    api.get(`/admin/audit-log?limit=${limit}&offset=${o}`)
      .then(res => {
        setData(res.data.data)
        setTotal(res.data.total)
      })
      .catch(() => { setData([]); setTotal(0) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchLog(offset) }, [offset])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Audit Log</h2>
        <p className="text-slate-400 mt-1 text-sm">{total} acciones registradas</p>
      </div>

      {loading ? (
        <p className="text-slate-400">Cargando...</p>
      ) : data.length === 0 ? (
        <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-12 text-center">
          <p className="text-slate-400 text-lg font-medium">Sin acciones registradas</p>
        </div>
      ) : (
        <>
          <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#252b3b]">
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Admin</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Accion</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Usuario</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Nota</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {data.map(entry => (
                  <tr key={entry.id} className="border-b border-[#252b3b]/50 hover:bg-[#252b3b]/50 transition-colors">
                    <td className="px-6 py-4 text-slate-300 text-xs">{entry.admin_email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ACTION_COLORS[entry.action_type] || 'bg-slate-500/10 text-slate-400'}`}>
                        {entry.action_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                      {entry.target_user_id ? `${entry.target_user_id.slice(0, 8)}...` : '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs max-w-xs truncate">
                      {entry.note || '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {new Date(entry.created_at).toLocaleDateString('es-AR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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
