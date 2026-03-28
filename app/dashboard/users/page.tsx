'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface AppUser {
  id: string
  name: string
  email: string | null
  hobby_count: number
  created_at: string
}

export default function UsersPage() {
  const [data, setData] = useState<AppUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/users?limit=50')
      .then(res => {
        setData(res.data.data)
        setTotal(res.data.total)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Usuarios
        </h2>
        <p className="text-slate-400 mt-1 text-sm">
          {total} usuarios registrados en la app
        </p>
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
                  Hobbies
                </th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Registro
                </th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    No hay usuarios registrados aún
                  </td>
                </tr>
              ) : (
                data.map((user, i) => (
                  <tr
                    key={user.id}
                    className={`border-b border-[#252b3b]/50 hover:bg-[#252b3b]/50 transition-colors
                      ${i % 2 === 0 ? '' : 'bg-[#252b3b]/20'}`}
                  >
                    <td className="px-6 py-4 text-white font-medium">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {user.email || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-[#0d59f2]/10 text-[#0d59f2]">
                        {user.hobby_count} hobbies
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {new Date(user.created_at).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
