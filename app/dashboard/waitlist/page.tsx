'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface Subscriber {
  id: string
  email: string
  name: string | null
  hobby: string | null
  source: string
  status: string
  created_at: string
}

export default function WaitlistPage() {
  const [data, setData] = useState<Subscriber[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/v1/admin/waitlist?limit=50')
      .then(res => {
        setData(res.data.data)
        setTotal(res.data.total)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Waitlist
          </h2>
          <p className="text-slate-400 mt-1 text-sm">
            {total} registros totales
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-400">Cargando...</p>
      ) : (
        <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#252b3b]">
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Hobby
                </th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Fuente
                </th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr
                  key={row.id}
                  className={`border-b border-[#252b3b]/50 hover:bg-[#252b3b]/50 transition-colors
                    ${i % 2 === 0 ? '' : 'bg-[#252b3b]/20'}`}
                >
                  <td className="px-6 py-4 text-white font-medium">
                    {row.name || '—'}
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {row.email}
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {row.hobby || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-[#0d59f2]/10 text-[#0d59f2]">
                      {row.source}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs">
                    {new Date(row.created_at).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
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
