import { z } from 'zod'

export const siteVisitQuerySchema = z.object({
  engineerId: z.coerce.number().int().positive().optional(),
  machineId: z.coerce.number().int().positive().optional(),
  purpose: z
    .enum(['routine', 'ticket', 'installation', 'training'])
    .optional(),
  limit: z.coerce.number().int().positive().optional(),
  sort: z.string().optional(),
})

export const createSiteVisitSchema = z.object({
  machine_id: z.number().int().positive(),
  engineer_id: z.number().int().positive(),
  visit_date: z.string().min(1),
  visit_purpose: z.enum(['routine', 'ticket', 'installation', 'training']),
  ticket_id: z.number().int().positive().optional(),
  findings: z.string().min(1),
  actions_taken: z.string().min(1),
  parts_replaced: z.string().optional(),
  next_visit_due: z.string().optional(),
})
