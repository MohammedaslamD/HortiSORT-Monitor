import { Router } from 'express'
import { authenticate } from '../middleware/auth.ts'
import { requireRole } from '../middleware/auth.ts'
import { validate } from '../middleware/validate.ts'
import {
  ticketQuerySchema,
  createTicketSchema,
  updateTicketStatusSchema,
  resolveTicketSchema,
} from '../schemas/tickets.ts'
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicketStatus,
  resolveTicket,
  getTicketStats,
} from '../services/ticketService.ts'

export const ticketsRouter = Router()

// GET /tickets/stats — must be registered BEFORE /:id
ticketsRouter.get('/stats', authenticate, async (req, res, next) => {
  try {
    const authUser = { id: req.user!.userId, role: req.user!.role as 'customer' | 'engineer' | 'admin' }
    const stats = await getTicketStats(authUser)
    res.json({ data: stats })
  } catch (err) {
    next(err)
  }
})

// GET /tickets
ticketsRouter.get('/', authenticate, validate(ticketQuerySchema, 'query'), async (req, res, next) => {
  try {
    const q = req.query as Record<string, string | undefined>
    const authUser = { id: req.user!.userId, role: req.user!.role as 'customer' | 'engineer' | 'admin' }
    const tickets = await getTickets(
      {
        status: q.status as Parameters<typeof getTickets>[0]['status'],
        severity: q.severity as Parameters<typeof getTickets>[0]['severity'],
        category: q.category as Parameters<typeof getTickets>[0]['category'],
        machineId: q.machineId ? Number(q.machineId) : undefined,
        assignedTo: q.assignedTo ? Number(q.assignedTo) : undefined,
        raisedBy: q.raisedBy ? Number(q.raisedBy) : undefined,
        limit: q.limit ? Number(q.limit) : undefined,
        sort: q.sort,
      },
      authUser,
    )
    res.json({ data: tickets })
  } catch (err) {
    next(err)
  }
})

// GET /tickets/:id
ticketsRouter.get('/:id', authenticate, async (req, res, next) => {
  try {
    const ticket = await getTicketById(Number(req.params.id))
    res.json({ data: ticket })
  } catch (err) {
    next(err)
  }
})

// POST /tickets
ticketsRouter.post('/', authenticate, validate(createTicketSchema), async (req, res, next) => {
  try {
    const ticket = await createTicket(req.body, req.user!.userId)
    res.status(201).json({ data: ticket })
  } catch (err) {
    next(err)
  }
})

// PATCH /tickets/:id/status
ticketsRouter.patch(
  '/:id/status',
  authenticate,
  requireRole('engineer', 'admin'),
  validate(updateTicketStatusSchema),
  async (req, res, next) => {
    try {
      const ticket = await updateTicketStatus(Number(req.params.id), req.body.status)
      res.json({ data: ticket })
    } catch (err) {
      next(err)
    }
  },
)

// PATCH /tickets/:id/resolve
ticketsRouter.patch(
  '/:id/resolve',
  authenticate,
  requireRole('engineer', 'admin'),
  validate(resolveTicketSchema),
  async (req, res, next) => {
    try {
      const ticket = await resolveTicket(Number(req.params.id), req.body)
      res.json({ data: ticket })
    } catch (err) {
      next(err)
    }
  },
)
