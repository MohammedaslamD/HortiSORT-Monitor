import { prisma } from '../utils/prisma.ts'
import type { DailyLogStatus } from '@prisma/client'

interface AuthUser {
  id: number
  role: 'customer' | 'engineer' | 'admin'
}

interface DailyLogFilters {
  machineId?: number
  date?: string
  status?: DailyLogStatus
  limit?: number
  sort?: string
}

interface CreateDailyLogData {
  machine_id: number
  date: string
  status: DailyLogStatus
  fruit_type: string
  tons_processed: number
  shift_start: string
  shift_end: string
  notes: string
}

/**
 * Return daily logs role-scoped to the requesting user, with optional filters.
 * Sorted by date descending by default.
 */
export async function getDailyLogs(filters: DailyLogFilters, user: AuthUser) {
  const roleMachineWhere =
    user.role === 'customer'
      ? { machine: { customer_id: user.id } }
      : user.role === 'engineer'
        ? { machine: { engineer_id: user.id } }
        : {}

  return prisma.dailyLog.findMany({
    where: {
      ...roleMachineWhere,
      ...(filters.machineId ? { machine_id: filters.machineId } : {}),
      ...(filters.date ? { date: new Date(filters.date) } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    },
    orderBy: { date: 'desc' },
    ...(filters.limit ? { take: filters.limit } : {}),
  })
}

/**
 * Create a new daily log entry, recording who submitted it.
 */
export async function createDailyLog(data: CreateDailyLogData, userId: number) {
  return prisma.dailyLog.create({
    data: {
      machine_id: data.machine_id,
      date: new Date(data.date),
      status: data.status,
      fruit_type: data.fruit_type,
      tons_processed: data.tons_processed,
      shift_start: data.shift_start,
      shift_end: data.shift_end,
      notes: data.notes,
      updated_by: userId,
    },
  })
}
