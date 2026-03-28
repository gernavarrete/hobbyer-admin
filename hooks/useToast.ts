'use client'
import { useState, useCallback, useRef } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface ToastState {
  message: string
  type: ToastType
  visible: boolean
}

export default function useToast() {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'info',
    visible: false,
  })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hide = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }))
  }, [])

  const show = useCallback((message: string, type: ToastType) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToast({ message, type, visible: true })
    timerRef.current = setTimeout(hide, 3500)
  }, [hide])

  const showSuccess = useCallback((msg: string) => show(msg, 'success'), [show])
  const showError = useCallback((msg: string) => show(msg, 'error'), [show])

  return { toast, showSuccess, showError, hide }
}
