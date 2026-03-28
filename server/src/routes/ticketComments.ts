import { Router } from 'express'
import { authenticate } from '../middleware/auth.ts'
import { validate } from '../middleware/validate.ts'
import { createCommentSchema } from '../schemas/tickets.ts'
import { addComment, getTicketById } from '../services/ticketService.ts'

export const ticketCommentsRouter = Router({ mergeParams: true })

// GET /tickets/:id/comments
ticketCommentsRouter.get(
  '/',
  authenticate,
  async (req, res, next) => {
    try {
      const ticket = await getTicketById(Number(req.params.id))
      res.json({ data: ticket.comments })
    } catch (err) {
      next(err)
    }
  },
)

// POST /tickets/:id/comments
ticketCommentsRouter.post(
  '/',
  authenticate,
  validate(createCommentSchema),
  async (req, res, next) => {
    try {
      const comment = await addComment(
        Number(req.params.id),
        req.user!.userId,
        req.body,
      )
      res.status(201).json({ data: comment })
    } catch (err) {
      next(err)
    }
  },
)
