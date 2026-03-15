import type { DailyLog } from '../types'
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
