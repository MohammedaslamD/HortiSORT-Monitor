import type { ReactNode } from 'react'
import { ProgressBar } from './ProgressBar'

type Tone = 'running' | 'idle' | 'down' | 'offline'

interface MachineTileProps {
  tone: Tone
  name: string
  badge: ReactNode
  value: ReactNode
  valueColor?: string
  unit: string
  progressPercent?: number
  progressTone?: 'green' | 'red' | 'amber'
  onClick?: () => void
}

const BORDER: Record<Tone, string> = {
  running: 'border-brand-green/40',
  idle:    'border-brand-amber/40',
  down:    'border-brand-red/50 bg-gradient-to-br from-brand-red/10 to-transparent',
  offline: 'border-line',
}

/** Compact machine status tile for the dashboard fleet section. */
export function MachineTile({
  tone, name, badge, value, valueColor, unit, progressPercent, progressTone, onClick,
}: MachineTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'text-left bg-bg-surface3 rounded-lg p-3 border transition-all',
        'hover:border-brand-cyan hover:-translate-y-px',
        BORDER[tone],
      ].join(' ')}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-fg-1">{name}</span>
        {badge}
      </div>
      <div className="text-2xl font-extrabold text-fg-1" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </div>
      <div className="text-[10px] text-fg-4 mb-2">{unit}</div>
      {progressPercent !== undefined && progressTone && (
        <ProgressBar percent={progressPercent} tone={progressTone} height={3} />
      )}
    </button>
  )
}
