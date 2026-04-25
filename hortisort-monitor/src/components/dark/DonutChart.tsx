interface DonutSegment {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  segments: DonutSegment[]
  centerLabel: string
}

const C = 100 // r=15.915 -> circumference ~ 100

/** Hand-rolled SVG donut + legend, matching dark-ui-v2.html "Fleet Breakdown". */
export function DonutChart({ segments, centerLabel }: DonutChartProps) {
  const total = segments.reduce((s, x) => s + x.value, 0)
  let offset = 25
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 42 42" className="w-32 h-32 flex-shrink-0">
        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="rgb(var(--line))" strokeWidth="5" />
        {segments.map((seg, i) => {
          const pct = total === 0 ? 0 : (seg.value / total) * C
          const dasharray = `${pct} ${C - pct}`
          const dashoffset = offset
          offset = offset - pct
          return (
            <circle
              key={i}
              cx="21" cy="21" r="15.915" fill="transparent"
              stroke={seg.color} strokeWidth="5"
              strokeDasharray={dasharray} strokeDashoffset={dashoffset}
              transform="rotate(-90 21 21)"
            />
          )
        })}
        <text x="21" y="20" textAnchor="middle" fill="rgb(var(--fg-1))" fontSize="7" fontWeight="800">{total}</text>
        <text x="21" y="26" textAnchor="middle" fill="rgb(var(--fg-4))" fontSize="3">{centerLabel}</text>
      </svg>
      <div className="flex-1 flex flex-col gap-1.5 text-xs">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: seg.color }} />
            <span className="flex-1 text-fg-2">{seg.label}</span>
            <span className="font-semibold text-fg-1">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
