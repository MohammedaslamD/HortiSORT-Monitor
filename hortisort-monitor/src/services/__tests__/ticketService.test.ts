import { vi, beforeEach, it, expect, describe } from 'vitest'

vi.mock('../apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

import { apiClient } from '../apiClient'
import {
  getTickets,
  getTicketsByMachineId,
  getOpenTicketCount,
  getRecentTickets,
  getTicketById,
  getTicketsByStatus,
  getTicketsBySeverity,
  getTicketsByAssignedTo,
  getTicketsByRaisedBy,
  getTicketsByMachineIds,
  getTicketComments,
  addTicketComment,
  updateTicketStatus,
  createTicket,
} from '../ticketService'

const mockGet = apiClient.get as ReturnType<typeof vi.fn>
const mockPost = apiClient.post as ReturnType<typeof vi.fn>
const mockPatch = apiClient.patch as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getTickets', () => {
  it('calls GET /api/v1/tickets and returns data', async () => {
    mockGet.mockResolvedValue({ data: [] })
    const result = await getTickets()
    expect(mockGet).toHaveBeenCalledWith('/api/v1/tickets')
    expect(result).toEqual([])
  })
})

describe('getTicketsByMachineId', () => {
  it('calls GET /api/v1/tickets?machineId=:id', async () => {
    mockGet.mockResolvedValue({ data: [] })
    await getTicketsByMachineId(7)
    expect(mockGet).toHaveBeenCalledWith('/api/v1/tickets?machineId=7')
  })
})

describe('getOpenTicketCount', () => {
  it('calls GET /api/v1/tickets/stats and returns stats.open', async () => {
    mockGet.mockResolvedValue({ data: { open: 5, bySeverity: {} } })
    const count = await getOpenTicketCount()
    expect(mockGet).toHaveBeenCalledWith('/api/v1/tickets/stats')
    expect(count).toBe(5)
  })
})

describe('getRecentTickets', () => {
  it('calls GET /api/v1/tickets with limit and sort params', async () => {
    mockGet.mockResolvedValue({ data: [] })
    await getRecentTickets(3)
    expect(mockGet).toHaveBeenCalledWith('/api/v1/tickets?limit=3&sort=created_at:desc')
  })
})

describe('getTicketById', () => {
  it('calls GET /api/v1/tickets/:id and returns ticket', async () => {
    const ticket = { id: 2, title: 'Sensor issue' }
    mockGet.mockResolvedValue({ data: ticket })
    const result = await getTicketById(2)
    expect(mockGet).toHaveBeenCalledWith('/api/v1/tickets/2')
    expect(result).toEqual(ticket)
  })

  it('returns null when apiClient throws', async () => {
    mockGet.mockRejectedValue(new Error('Not found'))
    const result = await getTicketById(999)
    expect(result).toBeNull()
  })
})

describe('getTicketsByStatus', () => {
  it('calls GET /api/v1/tickets?status=:status', async () => {
    mockGet.mockResolvedValue({ data: [] })
    await getTicketsByStatus('open')
    expect(mockGet).toHaveBeenCalledWith('/api/v1/tickets?status=open')
  })
})

describe('getTicketsBySeverity', () => {
  it('calls GET /api/v1/tickets?severity=:severity', async () => {
    mockGet.mockResolvedValue({ data: [] })
    await getTicketsBySeverity('P1_critical')
    expect(mockGet).toHaveBeenCalledWith('/api/v1/tickets?severity=P1_critical')
  })
})

describe('getTicketsByAssignedTo', () => {
  it('calls GET /api/v1/tickets?assignedTo=:userId', async () => {
    mockGet.mockResolvedValue({ data: [] })
    await getTicketsByAssignedTo(5)
    expect(mockGet).toHaveBeenCalledWith('/api/v1/tickets?assignedTo=5')
  })
})

describe('getTicketsByRaisedBy', () => {
  it('calls GET /api/v1/tickets?raisedBy=:userId', async () => {
    mockGet.mockResolvedValue({ data: [] })
    await getTicketsByRaisedBy(4)
    expect(mockGet).toHaveBeenCalledWith('/api/v1/tickets?raisedBy=4')
  })
})

describe('getTicketsByMachineIds', () => {
  it('fetches all tickets and filters client-side by machine ID set', async () => {
    const tickets = [
      { id: 1, machine_id: 3 },
      { id: 2, machine_id: 8 },
      { id: 3, machine_id: 5 },
    ]
    mockGet.mockResolvedValue({ data: tickets })
    const result = await getTicketsByMachineIds([3, 8])
    expect(mockGet).toHaveBeenCalledWith('/api/v1/tickets')
    expect(result).toHaveLength(2)
    expect(result.map((t) => t.id)).toEqual(expect.arrayContaining([1, 2]))
  })

  it('returns empty array for empty ids list (all filtered out)', async () => {
    mockGet.mockResolvedValue({ data: [{ id: 1, machine_id: 3 }] })
    const result = await getTicketsByMachineIds([])
    expect(result).toHaveLength(0)
  })
})

describe('getTicketComments', () => {
  it('calls GET /api/v1/tickets/:id and returns comments array', async () => {
    const comments = [{ id: 1, ticket_id: 5, message: 'hello' }]
    mockGet.mockResolvedValue({ data: { id: 5, comments } })
    const result = await getTicketComments(5)
    expect(mockGet).toHaveBeenCalledWith('/api/v1/tickets/5')
    expect(result).toEqual(comments)
  })
})

describe('addTicketComment', () => {
  it('posts to /api/v1/tickets/:id/comments with correct body', async () => {
    const created = { id: 1, ticket_id: 5, user_id: 2, message: 'hello' }
    mockPost.mockResolvedValue({ data: created })
    const result = await addTicketComment({
      ticket_id: 5,
      user_id: 2,
      message: 'hello',
      attachment_url: null,
    })
    expect(mockPost).toHaveBeenCalledWith('/api/v1/tickets/5/comments', {
      message: 'hello',
      attachment_url: null,
    })
    expect(result).toEqual(created)
  })
})

describe('updateTicketStatus', () => {
  it('routes to /status when no resolution provided', async () => {
    mockPatch.mockResolvedValue({ data: { id: 3, status: 'in_progress' } })
    await updateTicketStatus(3, 'in_progress')
    expect(mockPatch).toHaveBeenCalledWith('/api/v1/tickets/3/status', { status: 'in_progress' })
  })

  it('routes to /resolve when resolution is provided', async () => {
    mockPatch.mockResolvedValue({ data: { id: 3, status: 'resolved' } })
    await updateTicketStatus(3, 'resolved', {
      root_cause: 'sensor fault',
      solution: 'replaced sensor',
      parts_used: 'sensor XYZ',
    })
    expect(mockPatch).toHaveBeenCalledWith('/api/v1/tickets/3/resolve', {
      root_cause: 'sensor fault',
      solution: 'replaced sensor',
      parts_used: 'sensor XYZ',
    })
  })
})

describe('createTicket', () => {
  it('posts to /api/v1/tickets with the full data body', async () => {
    const data = {
      machine_id: 1,
      raised_by: 3,
      assigned_to: 5,
      severity: 'P2_high' as const,
      category: 'hardware' as const,
      title: 'Test ticket',
      description: 'Testing creation',
    }
    const created = { id: 11, ticket_number: 'TKT-123', ...data }
    mockPost.mockResolvedValue({ data: created })
    const result = await createTicket(data)
    expect(mockPost).toHaveBeenCalledWith('/api/v1/tickets', data)
    expect(result).toEqual(created)
  })
})
