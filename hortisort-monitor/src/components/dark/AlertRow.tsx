import type { Alert } from '../../types'
import { ALERT_BADGE_TONE } from './alertBadgeVariant'

interface AlertRowProps {
  alert: Alert
  timeAgo: string
}

const SEVERITY_BORDER = {
  critical: 'border-l-brand-red',
  warn:     'border-l-brand-amber',
  info:     'border-l-brand-cyan',
  ok:       'border-l-brand-green',
} as const

/** Live Alerts feed entry with severity-tinted left border. */
export function AlertRow({ alert, timeAgo }: AlertRowProps) {
  return (
    <div
      className={[
        'bg-bg-surface3 rounded-lg p-3 border-l-[3px]',
        SEVERITY_BORDER[alert.severity],
      ].join(' ')}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-fg-1">{alert.machine_label}</span>
        <span className="text-[10px] text-fg-4">{timeAgo}</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-fg-2">
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${ALERT_BADGE_TONE[alert.badge_label]}`}>
          {alert.badge_label}
        </span>
        <span>{alert.message}</span>
      </div>
    </div>
  )
}
