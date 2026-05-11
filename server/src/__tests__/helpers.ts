import { PrismaClient } from '@prisma/client'

// Pass datasourceUrl explicitly so the Prisma query engine uses the value
// injected into process.env by vitest.config.ts `env` block (hortisort_test),
// rather than reading .env from disk on its own (which would give hortisort_dev).
export const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
})

/**
 * Truncates all tables in FK-safe order. Call in beforeEach to isolate tests.
 */
export async function truncateAll(): Promise<void> {
  const tables = [
    'activity_log',
    'machine_history',
    'site_visits',
    'ticket_comments',
    'tickets',
    'daily_logs',
    'machines',
    'users',
  ]
  for (const t of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${t} RESTART IDENTITY CASCADE`)
  }
}
