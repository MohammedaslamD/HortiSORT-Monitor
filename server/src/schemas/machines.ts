import { z } from 'zod'

export const machineQuerySchema = z.object({
  status: z.enum(['running', 'idle', 'down', 'offline']).optional(),
  model: z.string().optional(),
  city: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().optional(),
  sort: z.string().optional(),
})

export const updateMachineStatusSchema = z.object({
  status: z.enum(['running', 'idle', 'down', 'offline']),
})
