import { z } from 'zod'

export const createMachineErrorSchema = z.object({
  occurred_at: z.string().datetime({ offset: true }),
  error_code: z.string().max(100).optional().nullable(),
  message: z.string().optional().nullable(),
  raw_line: z.string().optional().nullable(),
})

export const machineErrorQuerySchema = z.object({
  machine_id: z.coerce.number().int().positive().optional(),
  date: z.string().optional(),
  limit: z.coerce.number().int().positive().optional(),
})
