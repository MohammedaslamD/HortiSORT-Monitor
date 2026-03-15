import { z } from 'zod'

export const dailyLogQuerySchema = z.object({
  machineId: z.coerce.number().int().positive().optional(),
  date: z.string().optional(),
  status: z.enum(['running', 'not_running', 'maintenance']).optional(),
  limit: z.coerce.number().int().positive().optional(),
  sort: z.string().optional(),
})

export const createDailyLogSchema = z.object({
  machine_id: z.number().int().positive(),
  date: z.string(),
  status: z.enum(['running', 'not_running', 'maintenance']),
  fruit_type: z.string().min(1),
  tons_processed: z.number().nonnegative(),
  shift_start: z.string().min(1),
  shift_end: z.string().min(1),
  notes: z.string(),
})
