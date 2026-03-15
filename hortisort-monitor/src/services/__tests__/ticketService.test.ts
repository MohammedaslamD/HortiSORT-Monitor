import { describe, it, expect } from 'vitest'
import { getTickets, getTicketsByMachineId, getOpenTicketCount, getRecentTickets } from '../ticketService'

describe('ticketService', () => {
  // --- getTickets ---

  describe('getTickets', () => {
    it('should return all 10 tickets', async () => {
      const tickets = await getTickets()
      expect(tickets).toHaveLength(10)
    })
  })

  // --- getTicketsByMachineId ---

  describe('getTicketsByMachineId', () => {
    it('should return 1 ticket for machine 3', async () => {
      const tickets = await getTicketsByMachineId(3)
      expect(tickets).toHaveLength(1)
      expect(tickets[0].ticket_number).toBe('TKT-00001')
    })

    it('should return empty array for machine with no tickets', async () => {
      const tickets = await getTicketsByMachineId(999)
      expect(tickets).toHaveLength(0)
    })
  })

  // --- getOpenTicketCount ---

  describe('getOpenTicketCount', () => {
    it('should return 6 (open + in_progress + reopened)', async () => {
      const count = await getOpenTicketCount()
      // open: 1,5,9 = 3; in_progress: 2,7 = 2; reopened: 10 = 1 → total 6
      expect(count).toBe(6)
    })
  })

  // --- getRecentTickets ---

  describe('getRecentTickets', () => {
    it('should return tickets sorted by created_at desc, limited to N', async () => {
      const tickets = await getRecentTickets(3)
      expect(tickets).toHaveLength(3)
      // Verify sorted descending
      for (let i = 0; i < tickets.length - 1; i++) {
        expect(tickets[i].created_at >= tickets[i + 1].created_at).toBe(true)
      }
    })

    it('should return all tickets when limit exceeds total', async () => {
      const tickets = await getRecentTickets(100)
      expect(tickets).toHaveLength(10)
      for (let i = 0; i < tickets.length - 1; i++) {
        expect(tickets[i].created_at >= tickets[i + 1].created_at).toBe(true)
      }
    })
  })
})
