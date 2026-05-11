import { z } from 'zod'

export const toggleActiveSchema = z.object({
  is_active: z.boolean(),
})

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Phone is required'),
  whatsapp_number: z.string().optional(),
  role: z.enum(['customer', 'engineer', 'admin']),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  whatsapp_number: z.string().optional(),
  role: z.enum(['customer', 'engineer', 'admin']),
})

export const assignMachinesSchema = z.object({
  machine_ids: z.array(z.number().int().positive()),
})
