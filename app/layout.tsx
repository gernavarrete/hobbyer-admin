import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Hobbyer Admin',
  description: 'Panel de administración de Hobbyer',
  robots: 'noindex, nofollow',
  icons: {
    icon: '/hobbyer-admin-favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} bg-[#101622] text-slate-100 antialiased`}>
        {children}
      </body>
    </html>
  )
}
