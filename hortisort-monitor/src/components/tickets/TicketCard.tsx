import type { Ticket, TicketStatus, TicketSeverity } from '../../types'
import { Badge } from '../common/Badge'

interface TicketCardProps {
  ticket: Ticket
  machineName: string
  assignedToName: string
  onClick: () => void
}

/** Active statuses where SLA breach is meaningful. */
const ACTIVE_STATUSES: TicketStatus[] = ['open', 'in_progress', 'reopened']

/** Map TicketSeverity to Badge color. */
function getSeverityColor(severity: TicketSeverity): 'red' | 'yellow' | 'gray' {
  const map: Record<TicketSeverity, 'red' | 'yellow' | 'gray'> = {
    P1_critical: 'red',
    P2_high: 'yellow',
    P3_medium: 'yellow',
    P4_low: 'gray',
  }
  return map[severity]
}

/** Map TicketStatus to Badge color. */
function getStatusColor(status: TicketStatus): 'red' | 'yellow' | 'green' | 'gray' {
  const map: Record<TicketStatus, 'red' | 'yellow' | 'green' | 'gray'> = {
    open: 'red',
    in_progress: 'yellow',
    resolved: 'green',
    closed: 'gray',
    reopened: 'red',
  }
  return map[status]
}

/** Format an ISO date string to a readable date. */
function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** Readable severity labels. */
const SEVERITY_LABEL: Record<TicketSeverity, string> = {
  P1_critical: 'P1 Critical',
  P2_high: 'P2 High',
  P3_medium: 'P3 Medium',
  P4_low: 'P4 Low',
}

/** Readable status labels. */
const STATUS_LABEL: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
  reopened: 'Reopened',
}

/**
 * Card displaying a single ticket in the tickets list.
 *
 * Shows ticket number, title, severity + status badges, machine name,
 * assigned engineer, created date, and an SLA breach indicator when the
 * ticket is active and has exceeded its SLA window.
 */
export function TicketCard({
  ticket,
  machineName,
  assignedToName,
  onClick,
}: TicketCardProps) {
  /* SLA breach: active ticket where elapsed time exceeds sla_hours */
  const isSlaBreach =
    ACTIVE_STATUSES.includes(ticket.status) &&
    Date.now() - new Date(ticket.created_at).getTime() > ticket.sla_hours * 3600000

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow duration-150"
    >
      {/* Top row: ticket number + severity + status + SLA breach */}
      <div className="flex items-center gap-2 flex-wrap mb-1">
        <span className="text-xs font-mono text-gray-400">{ticket.ticket_number}</span>
        <Badge color={getSeverityColor(ticket.severity)} size="sm">
          {SEVERITY_LABEL[ticket.severity]}
        </Badge>
        <Badge color={getStatusColor(ticket.status)} size="sm">
          {STATUS_LABEL[ticket.status]}
        </Badge>
        {isSlaBreach && (
          <Badge color="red" size="sm">
            SLA Breached
          </Badge>
        )}
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-gray-900 mb-2">{ticket.title}</h4>

      {/* Info row: machine, assigned to, created date */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
        <span>{machineName}</span>
        <span>Assigned: {assignedToName}</span>
        <span>{formatDate(ticket.created_at)}</span>
      </div>
    </div>
  )
}
