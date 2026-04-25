import type { AlertBadgeLabel } from '../../types'

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

export { BADGE_TONE as ALERT_BADGE_TONE }
