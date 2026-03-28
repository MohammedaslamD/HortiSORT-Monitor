import { z } from 'zod'

export const ticketQuerySchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed', 'reopened']).optional(),
  severity: z
    .enum(['P1_critical', 'P2_high', 'P3_medium', 'P4_low'])
    .optional(),
  category: z
    .enum(['hardware', 'software', 'sensor', 'electrical', 'other'])
    .optional(),
  machineId: z.coerce.number().int().positive().optional(),
  assignedTo: z.coerce.number().int().positive().optional(),
  raisedBy: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  sort: z.string().optional(),
})

export const createTicketSchema = z.object({
  machine_id: z.number().int().positive(),
  assigned_to: z.number().int().positive().optional(), // now optional; backend auto-assigns from machine.engineer_id
  severity: z.enum(['P1_critical', 'P2_high', 'P3_medium', 'P4_low']),
  category: z.enum(['hardware', 'software', 'sensor', 'electrical', 'other']),
  title: z.string().min(1),
  description: z.string().min(1),
})

export const updateTicketStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed', 'reopened']),
})

export const resolveTicketSchema = z.object({
  root_cause: z.string().min(1),
  solution: z.string().min(1),
  parts_used: z.string().optional(),
})

export const createCommentSchema = z.object({
  message: z.string().min(1),
  attachment_url: z.string().url().nullable().optional(),
})
