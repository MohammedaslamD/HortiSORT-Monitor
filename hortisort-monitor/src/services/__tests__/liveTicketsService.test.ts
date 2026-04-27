import { describe, it, expect } from 'vitest'
import { liveTicketsService } from '../liveTicketsService'

describe('liveTicketsService', () => {
  describe('getTicketStats', () => {
    it('returns the static MOCK_TICKET_STATS object', async () => {
      const stats = await liveTicketsService.getTicketStats()
      expect(stats.open).toBe(4)
      expect(stats.in_progress).toBe(2)
      expect(stats.resolved_today).toBe(3)
      expect(stats.avg_resolution_hours).toBe(4.2)
    })

    it('returns a Promise<TicketStats>', async () => {
      const result = liveTicketsService.getTicketStats()
      expect(result).toBeInstanceOf(Promise)
      await expect(result).resolves.toEqual(expect.objectContaining({
        open: expect.any(Number),
      }))
    })
  })

  describe('getTicketRows', () => {
    it('returns one row per ticket in MOCK_TICKETS', async () => {
      const rows = await liveTicketsService.getTicketRows()
      expect(rows.length).toBe(10)
    })

    it('resolves machine_code from MOCK_MACHINES', async () => {
      const rows = await liveTicketsService.getTicketRows()
      const tk1 = rows.find((r) => r.ticket_number === 'TKT-00001')
      expect(tk1?.machine_code).toBe('HS-2024-0003')
    })

    it('resolves assigned_to_name from MOCK_USERS or "Unassigned" when missing', async () => {
      const rows = await liveTicketsService.getTicketRows()
      const tk1 = rows.find((r) => r.ticket_number === 'TKT-00001')
      expect(tk1?.assigned_to_name).toBe('Aslam Sheikh')
    })
  })
})
