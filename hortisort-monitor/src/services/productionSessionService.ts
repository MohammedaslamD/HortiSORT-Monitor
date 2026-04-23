import { apiClient } from './apiClient'
import type { ProductionSession, ProductionSessionFilters } from '../types'

/**
 * Get today's production sessions for a specific machine.
 */
export async function getTodaySessions(
  machineId: number,
  date: string
): Promise<ProductionSession[]> {
  const res = await apiClient.get<ProductionSession[]>(
    `/api/v1/production-sessions/today?machine_id=${machineId}&date=${date}`
  )
  return res.data
}

/**
 * Get all production sessions with optional filters (for the Production page).
 */
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
  const res = await apiClient.get<ProductionSession[]>(path)
  return res.data
}
