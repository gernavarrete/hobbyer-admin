'use client'
import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import api from '@/lib/api'
import { useAdminRole } from '@/hooks/useAdminRole'
import Toast from '@/components/Toast'
import useToast from '@/hooks/useToast'

const z = {
  string: () => ({
    min: (n: number, msg: string) => ({ _min: n, _msg: msg, _type: 'string' as const }),
  }),
}

const SEGMENTS = [
  { value: 'all', label: 'Todos los usuarios' },
  { value: 'premium', label: 'Usuarios premium' },
  { value: 'hobby', label: 'Por hobby' },
  { value: 'city', label: 'Por ciudad' },
] as const

type Segment = 'all' | 'premium' | 'hobby' | 'city'

interface HistoryEntry {
  id: string
  admin_email: string
  note: string
  created_at: string
}

export default function BroadcastPage() {
  const role = useAdminRole()
  const { toast, showSuccess, showError, hide } = useToast()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [segment, setSegment] = useState<Segment>('all')
  const [segmentValue, setSegmentValue] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [estimating, setEstimating] = useState(false)
  const [targetCount, setTargetCount] = useState<number | null>(null)
  const [sending, setSending] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const [history, setHistory] = useState<HistoryEntry[]>([])

  useEffect(() => {
    api.get('/admin/audit-log?action_type=broadcast_sent&limit=5')
      .then(res => setHistory(res.data.data ?? []))
      .catch(() => {})
  }, [])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!title.trim()) errs.title = 'El título es requerido'
    if (!body.trim()) errs.body = 'El mensaje es requerido'
    if ((segment === 'hobby' || segment === 'city') && !segmentValue.trim()) {
      errs.segmentValue = 'Este campo es requerido para el segmento seleccionado'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const estimate = () => {
    if (!validate()) return
    setEstimating(true)
    setTargetCount(null)
    api.post('/admin/notifications/broadcast', {
      title,
      body,
      segment,
      segment_value: segmentValue || null,
      dry_run: true,
    })
      .then(res => setTargetCount(res.data.target_count))
      .catch(() => showError('Error al estimar alcance'))
      .finally(() => setEstimating(false))
  }

  const send = () => {
    if (!validate()) return
    setConfirmOpen(true)
  }

  const confirmSend = () => {
    setConfirmOpen(false)
    setSending(true)
    api.post('/admin/notifications/broadcast', {
      title,
      body,
      segment,
      segment_value: segmentValue || null,
      dry_run: false,
    })
      .then(res => {
        showSuccess(`Notificación encolada para ${res.data.target_count} usuarios`)
        setTitle('')
        setBody('')
        setSegment('all')
        setSegmentValue('')
        setTargetCount(null)
        // Refrescar historial
        return api.get('/admin/audit-log?action_type=broadcast_sent&limit=5')
      })
      .then(res => setHistory(res.data.data ?? []))
      .catch(() => showError('Error al enviar la notificación'))
      .finally(() => setSending(false))
  }

  if (role === 'support') {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Bell size={40} className="text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Sin acceso</p>
          <p className="text-slate-600 text-sm mt-1">El rol support no puede enviar notificaciones</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={hide} />

      {/* Confirm dialog */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-[#1b212d] border border-[#252b3b] rounded-2xl p-8 w-full max-w-md">
            <h3 className="text-white font-bold text-lg mb-2">Confirmar envío</h3>
            <p className="text-slate-400 text-sm mb-6">
              ¿Enviar la notificación a{' '}
              <span className="text-white font-semibold">{targetCount !== null ? `${targetCount} usuarios` : 'los usuarios seleccionados'}</span>?
              Esta acción quedará registrada en el audit log.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#252b3b] text-slate-300 text-sm font-semibold hover:bg-[#2e3647] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmSend}
                className="px-5 py-2 rounded-xl bg-[#0d59f2] text-white text-sm font-bold hover:bg-blue-600 transition-all"
              >
                CONFIRMAR
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Notificaciones</h2>
        <p className="text-slate-400 mt-1 text-sm">Enviar push notifications a segmentos de usuarios</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Columna izquierda — Formulario */}
        <div className="space-y-5">
          <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-6 space-y-5">
            {/* Título */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Título</label>
                <span className={`text-xs ${title.length > 90 ? 'text-amber-400' : 'text-slate-600'}`}>
                  {title.length}/100
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={e => { setTitle(e.target.value.slice(0, 100)); setErrors(p => ({ ...p, title: '' })) }}
                placeholder="Ej: ¡Nuevo match disponible!"
                className={`w-full bg-[#101622] border rounded-xl px-4 py-3 text-white text-sm
                  placeholder:text-slate-600 outline-none focus:border-[#0d59f2] transition-colors
                  ${errors.title ? 'border-red-500/50' : 'border-[#252b3b]'}`}
              />
              {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
            </div>

            {/* Mensaje */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mensaje</label>
                <span className={`text-xs ${body.length > 450 ? 'text-amber-400' : 'text-slate-600'}`}>
                  {body.length}/500
                </span>
              </div>
              <textarea
                value={body}
                onChange={e => { setBody(e.target.value.slice(0, 500)); setErrors(p => ({ ...p, body: '' })) }}
                placeholder="Ej: Tenés un nuevo hobby en común con alguien cerca tuyo."
                rows={4}
                className={`w-full bg-[#101622] border rounded-xl px-4 py-3 text-white text-sm
                  placeholder:text-slate-600 outline-none focus:border-[#0d59f2] transition-colors resize-none
                  ${errors.body ? 'border-red-500/50' : 'border-[#252b3b]'}`}
              />
              {errors.body && <p className="text-red-400 text-xs mt-1">{errors.body}</p>}
            </div>

            {/* Segmento */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Segmento
              </label>
              <select
                value={segment}
                onChange={e => { setSegment(e.target.value as Segment); setSegmentValue(''); setTargetCount(null) }}
                className="w-full bg-[#101622] border border-[#252b3b] rounded-xl px-4 py-3 text-white text-sm
                  outline-none focus:border-[#0d59f2] transition-colors"
              >
                {SEGMENTS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Campo adicional para hobby/city */}
            {(segment === 'hobby' || segment === 'city') && (
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  {segment === 'hobby' ? 'Nombre del hobby' : 'Ciudad'}
                </label>
                <input
                  type="text"
                  value={segmentValue}
                  onChange={e => { setSegmentValue(e.target.value); setErrors(p => ({ ...p, segmentValue: '' })); setTargetCount(null) }}
                  placeholder={segment === 'hobby' ? 'Ej: fotografía' : 'Ej: Buenos Aires'}
                  className={`w-full bg-[#101622] border rounded-xl px-4 py-3 text-white text-sm
                    placeholder:text-slate-600 outline-none focus:border-[#0d59f2] transition-colors
                    ${errors.segmentValue ? 'border-red-500/50' : 'border-[#252b3b]'}`}
                />
                {errors.segmentValue && <p className="text-red-400 text-xs mt-1">{errors.segmentValue}</p>}
              </div>
            )}

            {/* Estimate badge */}
            {targetCount !== null && (
              <div className="flex items-center gap-2 px-4 py-3 bg-[#0d59f2]/10 border border-[#0d59f2]/20 rounded-xl">
                <span className="text-[#0d59f2] font-bold text-lg">{targetCount.toLocaleString('es-AR')}</span>
                <span className="text-slate-400 text-sm">usuarios recibirían esta notificación</span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={estimate}
                disabled={estimating}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#252b3b] text-slate-300 text-sm font-semibold
                  hover:bg-[#2e3647] disabled:opacity-50 transition-all"
              >
                {estimating ? 'Estimando...' : 'Estimar alcance'}
              </button>
              <button
                onClick={send}
                disabled={sending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#0d59f2] text-white text-sm font-bold
                  hover:bg-blue-600 disabled:opacity-50 transition-all"
              >
                {sending ? 'Enviando...' : 'Enviar notificación'}
              </button>
            </div>
          </div>
        </div>

        {/* Columna derecha — Preview + Historial */}
        <div className="space-y-6">
          {/* Push preview */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Preview</p>
            <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-4">
              <div className="bg-[#0c111a] rounded-xl p-4 max-w-sm mx-auto">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0d59f2] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-extrabold">h.</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="text-white text-xs font-bold truncate">hobbyer</p>
                      <span className="text-slate-600 text-[10px] flex-shrink-0">ahora</span>
                    </div>
                    <p className="text-white text-sm font-semibold leading-snug">
                      {title || <span className="text-slate-600 italic">Título de la notificación</span>}
                    </p>
                    <p className="text-slate-400 text-xs mt-0.5 leading-snug line-clamp-2">
                      {body || <span className="text-slate-600 italic">Cuerpo del mensaje...</span>}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-center text-[10px] text-slate-600 mt-3">Vista previa estilo Android</p>
            </div>
          </div>

          {/* Historial */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Últimas enviadas</p>
            {history.length === 0 ? (
              <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-6 text-center">
                <p className="text-slate-600 text-sm">Sin historial de broadcasts</p>
              </div>
            ) : (
              <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] divide-y divide-[#252b3b]">
                {history.map(h => (
                  <div key={h.id} className="px-5 py-4">
                    <p className="text-white text-xs font-medium leading-snug">{h.note}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-slate-600 text-[10px]">{h.admin_email}</span>
                      <span className="text-slate-700 text-[10px]">·</span>
                      <span className="text-slate-600 text-[10px]">
                        {new Date(h.created_at).toLocaleDateString('es-AR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
