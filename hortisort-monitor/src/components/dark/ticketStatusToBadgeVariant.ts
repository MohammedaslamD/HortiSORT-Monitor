import type { TicketStatus } from '../../types'
import type { StatBadgeVariant } from './StatBadge'

const map: Record<TicketStatus, StatBadgeVariant> = {
  open:        'open',
  in_progress: 'inprog',
  resolved:    'resolved',
  closed:      'resolved',
  reopened:    'open',
}

export function ticketStatusToBadgeVariant(status: TicketStatus): StatBadgeVariant {
  return map[status]
}
