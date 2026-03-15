import type { DailyLog, DailyLogStatus, DailyLogFilters } from '../types'
import { MOCK_DAILY_LOGS } from '../data/mockData'

/** Returns all daily logs. */
export async function getDailyLogs(): Promise<DailyLog[]> {
  return MOCK_DAILY_LOGS
}

/** Returns daily logs for a specific machine. */
export async function getDailyLogsByMachineId(machineId: number): Promise<DailyLog[]> {
  return MOCK_DAILY_LOGS.filter((log) => log.machine_id === machineId)
}

/** Returns the most recent daily logs, sorted by date descending. */
export async function getRecentDailyLogs(limit: number): Promise<DailyLog[]> {
  return [...MOCK_DAILY_LOGS]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)
}

export interface NewDailyLogInput {
  machine_id: number
  date: string
  status: DailyLogStatus
  fruit_type: string
  tons_processed: number
  shift_start: string
  shift_end: string
  notes: string
  updated_by: number
}

/**
 * Appends a new daily log entry to the in-memory mock array.
 * Used by UpdateStatusPage without a real backend.
 */
export async function addDailyLog(input: NewDailyLogInput): Promise<DailyLog> {
  const now = new Date().toISOString()
  const newLog: DailyLog = {
    id: MOCK_DAILY_LOGS.length + 1,
    ...input,
    created_at: now,
    updated_at: now,
  }
  MOCK_DAILY_LOGS.push(newLog)
  return newLog
}

/** Returns all daily logs, optionally filtered. Sorted by date descending. */
export async function getAllDailyLogs(filters?: DailyLogFilters): Promise<DailyLog[]> {
  let result = [...MOCK_DAILY_LOGS]

  if (filters?.machineId) {
    result = result.filter((l) => l.machine_id === filters.machineId)
  }

  if (filters?.date) {
    result = result.filter((l) => l.date === filters.date)
  }

  if (filters?.status) {
    result = result.filter((l) => l.status === filters.status)
  }

  return result.sort((a, b) => b.date.localeCompare(a.date))
}
