'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Users2,
  ListChecks,
  Shield,
  ScrollText,
  LogOut,
  Settings,
  BarChart3,
  Compass,
  Handshake,
  CreditCard,
} from 'lucide-react'

const sections = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Usuarios',
    items: [
      { href: '/dashboard/waitlist', label: 'Waitlist', icon: ListChecks },
      { href: '/dashboard/users', label: 'Usuarios', icon: Users },
      { href: '/dashboard/moderation', label: 'Moderación', icon: Shield },
    ],
  },
  {
    label: 'Contenido',
    items: [
      { href: '/dashboard/groups', label: 'Grupos', icon: Users2 },
      { href: '/dashboard/partners', label: 'Partners', icon: Handshake },
      { href: '/dashboard/subscriptions', label: 'Suscripciones', icon: CreditCard },
      { href: '/dashboard/discovery', label: 'Discovery', icon: Compass },
    ],
  },
  {
    label: 'Datos',
    items: [
      { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/dashboard/audit-log', label: 'Audit Log', icon: ScrollText },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/dashboard/config', label: 'Configuración', icon: Settings },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 min-h-screen bg-[#0c111a] border-r border-[#1b212d] flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-[#1b212d]">
        <h1 className="text-xl font-extrabold text-white">
          hobbyer
          <span className="text-[#0d59f2]">.</span>
          <span className="text-xs font-normal text-slate-500 ml-2">
            admin
          </span>
        </h1>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.label} className="mb-3">
            <p className="px-4 py-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
              {section.label}
            </p>
            {section.items.map((item) => {
              const Icon = item.icon
              const isActive = item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                    ${isActive
                      ? 'bg-[#0d59f2] text-white'
                      : 'text-slate-400 hover:text-white hover:bg-[#1b212d]'
                    }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-[#1b212d]">
        <button
          onClick={() => {
            localStorage.removeItem('hobbyer_admin_token')
            window.location.href = '/login'
          }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-[#1b212d] transition-all w-full"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
