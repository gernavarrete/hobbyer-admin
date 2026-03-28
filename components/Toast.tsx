'use client'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  visible: boolean
  onClose?: () => void
}

const TYPE_STYLES = {
  success: 'border-green-500/30 text-green-400',
  error: 'border-red-500/30 text-red-400',
  info: 'border-[#252b3b] text-white',
}

export default function Toast({ message, type = 'info', visible, onClose }: ToastProps) {
  if (!visible) return null

  return (
    <div
      className={`fixed top-6 right-6 z-50 bg-[#1b212d] border px-5 py-3 rounded-xl
        shadow-xl text-sm font-medium transition-all duration-300
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
        ${TYPE_STYLES[type]}`}
    >
      <div className="flex items-center gap-3">
        <span>{message}</span>
        {onClose && (
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            &times;
          </button>
        )}
      </div>
    </div>
  )
}
