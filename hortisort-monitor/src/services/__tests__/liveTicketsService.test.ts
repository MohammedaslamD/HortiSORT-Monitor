import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../apiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

import { apiClient } from '../apiClient'
import { liveTicketsService } from '../liveTicketsService'

const mockGet = apiClient.get as ReturnType<typeof vi.fn>

const MOCK_STATS = { open: 4, in_progress: 2, resolved_today: 3, avg_resolution_hours: 4.2 }

const MOCK_MACHINES = [
  { id: 3, machine_code: 'HS-2024-0003' },
]

const MOCK_USERS = [
  { id: 1, name: 'Aslam Sheikh' },
]

const MOCK_TICKETS = [
  {
    id: 1,
    ticket_number: 'TKT-00001',
    machine_id: 3,
    machine: { machine_code: 'HS-2024-0003' },
    title: 'Motor fault',
    severity: 'P1_critical',
    status: 'open',
    assigned_to: 1,
    created_at: '2026-03-01T10:00:00Z',
  },
]

describe('liveTicketsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getTicketStats', () => {
    it('returns a Promise<TicketStats>', async () => {
      mockGet.mockResolvedValue({ data: MOCK_STATS })
      const result = liveTicketsService.getTicketStats()
      expect(result).toBeInstanceOf(Promise)
      await expect(result).resolves.toEqual(expect.objectContaining({
        open: expect.any(Number),
      }))
    })

    it('returns stats from the API', async () => {
      mockGet.mockResolvedValue({ data: MOCK_STATS })
      const stats = await liveTicketsService.getTicketStats()
      expect(stats.open).toBe(4)
      expect(stats.in_progress).toBe(2)
      expect(stats.resolved_today).toBe(3)
      expect(stats.avg_resolution_hours).toBe(4.2)
    })

    it('returns empty stats when API fails', async () => {
      mockGet.mockRejectedValue(new Error('Network error'))
      const stats = await liveTicketsService.getTicketStats()
      expect(stats.open).toBe(0)
    })
  })

  describe('getTicketRows', () => {
    beforeEach(() => {
      // tickets, machines, users — three sequential get calls
      mockGet
        .mockResolvedValueOnce({ data: MOCK_TICKETS })
        .mockResolvedValueOnce({ data: MOCK_MACHINES })
        .mockResolvedValueOnce({ data: MOCK_USERS })
    })

    it('returns one row per ticket', async () => {
      const rows = await liveTicketsService.getTicketRows()
      expect(rows.length).toBe(1)
    })

    it('resolves machine_code from ticket.machine embed', async () => {
      const rows = await liveTicketsService.getTicketRows()
      const tk1 = rows.find((r) => r.ticket_number === 'TKT-00001')
      expect(tk1?.machine_code).toBe('HS-2024-0003')
    })

    it('resolves assigned_to_name from users API', async () => {
      const rows = await liveTicketsService.getTicketRows()
      const tk1 = rows.find((r) => r.ticket_number === 'TKT-00001')
      expect(tk1?.assigned_to_name).toBe('Aslam Sheikh')
    })

    it('returns empty array when API fails', async () => {
      mockGet.mockReset()
      mockGet.mockRejectedValue(new Error('Network error'))
      const rows = await liveTicketsService.getTicketRows()
      expect(rows).toEqual([])
    })
  })
})
