import { z } from 'zod'

// NOTE: dotenv is intentionally NOT imported here.
// The entry point (src/index.ts) loads .env before importing this module.
// In tests, vitest's envFile + setupFiles load .env.test instead.

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(8),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

export const env = envSchema.parse(process.env)
