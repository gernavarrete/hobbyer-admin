'use client'
import { useState } from 'react'
import { z } from 'zod'
import api from '@/lib/api'

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  category: z.string().min(1, 'La categoría es requerida'),
  email: z.string().email('Email inválido'),
  whatsapp: z.string().optional(),
  city: z.string().min(1, 'La ciudad es requerida'),
  plan: z.string().min(1),
})

type FormData = z.infer<typeof schema>

const CATEGORIES = [
  'Gastronomía',
  'Deporte',
  'Arte y cultura',
  'Música',
  'Tecnología',
  'Bienestar',
  'Turismo',
  'Educación',
  'Entretenimiento',
  'Otro',
]

const PLANS = [
  { value: 'starter', label: 'Starter' },
  { value: 'pro', label: 'Pro' },
  { value: 'business', label: 'Business' },
]

interface Props {
  onClose: () => void
  onSuccess: () => void
}

export default function NewPartnerModal({ onClose, onSuccess }: Props) {
  const [form, setForm] = useState<FormData>({
    name: '',
    category: '',
    email: '',
    whatsapp: '',
    city: '',
    plan: 'starter',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const set = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const submit = async () => {
    const result = schema.safeParse(form)
    if (!result.success) {
      const fieldErrors: typeof errors = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FormData
        if (!fieldErrors[field]) fieldErrors[field] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setLoading(true)
    setApiError(null)
    try {
      await api.post('/admin/partners', {
        ...result.data,
        whatsapp: result.data.whatsapp || null,
      })
      onSuccess()
      onClose()
    } catch {
      setApiError('Error al crear el partner. Verifica los datos e intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-[#1b212d] border border-[#252b3b] rounded-2xl p-6 w-full max-w-lg">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">Nuevo partner</h3>
            <p className="text-slate-400 text-sm mt-0.5">Alta manual de un negocio partner</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white text-xl leading-none transition-colors"
          >
            &times;
          </button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              placeholder="Nombre del negocio"
              className="w-full px-4 py-2.5 rounded-xl bg-[#101622] border border-[#252b3b] text-white
                text-sm placeholder-slate-500 focus:outline-none focus:border-[#0d59f2] transition-colors"
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Categoría *
            </label>
            <select
              value={form.category}
              onChange={set('category')}
              className="w-full px-4 py-2.5 rounded-xl bg-[#101622] border border-[#252b3b] text-white
                text-sm focus:outline-none focus:border-[#0d59f2] transition-colors"
            >
              <option value="">Seleccionar categoría</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Email *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="contacto@negocio.com"
              className="w-full px-4 py-2.5 rounded-xl bg-[#101622] border border-[#252b3b] text-white
                text-sm placeholder-slate-500 focus:outline-none focus:border-[#0d59f2] transition-colors"
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* WhatsApp + City */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                WhatsApp
              </label>
              <input
                type="text"
                value={form.whatsapp}
                onChange={set('whatsapp')}
                placeholder="+54 9 11 ..."
                className="w-full px-4 py-2.5 rounded-xl bg-[#101622] border border-[#252b3b] text-white
                  text-sm placeholder-slate-500 focus:outline-none focus:border-[#0d59f2] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Ciudad *
              </label>
              <input
                type="text"
                value={form.city}
                onChange={set('city')}
                placeholder="Buenos Aires"
                className="w-full px-4 py-2.5 rounded-xl bg-[#101622] border border-[#252b3b] text-white
                  text-sm placeholder-slate-500 focus:outline-none focus:border-[#0d59f2] transition-colors"
              />
              {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
            </div>
          </div>

          {/* Plan */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Plan inicial
            </label>
            <select
              value={form.plan}
              onChange={set('plan')}
              className="w-full px-4 py-2.5 rounded-xl bg-[#101622] border border-[#252b3b] text-white
                text-sm focus:outline-none focus:border-[#0d59f2] transition-colors"
            >
              {PLANS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        {apiError && (
          <p className="mt-4 text-red-400 text-sm">{apiError}</p>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm text-slate-400
              hover:text-white hover:bg-[#252b3b] transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#0d59f2] text-white text-sm
              font-semibold hover:bg-blue-600 disabled:opacity-50 transition-all"
          >
            {loading ? 'Creando...' : 'Crear partner'}
          </button>
        </div>
      </div>
    </div>
  )
}
