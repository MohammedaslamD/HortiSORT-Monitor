import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()

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
