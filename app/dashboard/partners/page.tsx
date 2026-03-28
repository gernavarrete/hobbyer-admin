'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import TableSkeleton from '@/components/TableSkeleton'
import ErrorState from '@/components/ErrorState'

interface Partner {
  id: string
  name: string
  rating: number | null
  active_offer: string | null
  created_at: string
}

export default function PartnersPage() {
  const router = useRouter()
  const [data, setData] = useState<Partner[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [offset, setOffset] = useState(0)
  const limit = 20

  const fetchPartners = (o: number) => {
    setLoading(true)
    setError(false)
    api.get(`/admin/partners?limit=${limit}&offset=${o}`)
      .then(res => {
        setData(res.data.data)
        setTotal(res.data.total)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchPartners(offset) }, [offset])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Partners</h2>
        <p className="text-slate-400 mt-1 text-sm">{total} partners registrados</p>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : error ? (
        <ErrorState message="Error al cargar partners" onRetry={() => fetchPartners(offset)} />
      ) : data.length === 0 ? (
        <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-12 text-center">
          <p className="text-slate-400 text-lg font-medium">Sin partners registrados</p>
        </div>
      ) : (
        <>
          <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#252b3b]">
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Oferta activa</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Rating</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha alta</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {data.map(p => (
                  <tr key={p.id} className="border-b border-[#252b3b]/50 hover:bg-[#252b3b]/50 transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{p.name}</td>
                    <td className="px-6 py-4 text-slate-300 text-xs max-w-xs truncate">
                      {p.active_offer || '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {p.rating !== null ? (
                        <span className="text-yellow-400">{'★'} {p.rating.toFixed(1)}</span>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {new Date(p.created_at).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => router.push(`/dashboard/partners/${p.id}`)}
                        className="px-3 py-1.5 rounded-lg bg-[#0d59f2]/20 text-[#0d59f2]
                          text-xs font-semibold hover:bg-[#0d59f2]/30 transition-all"
                      >
                        Ver detalle
                      </button>
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
