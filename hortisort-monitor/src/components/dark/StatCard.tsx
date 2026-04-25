import type { ReactNode } from 'react'
import { StatusDot } from './StatusDot'
import { IconTile } from './IconTile'
import { TrendPill } from './TrendPill'

type StatAccent = 'green' | 'blue' | 'yellow' | 'red' | 'purple' | 'cyan'

interface StatCardProps {
  accent: StatAccent
  label: string
  value: ReactNode
  valueColor?: string
  icon: ReactNode
  trend?: { direction: 'up' | 'down'; value: string }
  sub?: ReactNode
  dot?: 'green' | 'red' | 'amber'
}

const ACCENT_BAR: Record<StatAccent, string> = {
  green:  'from-brand-green',
  blue:   'from-brand-cyan',
  yellow: 'from-brand-amber',
  red:    'from-brand-red',
  purple: 'from-brand-purple',
  cyan:   'from-brand-cyan',
}

const ICON_TONE: Record<StatAccent, 'green' | 'red' | 'amber' | 'cyan' | 'purple' | 'blue'> = {
  green: 'green', blue: 'blue', yellow: 'amber', red: 'red', purple: 'purple', cyan: 'cyan',
}

/** Gradient stat card: top accent bar, label+icon row, big value, optional trend/sub. */
export function StatCard({ accent, label, value, valueColor, icon, trend, sub, dot }: StatCardProps) {
  return (
    <div className="relative stat-gradient border border-line rounded-xl p-4 overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r to-transparent ${ACCENT_BAR[accent]}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {dot && <StatusDot tone={dot} pulse />}
          <span className="text-[10px] font-semibold tracking-widest text-fg-4 uppercase">
            {label}
          </span>
        </div>
        <IconTile tone={ICON_TONE[accent]}>{icon}</IconTile>
      </div>
      <div className="mt-2 text-4xl font-extrabold text-fg-1 leading-tight" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </div>
      {(trend || sub) && (
        <div className="mt-1 flex items-center gap-2 text-xs text-fg-4">
          {trend && <TrendPill direction={trend.direction} value={trend.value} />}
          {sub && <span>{sub}</span>}
        </div>
      )}
    </div>
  )
}
