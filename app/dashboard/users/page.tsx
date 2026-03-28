'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import TableSkeleton from '@/components/TableSkeleton'
import ErrorState from '@/components/ErrorState'

interface AppUser {
  id: string
  name: string
  email: string | null
  status: string
  hobby_count: number
  created_at: string
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-500/10 text-green-400',
  suspended: 'bg-yellow-500/10 text-yellow-400',
  banned: 'bg-red-500/10 text-red-400',
}

export default function UsersPage() {
  const router = useRouter()
  const [data, setData] = useState<AppUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const limit = 50
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchUsers = (s: string, o: number) => {
    setLoading(true)
    setError(false)
    const params = new URLSearchParams({ limit: String(limit), offset: String(o) })
    if (s) params.set('search', s)
    api.get(`/admin/users?${params}`)
      .then(res => {
        setData(res.data.data)
        setTotal(res.data.total)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers(search, offset) }, [offset])

  const onSearchChange = (val: string) => {
    setSearch(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setOffset(0)
      fetchUsers(val, 0)
    }, 400)
  }

  const hasPrev = offset > 0
  const hasNext = offset + limit < total

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Usuarios</h2>
          <p className="text-slate-400 mt-1 text-sm">{total} usuarios registrados</p>
        </div>
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-[#1b212d] border border-[#252b3b] text-white
            text-sm placeholder-slate-500 focus:outline-none focus:border-[#0d59f2]
            transition-colors w-72"
        />
      </div>

      {loading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : error ? (
        <ErrorState message="Error al cargar usuarios" onRetry={() => fetchUsers(search, offset)} />
      ) : (
        <>
          <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#252b3b]">
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Email</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Hobbies</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Registro</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      No se encontraron usuarios
                    </td>
                  </tr>
                ) : (
                  data.map(user => (
                    <tr
                      key={user.id}
                      className="border-b border-[#252b3b]/50 hover:bg-[#252b3b]/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-white font-medium">{user.name}</td>
                      <td className="px-6 py-4 text-slate-300">{user.email || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[user.status] || STATUS_BADGE.active}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-[#0d59f2]/10 text-[#0d59f2]">
                          {user.hobby_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {new Date(user.created_at).toLocaleDateString('es-AR')}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => router.push(`/dashboard/users/${user.id}`)}
                          className="px-3 py-1.5 rounded-lg bg-[#0d59f2]/20 text-[#0d59f2]
                            text-xs font-semibold hover:bg-[#0d59f2]/30 transition-all"
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ))
                )}
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
                disabled={!hasPrev}
                className="px-4 py-2 rounded-xl bg-[#1b212d] border border-[#252b3b] text-sm
                  text-slate-300 disabled:opacity-30 hover:bg-[#252b3b] transition-all"
              >
                Anterior
              </button>
              <button
                onClick={() => setOffset(o => o + limit)}
                disabled={!hasNext}
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
