import { Router } from 'express'
import { authenticate } from '../middleware/auth.ts'
import { getHistoryByMachineId } from '../services/machineHistoryService.ts'

export const machineHistoryRouter = Router()

// GET /machine-history/:machineId
machineHistoryRouter.get('/:machineId', authenticate, async (req, res, next) => {
  try {
    const history = await getHistoryByMachineId(Number(req.params.machineId))
    res.json({ data: history })
  } catch (err) {
    next(err)
  }
})
