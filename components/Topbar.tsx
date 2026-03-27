'use client'

export default function Topbar() {
  return (
    <header className="h-16 border-b border-[#1b212d] bg-[#101622] flex items-center justify-between px-8">
      <div />
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#0d59f2] flex items-center justify-center text-white text-sm font-bold">
          A
        </div>
        <span className="text-sm text-slate-400">Admin</span>
      </div>
    </header>
  )
}
