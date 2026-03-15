import { apiClient } from './apiClient'
import type { Ticket, TicketComment, TicketStatus, TicketSeverity, ResolutionData, NewTicketData } from '../types'

/** Returns all tickets (role-scoped server-side). */
export async function getTickets(): Promise<Ticket[]> {
  const res = await apiClient.get<Ticket[]>('/api/v1/tickets')
  return res.data
}

/** Returns tickets for a specific machine. */
export async function getTicketsByMachineId(machineId: number): Promise<Ticket[]> {
  const res = await apiClient.get<Ticket[]>(`/api/v1/tickets?machineId=${machineId}`)
  return res.data
}

/** Returns the count of active-status tickets (open | in_progress | reopened). */
export async function getOpenTicketCount(): Promise<number> {
  const res = await apiClient.get<{ open: number; bySeverity: Record<string, number> }>(
    '/api/v1/tickets/stats',
  )
  return res.data.open
}

/** Returns the most recent tickets sorted by created_at descending. */
export async function getRecentTickets(limit: number): Promise<Ticket[]> {
  const res = await apiClient.get<Ticket[]>(`/api/v1/tickets?limit=${limit}&sort=created_at:desc`)
  return res.data
}

/** Returns a single ticket by ID, or null if not found. */
export async function getTicketById(id: number): Promise<Ticket | null> {
  try {
    const res = await apiClient.get<Ticket>(`/api/v1/tickets/${id}`)
    return res.data
  } catch {
    return null
  }
}

/** Returns tickets matching a specific status. */
export async function getTicketsByStatus(status: TicketStatus): Promise<Ticket[]> {
  const res = await apiClient.get<Ticket[]>(`/api/v1/tickets?status=${status}`)
  return res.data
}

/** Returns tickets matching a specific severity. */
export async function getTicketsBySeverity(severity: TicketSeverity): Promise<Ticket[]> {
  const res = await apiClient.get<Ticket[]>(`/api/v1/tickets?severity=${severity}`)
  return res.data
}

/** Returns tickets assigned to a specific user. */
export async function getTicketsByAssignedTo(userId: number): Promise<Ticket[]> {
  const res = await apiClient.get<Ticket[]>(`/api/v1/tickets?assignedTo=${userId}`)
  return res.data
}

/** Returns tickets raised by a specific user. */
export async function getTicketsByRaisedBy(userId: number): Promise<Ticket[]> {
  const res = await apiClient.get<Ticket[]>(`/api/v1/tickets?raisedBy=${userId}`)
  return res.data
}

/** Returns tickets for a set of machine IDs. Filtered client-side (no bulk endpoint). */
export async function getTicketsByMachineIds(ids: number[]): Promise<Ticket[]> {
  const res = await apiClient.get<Ticket[]>('/api/v1/tickets')
  const idSet = new Set(ids)
  return res.data.filter((t) => idSet.has(t.machine_id))
}

/** Returns comments for a ticket (embedded in ticket detail response). */
export async function getTicketComments(ticketId: number): Promise<TicketComment[]> {
  const res = await apiClient.get<{ comments: TicketComment[] }>(`/api/v1/tickets/${ticketId}`)
  return res.data.comments ?? []
}

/** Adds a comment to a ticket. */
export async function addTicketComment(
  data: Omit<TicketComment, 'id' | 'created_at'>,
): Promise<TicketComment> {
  const res = await apiClient.post<TicketComment>(`/api/v1/tickets/${data.ticket_id}/comments`, {
    message: data.message,
    attachment_url: data.attachment_url,
  })
  return res.data
}

/** Updates a ticket's status. If resolution is provided, routes to /resolve. */
export async function updateTicketStatus(
  id: number,
  status: TicketStatus,
  resolution?: ResolutionData,
): Promise<Ticket> {
  if (resolution) {
    const res = await apiClient.patch<Ticket>(`/api/v1/tickets/${id}/resolve`, {
      root_cause: resolution.root_cause,
      solution: resolution.solution,
      parts_used: resolution.parts_used,
    })
    return res.data
  }
  const res = await apiClient.patch<Ticket>(`/api/v1/tickets/${id}/status`, { status })
  return res.data
}

/** Creates a new ticket. */
export async function createTicket(data: NewTicketData): Promise<Ticket> {
  const res = await apiClient.post<Ticket>('/api/v1/tickets', { ...data })
  return res.data
}
