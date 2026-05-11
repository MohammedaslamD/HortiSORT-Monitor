import { Router } from 'express'
import { authenticate } from '../middleware/auth.ts'
import { requireRole } from '../middleware/auth.ts'
import { machineAuthenticate } from '../middleware/machineAuth.ts'
import { validate } from '../middleware/validate.ts'
import { machineQuerySchema, updateMachineStatusSchema } from '../schemas/machines.ts'
import {
  getMachines,
  getMachineById,
  getMachineStats,
  updateMachineStatus,
} from '../services/machineService.ts'
import { broadcastMachineStatus } from '../socket/productionSocket.ts'
import { prisma } from '../utils/prisma.ts'

// System user ID used when watcher (machine key) updates status programmatically
const SYSTEM_USER_ID = 5

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

// PATCH /machines/:id/status  (JWT — engineer/admin)
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

// PATCH /machines/:id/heartbeat  (X-Machine-Key — watcher reports online/idle/offline)
machinesRouter.patch(
  '/:id/heartbeat',
  machineAuthenticate,
  validate(updateMachineStatusSchema),
  async (req, res, next) => {
    try {
      // Only allow the watcher to update its own machine
      if (req.machine_id !== Number(req.params.id)) {
        res.status(403).json({ error: 'API key does not match machine id' })
        return
      }
      const machine = await updateMachineStatus(
        req.machine_id,
        req.body.status,
        SYSTEM_USER_ID,
      )
      // Stamp last_heartbeat_at so the stale-job knows the watcher is alive
      await prisma.machine.update({
        where: { id: req.machine_id },
        data: { last_heartbeat_at: new Date() },
      })
      broadcastMachineStatus(req.machine_id, { machine_id: req.machine_id, status: machine.status })
      res.json({ data: machine })
    } catch (err) {
      next(err)
    }
  },
)
