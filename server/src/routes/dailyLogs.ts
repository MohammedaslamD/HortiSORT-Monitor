import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth.ts'
import { validate } from '../middleware/validate.ts'
import { dailyLogQuerySchema, createDailyLogSchema } from '../schemas/dailyLogs.ts'
import { getDailyLogs, createDailyLog } from '../services/dailyLogService.ts'

export const dailyLogsRouter = Router()

// GET /daily-logs
dailyLogsRouter.get('/', authenticate, validate(dailyLogQuerySchema, 'query'), async (req, res, next) => {
  try {
    const q = req.query as {
      machineId?: string
      date?: string
      status?: string
      limit?: string
      sort?: string
    }
    const authUser = { id: req.user!.userId, role: req.user!.role as 'customer' | 'engineer' | 'admin' }
    const logs = await getDailyLogs(
      {
        machineId: q.machineId ? Number(q.machineId) : undefined,
        date: q.date,
        status: q.status as Parameters<typeof getDailyLogs>[0]['status'],
        limit: q.limit ? Number(q.limit) : undefined,
        sort: q.sort,
      },
      authUser,
    )
    res.json({ data: logs })
  } catch (err) {
    next(err)
  }
})

// POST /daily-logs
dailyLogsRouter.post(
  '/',
  authenticate,
  requireRole('engineer', 'admin'),
  validate(createDailyLogSchema),
  async (req, res, next) => {
    try {
      const log = await createDailyLog(req.body, req.user!.userId)
      res.status(201).json({ data: log })
    } catch (err) {
      next(err)
    }
  },
)
