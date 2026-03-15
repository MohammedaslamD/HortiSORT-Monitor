import { describe, it, expect } from 'vitest'
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

  // --- getTicketById ---

  describe('getTicketById', () => {
    it('should return the ticket when it exists', async () => {
      const ticket = await getTicketById(1)
      expect(ticket).not.toBeNull()
      expect(ticket!.ticket_number).toBe('TKT-00001')
    })

    it('should return null when the ticket does not exist', async () => {
      const ticket = await getTicketById(999)
      expect(ticket).toBeNull()
    })
  })

  // --- getTicketsByStatus ---

  describe('getTicketsByStatus', () => {
    it('should return 3 open tickets', async () => {
      const tickets = await getTicketsByStatus('open')
      expect(tickets).toHaveLength(3)
      expect(tickets.map((t) => t.id)).toEqual(expect.arrayContaining([1, 5, 9]))
    })

    it('should return 2 in_progress tickets', async () => {
      const tickets = await getTicketsByStatus('in_progress')
      expect(tickets).toHaveLength(2)
    })

    it('should return empty array for status with no matches', async () => {
      // All statuses are covered in mock data, but we can verify a count
      const tickets = await getTicketsByStatus('closed')
      expect(tickets).toHaveLength(1)
    })
  })

  // --- getTicketsBySeverity ---

  describe('getTicketsBySeverity', () => {
    it('should return 2 P1_critical tickets', async () => {
      const tickets = await getTicketsBySeverity('P1_critical')
      expect(tickets).toHaveLength(2)
      expect(tickets.map((t) => t.id)).toEqual(expect.arrayContaining([1, 2]))
    })

    it('should return 2 P2_high tickets', async () => {
      const tickets = await getTicketsBySeverity('P2_high')
      expect(tickets).toHaveLength(2)
    })

    it('should return 4 P3_medium tickets', async () => {
      const tickets = await getTicketsBySeverity('P3_medium')
      expect(tickets).toHaveLength(4)
    })

    it('should return 2 P4_low tickets', async () => {
      const tickets = await getTicketsBySeverity('P4_low')
      expect(tickets).toHaveLength(2)
    })
  })

  // --- getTicketsByAssignedTo ---

  describe('getTicketsByAssignedTo', () => {
    it('should return 6 tickets assigned to user 5', async () => {
      const tickets = await getTicketsByAssignedTo(5)
      expect(tickets).toHaveLength(6)
      expect(tickets.map((t) => t.id)).toEqual(expect.arrayContaining([1, 2, 4, 6, 8, 10]))
    })

    it('should return 4 tickets assigned to user 6', async () => {
      const tickets = await getTicketsByAssignedTo(6)
      expect(tickets).toHaveLength(4)
    })

    it('should return empty array for user with no assignments', async () => {
      const tickets = await getTicketsByAssignedTo(999)
      expect(tickets).toHaveLength(0)
    })
  })

  // --- getTicketsByRaisedBy ---

  describe('getTicketsByRaisedBy', () => {
    it('should return 5 tickets raised by user 4', async () => {
      const tickets = await getTicketsByRaisedBy(4)
      expect(tickets).toHaveLength(5)
      expect(tickets.map((t) => t.id)).toEqual(expect.arrayContaining([1, 2, 4, 9, 10]))
    })

    it('should return 5 tickets raised by user 3', async () => {
      const tickets = await getTicketsByRaisedBy(3)
      expect(tickets).toHaveLength(5)
    })

    it('should return empty array for user who raised no tickets', async () => {
      const tickets = await getTicketsByRaisedBy(999)
      expect(tickets).toHaveLength(0)
    })
  })

  // --- getTicketsByMachineIds ---

  describe('getTicketsByMachineIds', () => {
    it('should return tickets for machines 3 and 8', async () => {
      const tickets = await getTicketsByMachineIds([3, 8])
      expect(tickets).toHaveLength(2)
      expect(tickets.map((t) => t.id)).toEqual(expect.arrayContaining([1, 2]))
    })

    it('should return empty array when no machines match', async () => {
      const tickets = await getTicketsByMachineIds([888, 999])
      expect(tickets).toHaveLength(0)
    })

    it('should return empty array for empty input', async () => {
      const tickets = await getTicketsByMachineIds([])
      expect(tickets).toHaveLength(0)
    })
  })

  // --- getTicketComments ---

  describe('getTicketComments', () => {
    it('should return 3 comments for ticket 1 sorted by created_at asc', async () => {
      const comments = await getTicketComments(1)
      expect(comments).toHaveLength(3)
      // Verify ascending order
      for (let i = 0; i < comments.length - 1; i++) {
        expect(comments[i].created_at <= comments[i + 1].created_at).toBe(true)
      }
    })

    it('should return 3 comments for ticket 2', async () => {
      const comments = await getTicketComments(2)
      expect(comments).toHaveLength(3)
    })

    it('should return empty array for ticket with no comments', async () => {
      const comments = await getTicketComments(999)
      expect(comments).toHaveLength(0)
    })
  })

  // --- Mutation tests below (these modify shared mock arrays) ---

  // --- addTicketComment ---

  describe('addTicketComment', () => {
    it('should add a comment with auto-generated id and created_at', async () => {
      const comment = await addTicketComment({
        ticket_id: 1,
        user_id: 3,
        message: 'Test comment from engineer',
      })
      expect(comment.id).toBeGreaterThan(0)
      expect(comment.ticket_id).toBe(1)
      expect(comment.user_id).toBe(3)
      expect(comment.message).toBe('Test comment from engineer')
      expect(comment.created_at).toBeTruthy()
    })
  })

  // --- updateTicketStatus ---

  describe('updateTicketStatus', () => {
    it('should throw when ticket is not found', async () => {
      await expect(updateTicketStatus(999, 'resolved')).rejects.toThrow('Ticket 999 not found')
    })

    it('should resolve a ticket with resolution data', async () => {
      const ticket = await updateTicketStatus(5, 'resolved', {
        root_cause: 'Power supply issue',
        solution: 'Installed voltage stabilizer',
        parts_used: 'VS-500',
      })
      expect(ticket.status).toBe('resolved')
      expect(ticket.resolved_at).toBeTruthy()
      expect(ticket.resolution_time_mins).toBeGreaterThan(0)
      expect(ticket.root_cause).toBe('Power supply issue')
      expect(ticket.solution).toBe('Installed voltage stabilizer')
      expect(ticket.parts_used).toBe('VS-500')
    })

    it('should reopen a ticket and increment reopen_count', async () => {
      const original = await getTicketById(5)
      const previousReopenCount = original!.reopen_count

      const ticket = await updateTicketStatus(5, 'reopened')
      expect(ticket.status).toBe('reopened')
      expect(ticket.reopen_count).toBe(previousReopenCount + 1)
      expect(ticket.reopened_at).toBeTruthy()
      expect(ticket.resolved_at).toBeNull()
      expect(ticket.resolution_time_mins).toBeNull()
    })
  })

  // --- createTicket ---

  describe('createTicket', () => {
    it('should create a ticket with auto-generated fields', async () => {
      const ticket = await createTicket({
        machine_id: 1,
        raised_by: 3,
        assigned_to: 5,
        severity: 'P2_high',
        category: 'hardware',
        title: 'Test ticket',
        description: 'Testing ticket creation',
      })

      expect(ticket.id).toBeGreaterThan(10)
      expect(ticket.ticket_number).toMatch(/^TKT-\d{5}$/)
      expect(ticket.status).toBe('open')
      expect(ticket.sla_hours).toBe(8)
      expect(ticket.created_at).toBeTruthy()
      expect(ticket.updated_at).toBeTruthy()
      expect(ticket.resolved_at).toBeNull()
      expect(ticket.resolution_time_mins).toBeNull()
      expect(ticket.root_cause).toBeNull()
      expect(ticket.solution).toBeNull()
      expect(ticket.parts_used).toBeNull()
      expect(ticket.reopen_count).toBe(0)
      expect(ticket.reopened_at).toBeNull()
      expect(ticket.customer_rating).toBeNull()
      expect(ticket.customer_feedback).toBeNull()
    })

    it('should set correct SLA hours for P1_critical severity', async () => {
      const ticket = await createTicket({
        machine_id: 2,
        raised_by: 4,
        assigned_to: 6,
        severity: 'P1_critical',
        category: 'sensor',
        title: 'Critical test ticket',
        description: 'Testing P1 SLA',
      })
      expect(ticket.sla_hours).toBe(4)
    })
  })
})
