import type { Alert, AlertBadgeLabel } from '../../types'

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

const BADGE_TONE: Record<AlertBadgeLabel, string> = {
  P1:   'bg-brand-red/20 text-brand-red',
  P2:   'bg-brand-amber/20 text-brand-amber',
  P3:   'bg-brand-cyan/20 text-brand-cyan',
  P4:   'bg-fg-5/20 text-fg-3',
  INFO: 'bg-brand-cyan/20 text-brand-cyan',
  OK:   'bg-brand-green/20 text-brand-green',
}

/** Pure helper: maps a badge label to the visual tone classes used by AlertRow. */
export function alertBadgeVariant(label: AlertBadgeLabel): { label: AlertBadgeLabel; classes: string } {
  return { label, classes: BADGE_TONE[label] }
}

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
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${BADGE_TONE[alert.badge_label]}`}>
          {alert.badge_label}
        </span>
        <span>{alert.message}</span>
      </div>
    </div>
  )
}
