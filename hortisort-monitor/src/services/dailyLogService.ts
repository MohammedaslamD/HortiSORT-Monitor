import { apiClient } from './apiClient'
import { MOCK_DAILY_LOGS } from '../data/mockData'
import type { DailyLog, DailyLogFilters, DailyLogStatus } from '../types'

/** Returns all daily logs, optionally filtered. */
export async function getDailyLogs(filters?: DailyLogFilters): Promise<DailyLog[]> {
  const params = new URLSearchParams()
  if (filters?.machineId) params.set('machineId', String(filters.machineId))
  if (filters?.date) params.set('date', filters.date)
  if (filters?.status) params.set('status', filters.status)
  const query = params.toString()
  const path = query ? `/api/v1/daily-logs?${query}` : '/api/v1/daily-logs'
  try {
    const res = await apiClient.get<DailyLog[]>(path)
    return res.data
  } catch {
    let results = [...MOCK_DAILY_LOGS]
    if (filters?.machineId) results = results.filter(l => l.machine_id === filters.machineId)
    if (filters?.date) results = results.filter(l => l.date === filters.date)
    if (filters?.status) results = results.filter(l => l.status === filters.status)
    return results
  }
}

/** Returns daily logs for a specific machine. */
export async function getDailyLogsByMachineId(machineId: number): Promise<DailyLog[]> {
  try {
    const res = await apiClient.get<DailyLog[]>(`/api/v1/daily-logs?machineId=${machineId}`)
    return res.data
  } catch { return MOCK_DAILY_LOGS.filter(l => l.machine_id === machineId) }
}

/** Returns the most recent daily logs. */
export async function getRecentDailyLogs(limit: number): Promise<DailyLog[]> {
  try {
    const params = new URLSearchParams()
    params.set('limit', String(limit))
    params.set('sort', 'date:desc')
    const res = await apiClient.get<DailyLog[]>(`/api/v1/daily-logs?${params.toString()}`)
    return res.data
  } catch { return [...MOCK_DAILY_LOGS].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit) }
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

/** Creates a new daily log entry. */
export async function addDailyLog(input: NewDailyLogInput): Promise<DailyLog> {
  try {
    const res = await apiClient.post<DailyLog>('/api/v1/daily-logs', { ...input })
    return res.data
  } catch {
    return { id: Date.now(), ...input, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  }
}

/** Alias — same as getDailyLogs. */
export async function getAllDailyLogs(filters?: DailyLogFilters): Promise<DailyLog[]> {
  return getDailyLogs(filters)
}
