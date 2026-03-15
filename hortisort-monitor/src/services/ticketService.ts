import type { Ticket } from '../types'
import { MOCK_TICKETS } from '../data/mockData'

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
