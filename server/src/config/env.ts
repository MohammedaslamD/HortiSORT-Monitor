import { z } from 'zod'
import 'dotenv/config'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(8),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

export const env = envSchema.parse(process.env)
