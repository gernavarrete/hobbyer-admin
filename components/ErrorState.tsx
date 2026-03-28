'use client'
import { AlertCircle } from 'lucide-react'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export default function ErrorState({
  message = 'Ocurrió un error al cargar los datos',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-12 text-center">
      <AlertCircle className="mx-auto mb-4 text-red-400" size={40} />
      <p className="text-red-400 text-lg font-medium mb-2">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-5 py-2.5 rounded-xl bg-[#0d59f2] text-white text-sm font-semibold
            hover:bg-blue-600 transition-all"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}
