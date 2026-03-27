interface MetricCardProps {
  title: string
  value: number | string
  subtitle?: string
  accent?: boolean
}

export default function MetricCard({
  title, value, subtitle, accent,
}: MetricCardProps) {
  return (
    <div className={`rounded-2xl p-6 border
      ${accent
        ? 'bg-[#0d59f2]/10 border-[#0d59f2]/20'
        : 'bg-[#1b212d] border-[#252b3b]'
      }`}>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
        {title}
      </p>
      <p className={`text-4xl font-extrabold tracking-tight
        ${accent ? 'text-[#0d59f2]' : 'text-white'}`}>
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-slate-500 mt-2">{subtitle}</p>
      )}
    </div>
  )
}
