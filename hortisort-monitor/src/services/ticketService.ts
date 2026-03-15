import type { Ticket, TicketStatus, TicketSeverity, TicketComment, ResolutionData, NewTicketData } from '../types'
import { MOCK_TICKETS, MOCK_TICKET_COMMENTS } from '../data/mockData'

/** Returns all tickets. */
export async function getTickets(): Promise<Ticket[]> {
  return MOCK_TICKETS
}

/** Returns tickets for a specific machine. */
export async function getTicketsByMachineId(machineId: number): Promise<Ticket[]> {
  return MOCK_TICKETS.filter((t) => t.machine_id === machineId)
}

/** Returns the count of tickets with status open, in_progress, or reopened. */
export async function getOpenTicketCount(): Promise<number> {
  const activeStatuses = ['open', 'in_progress', 'reopened']
  return MOCK_TICKETS.filter((t) => activeStatuses.includes(t.status)).length
}

/** Returns the most recent tickets, sorted by created_at descending. */
export async function getRecentTickets(limit: number): Promise<Ticket[]> {
  return [...MOCK_TICKETS]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit)
}

/** SLA hours by severity. */
const SLA_HOURS: Record<TicketSeverity, number> = {
  P1_critical: 4,
  P2_high: 8,
  P3_medium: 24,
  P4_low: 72,
}

/** Returns a single ticket by ID, or null if not found. */
export async function getTicketById(id: number): Promise<Ticket | null> {
  return MOCK_TICKETS.find((t) => t.id === id) ?? null
}

/** Returns tickets matching a specific status. */
export async function getTicketsByStatus(status: TicketStatus): Promise<Ticket[]> {
  return MOCK_TICKETS.filter((t) => t.status === status)
}

/** Returns tickets matching a specific severity. */
export async function getTicketsBySeverity(severity: TicketSeverity): Promise<Ticket[]> {
  return MOCK_TICKETS.filter((t) => t.severity === severity)
}

/** Returns tickets assigned to a specific user. */
export async function getTicketsByAssignedTo(userId: number): Promise<Ticket[]> {
  return MOCK_TICKETS.filter((t) => t.assigned_to === userId)
}

/** Returns tickets raised by a specific user. */
export async function getTicketsByRaisedBy(userId: number): Promise<Ticket[]> {
  return MOCK_TICKETS.filter((t) => t.raised_by === userId)
}

/** Returns tickets for a set of machine IDs (customer role scoping). */
export async function getTicketsByMachineIds(ids: number[]): Promise<Ticket[]> {
  const idSet = new Set(ids)
  return MOCK_TICKETS.filter((t) => idSet.has(t.machine_id))
}

/** Returns comments for a ticket, sorted by created_at ascending. */
export async function getTicketComments(ticketId: number): Promise<TicketComment[]> {
  return [...MOCK_TICKET_COMMENTS]
    .filter((c) => c.ticket_id === ticketId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
}

/** Adds a comment to a ticket. Auto-generates id and created_at. */
export async function addTicketComment(
  data: Omit<TicketComment, 'id' | 'created_at'>,
): Promise<TicketComment> {
  const now = new Date().toISOString()
  const comment: TicketComment = {
    id: MOCK_TICKET_COMMENTS.length + 1,
    ...data,
    created_at: now,
  }
  MOCK_TICKET_COMMENTS.push(comment)
  return comment
}

/** Updates a ticket's status. On resolve, sets resolution fields. On reopen, increments reopen_count. */
export async function updateTicketStatus(
  id: number,
  status: TicketStatus,
  resolution?: ResolutionData,
): Promise<Ticket> {
  const ticket = MOCK_TICKETS.find((t) => t.id === id)
  if (!ticket) throw new Error(`Ticket ${id} not found`)

  const now = new Date().toISOString()
  ticket.status = status
  ticket.updated_at = now

  if (status === 'resolved' && resolution) {
    ticket.resolved_at = now
    ticket.resolution_time_mins = Math.round(
      (Date.now() - new Date(ticket.created_at).getTime()) / 60000,
    )
    ticket.root_cause = resolution.root_cause
    ticket.solution = resolution.solution
    ticket.parts_used = resolution.parts_used ?? null
  }

  if (status === 'reopened') {
    ticket.reopen_count += 1
    ticket.reopened_at = now
    ticket.resolved_at = null
    ticket.resolution_time_mins = null
  }

  return ticket
}

/** Creates a new ticket. Auto-generates id, ticket_number, sla_hours, timestamps. */
export async function createTicket(data: NewTicketData): Promise<Ticket> {
  const now = new Date().toISOString()
  const id = MOCK_TICKETS.length + 1
  const ticketNumber = `TKT-${String(id).padStart(5, '0')}`

  const ticket: Ticket = {
    id,
    ticket_number: ticketNumber,
    ...data,
    status: 'open',
    sla_hours: SLA_HOURS[data.severity],
    created_at: now,
    resolved_at: null,
    resolution_time_mins: null,
    root_cause: null,
    solution: null,
    parts_used: null,
    reopen_count: 0,
    reopened_at: null,
    customer_rating: null,
    customer_feedback: null,
    updated_at: now,
  }
  MOCK_TICKETS.push(ticket)
  return ticket
}
