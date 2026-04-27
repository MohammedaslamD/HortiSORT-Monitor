import type { TicketRow, TicketStats } from '../types'
import { MOCK_TICKET_STATS, MOCK_TICKETS, MOCK_MACHINES, MOCK_USERS } from '../data/mockData'

/**
 * Phase-B service for the TicketsPage. Returns static mock data today;
 * function bodies are the only thing that changes when a backend lands.
 */
export const liveTicketsService = {
  async getTicketStats(): Promise<TicketStats> {
    return MOCK_TICKET_STATS
  },

  async getTicketRows(): Promise<TicketRow[]> {
    const machineById = new Map(MOCK_MACHINES.map((m) => [m.id, m.machine_code]))
    const userById = new Map(MOCK_USERS.map((u) => [u.id, u.name]))
    return MOCK_TICKETS.map((t) => ({
      id: t.id,
      ticket_number: t.ticket_number,
      machine_code: machineById.get(t.machine_id) ?? '—',
      title: t.title,
      severity: t.severity,
      status: t.status,
      assigned_to_name: userById.get(t.assigned_to) ?? 'Unassigned',
      created_at: t.created_at,
    }))
  },
}
