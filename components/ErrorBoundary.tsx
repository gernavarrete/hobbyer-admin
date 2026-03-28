'use client'
import React from 'react'
import { AlertCircle } from 'lucide-react'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 flex items-center justify-center min-h-[400px]">
          <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] p-12 text-center max-w-md">
            <AlertCircle className="mx-auto mb-4 text-red-400" size={40} />
            <p className="text-red-400 text-lg font-medium mb-2">
              Algo salió mal
            </p>
            <p className="text-slate-500 text-sm mb-6">
              Ocurrió un error inesperado en esta sección
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-5 py-2.5 rounded-xl bg-[#0d59f2] text-white text-sm font-semibold
                hover:bg-blue-600 transition-all"
            >
              Reintentar
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
