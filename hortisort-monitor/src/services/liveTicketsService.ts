import type { TicketRow, TicketStats, Ticket, User } from '../types'
import { apiClient } from './apiClient'

const EMPTY_STATS: TicketStats = { open: 0, in_progress: 0, resolved_today: 0, avg_resolution_hours: 0 }

/**
 * Live tickets service — all data from real backend API.
 */
export const liveTicketsService = {
  async getTicketStats(): Promise<TicketStats> {
    try {
      const res = await apiClient.get<TicketStats>('/api/v1/tickets/stats')
      return res.data
    } catch {
      return EMPTY_STATS
    }
  },

  async getTicketRows(): Promise<TicketRow[]> {
    try {
      const [ticketsRes, machinesRes, usersRes] = await Promise.all([
        apiClient.get<(Ticket & { machine?: { machine_code: string } })[]>('/api/v1/tickets?limit=200'),
        apiClient.get<{ id: number; machine_code: string }[]>('/api/v1/machines'),
        apiClient.get<User[]>('/api/v1/users').catch(() => ({ data: [] as User[] })),
      ])

      const machineById = new Map(machinesRes.data.map((m) => [m.id, m.machine_code]))
      const userById    = new Map((usersRes as { data: User[] }).data.map((u) => [u.id, u.name]))

      return ticketsRes.data.map((t) => ({
        id: t.id,
        ticket_number: t.ticket_number,
        machine_code: t.machine?.machine_code ?? machineById.get(t.machine_id) ?? `#${t.machine_id}`,
        title: t.title,
        severity: t.severity,
        status: t.status,
        assigned_to_name: userById.get(t.assigned_to) ?? `User #${t.assigned_to}`,
        created_at: t.created_at,
      }))
    } catch {
      return []
    }
  },
}
