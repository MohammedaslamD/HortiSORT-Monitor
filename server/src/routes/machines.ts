import { Router } from 'express'
import { authenticate } from '../middleware/auth.ts'
import { requireRole } from '../middleware/auth.ts'
import { validate } from '../middleware/validate.ts'
import { machineQuerySchema, updateMachineStatusSchema } from '../schemas/machines.ts'
import {
  getMachines,
  getMachineById,
  getMachineStats,
  updateMachineStatus,
} from '../services/machineService.ts'

export const machinesRouter = Router()

// GET /machines/stats  — must be registered BEFORE /:id
machinesRouter.get('/stats', authenticate, async (req, res, next) => {
  try {
    const authUser = { id: req.user!.userId, role: req.user!.role as 'customer' | 'engineer' | 'admin' }
    const stats = await getMachineStats(authUser)
    res.json({ data: stats })
  } catch (err) {
    next(err)
  }
})

// GET /machines
machinesRouter.get('/', authenticate, validate(machineQuerySchema, 'query'), async (req, res, next) => {
  try {
    const filters = req.query as {
      status?: string
      model?: string
      city?: string
      search?: string
      limit?: string
    }
    const authUser = { id: req.user!.userId, role: req.user!.role as 'customer' | 'engineer' | 'admin' }
    const machines = await getMachines(
      {
        status: filters.status as Parameters<typeof getMachines>[0]['status'],
        model: filters.model,
        city: filters.city,
        search: filters.search,
        limit: filters.limit ? Number(filters.limit) : undefined,
      },
      authUser,
    )
    res.json({ data: machines })
  } catch (err) {
    next(err)
  }
})

// GET /machines/:id
machinesRouter.get('/:id', authenticate, async (req, res, next) => {
  try {
    const machine = await getMachineById(Number(req.params.id))
    res.json({ data: machine })
  } catch (err) {
    next(err)
  }
})

// PATCH /machines/:id/status
machinesRouter.patch(
  '/:id/status',
  authenticate,
  requireRole('engineer', 'admin'),
  validate(updateMachineStatusSchema),
  async (req, res, next) => {
    try {
      const machine = await updateMachineStatus(
        Number(req.params.id),
        req.body.status,
        req.user!.userId,
      )
      res.json({ data: machine })
    } catch (err) {
      next(err)
    }
  },
)
