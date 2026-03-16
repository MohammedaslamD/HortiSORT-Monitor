import { apiClient } from './apiClient'
import type { DailyLog, DailyLogFilters, DailyLogStatus } from '../types'

/** Returns all daily logs, optionally filtered. Sorted by date descending server-side. */
export async function getDailyLogs(filters?: DailyLogFilters): Promise<DailyLog[]> {
  const params = new URLSearchParams()
  if (filters?.machineId) params.set('machineId', String(filters.machineId))
  if (filters?.date) params.set('date', filters.date)
  if (filters?.status) params.set('status', filters.status)

  const query = params.toString()
  const path = query ? `/api/v1/daily-logs?${query}` : '/api/v1/daily-logs'
  const res = await apiClient.get<DailyLog[]>(path)
  return res.data
}

/** Returns daily logs for a specific machine. */
export async function getDailyLogsByMachineId(machineId: number): Promise<DailyLog[]> {
  const res = await apiClient.get<DailyLog[]>(`/api/v1/daily-logs?machineId=${machineId}`)
  return res.data
}

/** Returns the most recent daily logs, sorted by date descending. */
export async function getRecentDailyLogs(limit: number): Promise<DailyLog[]> {
  const params = new URLSearchParams()
  params.set('limit', String(limit))
  params.set('sort', 'date:desc')
  const res = await apiClient.get<DailyLog[]>(`/api/v1/daily-logs?${params.toString()}`)
  return res.data
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
  const res = await apiClient.post<DailyLog>('/api/v1/daily-logs', {
    machine_id: input.machine_id,
    date: input.date,
    status: input.status,
    fruit_type: input.fruit_type,
    tons_processed: input.tons_processed,
    shift_start: input.shift_start,
    shift_end: input.shift_end,
    notes: input.notes,
  })
  return res.data
}

/** Returns all daily logs, optionally filtered. Sorted by date descending. */
export async function getAllDailyLogs(filters?: DailyLogFilters): Promise<DailyLog[]> {
  return getDailyLogs(filters)
}
