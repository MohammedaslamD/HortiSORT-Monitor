import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth.ts'
import { getRecentActivity } from '../services/activityLogService.ts'

export const activityLogRouter = Router()

// GET /activity-log
activityLogRouter.get('/', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 20
    const entries = await getRecentActivity(limit)
    res.json({ data: entries })
  } catch (err) {
    next(err)
  }
})
