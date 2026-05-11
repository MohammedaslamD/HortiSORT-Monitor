import type { MachineStatus, TicketSeverity } from '../types'

const IST = 'Asia/Kolkata'

/**
 * Format an ISO timestamp as a human-readable relative time string.
 * Returns "just now", "X minutes ago", "X hours ago", "X days ago", or "X months ago".
 */
export function formatRelativeTime(isoString: string): string {
  const now = Date.now()
  const then = new Date(isoString).getTime()
  const diffMs = now - then

  if (diffMs < 0) return 'just now'

  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)

  if (seconds < 60) return 'just now'
  if (minutes === 1) return '1 minute ago'
  if (minutes < 60) return `${minutes} minutes ago`
  if (hours === 1) return '1 hour ago'
  if (hours < 24) return `${hours} hours ago`
  if (days === 1) return '1 day ago'
  if (days < 30) return `${days} days ago`
  if (months === 1) return '1 month ago'
  return `${months} months ago`
}

/**
 * Format an ISO timestamp as "DD MMM YYYY, HH:MM" in IST.
 */
export function formatDateTime(isoString: string): string {
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: IST,
  })
}

/**
 * Format an ISO timestamp as "DD MMM YYYY" in IST.
 */
export function formatDate(isoString: string): string {
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    timeZone: IST,
  })
}

/**
 * Format an ISO timestamp as "HH:MM" in IST.
 */
export function formatTime(isoString: string): string {
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit',
    timeZone: IST,
  })
}

/** Map MachineStatus to Badge color. */
export function getStatusBadgeColor(
  status: MachineStatus,
): 'green' | 'yellow' | 'red' | 'gray' {
  const map: Record<MachineStatus, 'green' | 'yellow' | 'red' | 'gray'> = {
    running: 'green',
    idle: 'yellow',
    down: 'red',
    offline: 'gray',
  }
  return map[status]
}

/** Map TicketSeverity to Badge color. */
export function getSeverityBadgeColor(
  severity: TicketSeverity,
): 'red' | 'yellow' | 'green' | 'blue' {
  const map: Record<TicketSeverity, 'red' | 'yellow' | 'green' | 'blue'> = {
    P1_critical: 'red',
    P2_high: 'yellow',
    P3_medium: 'yellow',
    P4_low: 'green',
  }
  return map[severity]
}
