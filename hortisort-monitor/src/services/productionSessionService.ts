import { apiClient } from './apiClient'
import type { ProductionSession, ProductionSessionFilters } from '../types'

/** Get today's production sessions for a specific machine. */
export async function getTodaySessions(machineId: number, date: string): Promise<ProductionSession[]> {
  try {
    const res = await apiClient.get<ProductionSession[]>(
      `/api/v1/production-sessions/today?machine_id=${machineId}&date=${date}`
    )
    return res.data
  } catch { return [] }
}

/** Get all production sessions with optional filters. */
export async function getAllTodaySessions(
  date?: string,
  filters?: Omit<ProductionSessionFilters, 'date'>
): Promise<ProductionSession[]> {
  const params = new URLSearchParams()
  if (date) params.set('date', date)
  if (filters?.machine_id) params.set('machine_id', String(filters.machine_id))
  if (filters?.status) params.set('status', filters.status)
  if (filters?.limit) params.set('limit', String(filters.limit))
  const query = params.toString()
  const path = query ? `/api/v1/production-sessions?${query}` : '/api/v1/production-sessions'
  try {
    const res = await apiClient.get<ProductionSession[]>(path)
    return res.data
  } catch { return [] }
}
