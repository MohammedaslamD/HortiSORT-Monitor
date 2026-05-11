import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth.ts'
import { validate } from '../middleware/validate.ts'
import { siteVisitQuerySchema, createSiteVisitSchema } from '../schemas/siteVisits.ts'
import { getSiteVisits, createSiteVisit } from '../services/siteVisitService.ts'

export const siteVisitsRouter = Router()

// GET /site-visits
siteVisitsRouter.get(
  '/',
  authenticate,
  validate(siteVisitQuerySchema, 'query'),
  async (req, res, next) => {
    try {
      const q = req.query as Record<string, string | undefined>
      const authUser = {
        id: req.user!.userId,
        role: req.user!.role as 'customer' | 'engineer' | 'admin',
      }
      const visits = await getSiteVisits(
        {
          engineerId: q.engineerId ? Number(q.engineerId) : undefined,
          machineId: q.machineId ? Number(q.machineId) : undefined,
          purpose: q.purpose as Parameters<typeof getSiteVisits>[0]['purpose'],
          limit: q.limit ? Number(q.limit) : undefined,
          sort: q.sort,
        },
        authUser,
      )
      res.json({ data: visits })
    } catch (err) {
      next(err)
    }
  },
)

// POST /site-visits
siteVisitsRouter.post(
  '/',
  authenticate,
  requireRole('engineer', 'admin'),
  validate(createSiteVisitSchema),
  async (req, res, next) => {
    try {
      const visit = await createSiteVisit(req.body, req.user!.userId)
      res.status(201).json({ data: visit })
    } catch (err) {
      next(err)
    }
  },
)
