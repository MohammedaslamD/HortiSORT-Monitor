import { apiClient } from './apiClient'
import { MOCK_TICKETS, MOCK_TICKET_COMMENTS } from '../data/mockData'
import type { Ticket, TicketComment, TicketStatus, TicketSeverity, ResolutionData, NewTicketData } from '../types'

export async function getTickets(): Promise<Ticket[]> {
  try {
    const res = await apiClient.get<Ticket[]>('/api/v1/tickets')
    return res.data
  } catch { return [...MOCK_TICKETS] }
}

export async function getTicketsByMachineId(machineId: number): Promise<Ticket[]> {
  try {
    const res = await apiClient.get<Ticket[]>(`/api/v1/tickets?machineId=${machineId}`)
    return res.data
  } catch { return MOCK_TICKETS.filter(t => t.machine_id === machineId) }
}

export async function getOpenTicketCount(): Promise<number> {
  try {
    const res = await apiClient.get<{ open: number; bySeverity: Record<string, number> }>('/api/v1/tickets/stats')
    return res.data.open
  } catch { return MOCK_TICKETS.filter(t => ['open', 'in_progress', 'reopened'].includes(t.status)).length }
}

export async function getRecentTickets(limit: number): Promise<Ticket[]> {
  try {
    const res = await apiClient.get<Ticket[]>(`/api/v1/tickets?limit=${limit}&sort=created_at:desc`)
    return res.data
  } catch { return [...MOCK_TICKETS].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, limit) }
}

export async function getTicketById(id: number): Promise<Ticket | null> {
  try {
    const res = await apiClient.get<Ticket>(`/api/v1/tickets/${id}`)
    return res.data
  } catch { return MOCK_TICKETS.find(t => t.id === id) ?? null }
}

export async function getTicketsByStatus(status: TicketStatus): Promise<Ticket[]> {
  try {
    const res = await apiClient.get<Ticket[]>(`/api/v1/tickets?status=${status}`)
    return res.data
  } catch { return MOCK_TICKETS.filter(t => t.status === status) }
}

export async function getTicketsBySeverity(severity: TicketSeverity): Promise<Ticket[]> {
  try {
    const res = await apiClient.get<Ticket[]>(`/api/v1/tickets?severity=${severity}`)
    return res.data
  } catch { return MOCK_TICKETS.filter(t => t.severity === severity) }
}

export async function getTicketsByAssignedTo(userId: number): Promise<Ticket[]> {
  try {
    const res = await apiClient.get<Ticket[]>(`/api/v1/tickets?assignedTo=${userId}`)
    return res.data
  } catch { return MOCK_TICKETS.filter(t => t.assigned_to === userId) }
}

export async function getTicketsByRaisedBy(userId: number): Promise<Ticket[]> {
  try {
    const res = await apiClient.get<Ticket[]>(`/api/v1/tickets?raisedBy=${userId}`)
    return res.data
  } catch { return MOCK_TICKETS.filter(t => t.raised_by === userId) }
}

export async function getTicketsByMachineIds(ids: number[]): Promise<Ticket[]> {
  try {
    const res = await apiClient.get<Ticket[]>('/api/v1/tickets')
    const idSet = new Set(ids)
    return res.data.filter(t => idSet.has(t.machine_id))
  } catch {
    const idSet = new Set(ids)
    return MOCK_TICKETS.filter(t => idSet.has(t.machine_id))
  }
}

export async function getTicketComments(ticketId: number): Promise<TicketComment[]> {
  try {
    const res = await apiClient.get<{ comments: TicketComment[] }>(`/api/v1/tickets/${ticketId}`)
    return res.data.comments ?? []
  } catch { return MOCK_TICKET_COMMENTS.filter(c => c.ticket_id === ticketId) }
}

export async function addTicketComment(data: Omit<TicketComment, 'id' | 'created_at'>): Promise<TicketComment> {
  try {
    const res = await apiClient.post<TicketComment>(`/api/v1/tickets/${data.ticket_id}/comments`, {
      message: data.message,
      attachment_url: data.attachment_url,
    })
    return res.data
  } catch {
    return { ...data, id: Date.now(), created_at: new Date().toISOString() }
  }
}

export async function updateTicketStatus(id: number, status: TicketStatus, resolution?: ResolutionData): Promise<Ticket> {
  try {
    if (resolution) {
      const res = await apiClient.patch<Ticket>(`/api/v1/tickets/${id}/resolve`, resolution)
      return res.data
    }
    const res = await apiClient.patch<Ticket>(`/api/v1/tickets/${id}/status`, { status })
    return res.data
  } catch {
    const t = MOCK_TICKETS.find(t => t.id === id)
    if (!t) throw new Error(`Ticket ${id} not found`)
    return { ...t, status }
  }
}

export async function createTicket(data: NewTicketData): Promise<Ticket> {
  try {
    const res = await apiClient.post<Ticket>('/api/v1/tickets', { ...data })
    return res.data
  } catch {
    return {
      id: Date.now(), ...data, status: 'open' as const,
      ticket_number: `TKT-TEMP-${Date.now()}`,
      sla_hours: 24,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      raised_by: 5, assigned_to: 3, resolved_at: null,
      root_cause: null, solution: null, parts_used: null,
      resolution_time_mins: null, reopen_count: 0, reopened_at: null,
      customer_rating: null, customer_feedback: null,
    }
  }
}
