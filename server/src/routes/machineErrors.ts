import { Router } from 'express'
import { authenticate } from '../middleware/auth.ts'
import { machineAuthenticate } from '../middleware/machineAuth.ts'
import { validate } from '../middleware/validate.ts'
import { createMachineErrorSchema, machineErrorQuerySchema } from '../schemas/machineErrors.ts'
import { createError, getTodayErrors } from '../services/machineErrorService.ts'

export const machineErrorsRouter = Router()

// POST /machine-errors — called by the watcher script
machineErrorsRouter.post(
  '/',
  machineAuthenticate,
  validate(createMachineErrorSchema),
  async (req, res, next) => {
    try {
      const error = await createError(req.machine_id!, req.body)
      res.status(201).json({ data: error })
    } catch (err) {
      next(err)
    }
  },
)

// GET /machine-errors/today?machine_id=&date=
machineErrorsRouter.get(
  '/today',
  authenticate,
  validate(machineErrorQuerySchema, 'query'),
  async (req, res, next) => {
    try {
      const machineId = Number(req.query.machine_id)
      const date = (req.query.date as string) ?? new Date().toISOString().slice(0, 10)
      if (!machineId) {
        res.status(400).json({ error: 'machine_id is required' })
        return
      }
      const errors = await getTodayErrors(machineId, date)
      res.json({ data: errors })
    } catch (err) {
      next(err)
    }
  },
)
