import type { TicketSeverity } from '../../types'
import type { StatBadgeVariant } from './StatBadge'

const map: Record<TicketSeverity, StatBadgeVariant> = {
  P1_critical: 'critical',
  P2_high: 'high',
  P3_medium: 'medium',
  P4_low: 'low',
}

export function severityToBadgeVariant(severity: TicketSeverity): StatBadgeVariant {
  return map[severity]
}
