import { prisma } from '../utils/prisma.ts'
import { Prisma } from '@prisma/client'

interface UpsertSessionData {
  lot_number: string
  session_date: string
  start_time: string
  stop_time?: string | null
  fruit_type?: string | null
  quantity_kg?: number | null
  status: string
  raw_tdms_rows?: unknown
}

/**
 * Upsert a production session for a given machine.
 * Uses the composite unique key (machine_id, session_date, lot_number).
 */
export async function upsertSession(machine_id: number, data: UpsertSessionData) {
  const sessionDate = new Date(data.session_date)
  const where = {
    machine_id_session_date_lot_number: {
      machine_id,
      session_date: sessionDate,
      lot_number: data.lot_number,
    },
  }
  const payload = {
    machine_id,
    lot_number: data.lot_number,
    session_date: sessionDate,
    start_time: new Date(data.start_time),
    stop_time: data.stop_time ? new Date(data.stop_time) : null,
    fruit_type: data.fruit_type ?? null,
    quantity_kg: data.quantity_kg ?? null,
    status: data.status,
    raw_tdms_rows: (data.raw_tdms_rows ?? Prisma.JsonNull) as Prisma.InputJsonValue | typeof Prisma.JsonNull,
  }
  return prisma.productionSession.upsert({
    where,
    create: payload,
    update: {
      stop_time: payload.stop_time,
      fruit_type: payload.fruit_type,
      quantity_kg: payload.quantity_kg,
      status: payload.status,
      raw_tdms_rows: payload.raw_tdms_rows,
    },
  })
}

/**
 * Get all production sessions for a specific machine on a given date.
 */
export async function getTodaySessionsByMachineId(machine_id: number, date: string) {
  return prisma.productionSession.findMany({
    where: {
      machine_id,
      session_date: new Date(date),
    },
    orderBy: { lot_number: 'asc' },
  })
}

/**
 * Count machines currently running (status='running') on a given date.
 */
export async function getRunningMachineCount(date: string): Promise<number> {
  return prisma.productionSession.count({
    where: {
      status: 'running',
      session_date: new Date(date),
    },
  })
}

/**
 * Get all production sessions with optional filters (for the /production page).
 */
export async function getSessions(filters: {
  machine_id?: number
  date?: string
  status?: string
  limit?: number
}) {
  return prisma.productionSession.findMany({
    where: {
      ...(filters.machine_id ? { machine_id: filters.machine_id } : {}),
      ...(filters.date ? { session_date: new Date(filters.date) } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    },
    orderBy: [{ session_date: 'desc' }, { lot_number: 'asc' }],
    ...(filters.limit ? { take: filters.limit } : {}),
    include: { machine: { select: { machine_code: true, machine_name: true } } },
  })
}
