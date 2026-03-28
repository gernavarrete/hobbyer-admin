'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import ErrorState from '@/components/ErrorState'

interface PartnerDetail {
  id: string
  name: string
  rating: number | null
  active_offer: string | null
  hobby_name: string | null
  created_at: string
}

export default function PartnerDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [partner, setPartner] = useState<PartnerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchPartner = () => {
    setLoading(true)
    setError(false)
    api.get(`/admin/partners/${id}`)
      .then(res => setPartner(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchPartner() }, [id])

  if (loading) return (
    <div className="p-8 max-w-2xl">
      <div className="h-8 w-48 bg-[#252b3b] rounded animate-pulse mb-6" />
      <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-5 bg-[#252b3b] rounded animate-pulse" style={{ width: `${60 + i * 5}%` }} />
          ))}
        </div>
      </div>
    </div>
  )

  if (error || !partner) return (
    <div className="p-8">
      <ErrorState message="Partner no encontrado" onRetry={fetchPartner} />
    </div>
  )

  return (
    <div className="p-8 max-w-2xl">
      <h2 className="text-2xl font-extrabold text-white tracking-tight mb-8">{partner.name}</h2>

      <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-6">
        <div className="space-y-5">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Oferta activa</p>
            <p className="text-white">{partner.active_offer || 'Sin oferta activa'}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Rating</p>
            <p className="text-white">
              {partner.rating !== null ? (
                <span className="text-yellow-400">{'★'} {partner.rating.toFixed(1)}</span>
              ) : 'Sin calificación'}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Hobby relacionado</p>
            <p className="text-white">
              {partner.hobby_name ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#0d59f2]/10 text-[#0d59f2]">
                  {partner.hobby_name}
                </span>
              ) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Fecha de alta</p>
            <p className="text-white text-sm">
              {new Date(partner.created_at).toLocaleDateString('es-AR', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
