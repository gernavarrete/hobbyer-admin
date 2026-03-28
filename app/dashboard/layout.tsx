'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import ErrorBoundary from '@/components/ErrorBoundary'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/waitlist': 'Waitlist',
  '/dashboard/users': 'Usuarios',
  '/dashboard/moderation': 'Moderación',
  '/dashboard/groups': 'Grupos',
  '/dashboard/partners': 'Partners',
  '/dashboard/discovery': 'Discovery',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/audit-log': 'Audit Log',
  '/dashboard/config': 'Configuración',
}

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  if (pathname.startsWith('/dashboard/users/')) return 'Detalle de usuario'
  return 'Dashboard'
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const token = localStorage.getItem('hobbyer_admin_token')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  const title = getPageTitle(pathname)

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Topbar */}
        <header className="flex items-center justify-between px-8 py-4 border-b border-[#1b212d] bg-[#101622]">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF6B00]/20 text-[#FF6B00] uppercase tracking-wider">
              Beta
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {now.toLocaleDateString('es-AR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}{' '}
            — {now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </header>
        <main className="flex-1 overflow-auto">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
