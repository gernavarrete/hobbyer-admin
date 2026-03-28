interface TableSkeletonProps {
  rows?: number
  cols?: number
}

export default function TableSkeleton({ rows = 5, cols = 4 }: TableSkeletonProps) {
  return (
    <div className="bg-[#1b212d] rounded-2xl border border-[#252b3b] overflow-hidden">
      <div className="w-full">
        {/* Header */}
        <div className="flex border-b border-[#252b3b] px-6 py-4 gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <div
              key={i}
              className="h-3 rounded bg-[#252b3b] animate-pulse flex-1"
            />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            className="flex px-6 py-4 gap-4 border-b border-[#252b3b]/50"
          >
            {Array.from({ length: cols }).map((_, colIdx) => (
              <div
                key={colIdx}
                className="h-4 rounded bg-[#252b3b] animate-pulse flex-1"
                style={{ maxWidth: colIdx === 0 ? '40%' : undefined }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
