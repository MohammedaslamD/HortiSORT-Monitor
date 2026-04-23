import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth.ts'
import { machineAuthenticate } from '../middleware/machineAuth.ts'
import { validate } from '../middleware/validate.ts'
import { upsertSessionSchema, sessionQuerySchema } from '../schemas/productionSessions.ts'
import {
  upsertSession,
  getTodaySessionsByMachineId,
  getSessions,
} from '../services/productionSessionService.ts'

export const productionSessionsRouter = Router()

// POST /production-sessions — called by the watcher script
// Authenticated by X-Machine-Key header
productionSessionsRouter.post(
  '/',
  machineAuthenticate,
  validate(upsertSessionSchema),
  async (req, res, next) => {
    try {
      const session = await upsertSession(req.machine_id!, req.body)
      res.status(201).json({ data: session })
    } catch (err) {
      next(err)
    }
  },
)

// GET /production-sessions/today?machine_id=&date=
// Browser clients — require JWT
productionSessionsRouter.get(
  '/today',
  authenticate,
  async (req, res, next) => {
    try {
      const machineId = Number(req.query.machine_id)
      const date = (req.query.date as string) ?? new Date().toISOString().slice(0, 10)
      if (!machineId) {
        res.status(400).json({ error: 'machine_id is required' })
        return
      }
      const sessions = await getTodaySessionsByMachineId(machineId, date)
      res.json({ data: sessions })
    } catch (err) {
      next(err)
    }
  },
)

// GET /production-sessions — admin/engineer only, with filters
productionSessionsRouter.get(
  '/',
  authenticate,
  requireRole('engineer', 'admin'),
  validate(sessionQuerySchema, 'query'),
  async (req, res, next) => {
    try {
      const q = req.query as { machine_id?: string; date?: string; status?: string; limit?: string }
      const sessions = await getSessions({
        machine_id: q.machine_id ? Number(q.machine_id) : undefined,
        date: q.date,
        status: q.status,
        limit: q.limit ? Number(q.limit) : undefined,
      })
      res.json({ data: sessions })
    } catch (err) {
      next(err)
    }
  },
)
