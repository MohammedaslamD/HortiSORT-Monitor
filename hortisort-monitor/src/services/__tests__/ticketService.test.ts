import { describe, it, expect } from 'vitest'
import { getTickets } from '../ticketService'

describe('ticketService', () => {
  // --- getTickets ---

  it('should return all 10 tickets', async () => {
    const tickets = await getTickets()

    expect(tickets).toHaveLength(10)
  })
})
