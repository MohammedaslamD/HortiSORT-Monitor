import { prisma } from '../utils/prisma.ts'

interface CreateErrorData {
  occurred_at: string
  error_code?: string | null
  message?: string | null
  raw_line?: string | null
}

/**
 * Store a machine error event.
 */
export async function createError(machine_id: number, data: CreateErrorData) {
  return prisma.machineError.create({
    data: {
      machine_id,
      occurred_at: new Date(data.occurred_at),
      error_code: data.error_code ?? null,
      message: data.message ?? null,
      raw_line: data.raw_line ?? null,
    },
  })
}

/**
 * Get errors for a specific machine on a given date (UTC day boundaries).
 */
export async function getTodayErrors(machine_id: number, date: string) {
  const start = new Date(`${date}T00:00:00Z`)
  const end = new Date(`${date}T23:59:59.999Z`)
  return prisma.machineError.findMany({
    where: {
      machine_id,
      occurred_at: { gte: start, lte: end },
    },
    orderBy: { occurred_at: 'asc' },
    take: 100,
  })
}
