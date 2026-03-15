import { z } from 'zod'

export const toggleActiveSchema = z.object({
  is_active: z.boolean(),
})
