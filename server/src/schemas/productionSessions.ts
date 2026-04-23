import { z } from 'zod'

export const upsertSessionSchema = z.object({
  lot_number: z.number().int().positive(),
  session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'session_date must be YYYY-MM-DD'),
  start_time: z.string().datetime({ offset: true }),
  stop_time: z.string().datetime({ offset: true }).optional().nullable(),
  fruit_type: z.string().max(100).optional().nullable(),
  quantity_kg: z.number().nonnegative().optional().nullable(),
  status: z.enum(['running', 'completed', 'error']),
  raw_tdms_rows: z.unknown().optional().nullable(),
})

export const sessionQuerySchema = z.object({
  machine_id: z.coerce.number().int().positive().optional(),
  date: z.string().optional(),
  status: z.enum(['running', 'completed', 'error']).optional(),
  limit: z.coerce.number().int().positive().optional(),
})
