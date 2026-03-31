'use client'
import { useState } from 'react'
import api from '@/lib/api'

interface Props {
  reportId: string
  reportedUserId: string
  reportedUserName: string
  onClose: () => void
  onSuccess: () => void
}

const ACTIONS = [
  {
    key: 'dismiss',
    label: 'Ignorar',
    color: 'bg-slate-500/20 text-slate-300 hover:bg-slate-500/30',
    confirmColor: 'bg-slate-600',
    requiresConfirm: false,
  },
  {
    key: 'warn',
    label: 'Advertir',
    color: 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30',
    confirmColor: 'bg-yellow-600',
    requiresConfirm: false,
  },
  {
    key: 'ban_temp',
    label: 'Ban temporal (7 días)',
    color: 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30',
    confirmColor: 'bg-orange-600',
    requiresConfirm: false,
  },
  {
    key: 'ban_permanent',
    label: 'Ban permanente',
    color: 'bg-red-500/20 text-red-400 hover:bg-red-500/30',
    confirmColor: 'bg-red-600',
    requiresConfirm: true,
  },
] as const

type ActionKey = typeof ACTIONS[number]['key']

export default function ModerationActionModal({
  reportId,
  reportedUserName,
  onClose,
  onSuccess,
}: Props) {
  const [selectedAction, setSelectedAction] = useState<ActionKey | null>(null)
  const [note, setNote] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState<ActionKey | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selected = ACTIONS.find(a => a.key === selectedAction)

  const handleAction = async (actionKey: ActionKey) => {
    const action = ACTIONS.find(a => a.key === actionKey)!

    if (action.requiresConfirm) {
      setSelectedAction(actionKey)
      setError(null)
      return
    }

    await submit(actionKey)
  }

  const submit = async (actionKey: ActionKey) => {
    setLoading(actionKey)
    setError(null)
    try {
      await api.patch(`/admin/reports/${reportId}`, {
        action: actionKey,
        note,
      })
      onSuccess()
      onClose()
    } catch {
      setError('Error al procesar la acción. Intenta nuevamente.')
    } finally {
      setLoading(null)
    }
  }

  const handleConfirmedSubmit = async () => {
    if (!selectedAction) return
    if (confirmText !== 'CONFIRMAR') {
      setError('Escribe CONFIRMAR para continuar.')
      return
    }
    await submit(selectedAction)
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-[#1b212d] border border-[#252b3b] rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-white">Tomar acción</h3>
            <p className="text-slate-400 text-sm mt-0.5">Usuario: <span className="text-white font-medium">{reportedUserName}</span></p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white text-xl leading-none transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Action buttons */}
        {!selectedAction && (
          <div className="grid grid-cols-2 gap-2 mb-5">
            {ACTIONS.map(action => (
              <button
                key={action.key}
                onClick={() => handleAction(action.key)}
                disabled={loading !== null}
                className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 text-left ${action.color}`}
              >
                {loading === action.key ? 'Procesando...' : action.label}
              </button>
            ))}
          </div>
        )}

        {/* Confirmation step for ban_permanent */}
        {selectedAction && selected?.requiresConfirm && (
          <div className="mb-5">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
              <p className="text-red-400 text-sm font-semibold">Acción irreversible</p>
              <p className="text-red-300/70 text-xs mt-1">
                Esto baneará permanentemente a <span className="font-semibold text-red-300">{reportedUserName}</span>.
                Escribe <span className="font-mono font-bold">CONFIRMAR</span> para continuar.
              </p>
            </div>
            <input
              type="text"
              value={confirmText}
              onChange={e => { setConfirmText(e.target.value); setError(null) }}
              placeholder="CONFIRMAR"
              className="w-full px-4 py-2.5 rounded-xl bg-[#101622] border border-[#252b3b]
                text-white text-sm placeholder-slate-500 focus:outline-none focus:border-red-500
                transition-colors font-mono mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setSelectedAction(null); setConfirmText(''); setError(null) }}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm text-slate-400
                  hover:text-white hover:bg-[#252b3b] transition-all"
              >
                Volver
              </button>
              <button
                onClick={handleConfirmedSubmit}
                disabled={loading !== null || confirmText !== 'CONFIRMAR'}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm
                  font-semibold hover:bg-red-700 disabled:opacity-50 transition-all"
              >
                {loading ? 'Procesando...' : 'Ban permanente'}
              </button>
            </div>
          </div>
        )}

        {/* Note textarea */}
        {!selectedAction && (
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Nota interna (opcional)..."
            className="w-full px-4 py-3 rounded-xl bg-[#101622] border border-[#252b3b]
              text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#0d59f2]
              transition-colors resize-none h-20"
          />
        )}

        {error && (
          <p className="mt-3 text-red-400 text-sm">{error}</p>
        )}
      </div>
    </div>
  )
}
