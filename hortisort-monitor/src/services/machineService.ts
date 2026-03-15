import { apiClient } from './apiClient'
import type { Machine, MachineFilters, MachineStats, MachineStatus } from '../types'

/** Return all machines, optionally filtered. Role-scoping is handled server-side via JWT. */
export async function getMachines(filters?: MachineFilters): Promise<Machine[]> {
  const params = new URLSearchParams()
  if (filters?.status) params.set('status', filters.status)
  if (filters?.model) params.set('model', filters.model)
  if (filters?.city) params.set('city', filters.city)
  if (filters?.search) params.set('search', filters.search)

  const query = params.toString()
  const path = query ? `/api/v1/machines?${query}` : '/api/v1/machines'
  const res = await apiClient.get<Machine[]>(path)
  return res.data
}

/** Return a single machine by its ID. Throws if not found. */
export async function getMachineById(id: number): Promise<Machine> {
  const res = await apiClient.get<Machine>(`/api/v1/machines/${id}`)
  return res.data
}

/**
 * Return aggregated machine status counts.
 * Role-scoping is handled server-side; no user param required.
 */
export async function getMachineStats(): Promise<MachineStats> {
  const res = await apiClient.get<MachineStats>('/api/v1/machines/stats')
  return res.data
}

/**
 * Return machines visible to the authenticated user.
 * Role-scoping is handled server-side via JWT — no role/userId params needed.
 */
export async function getMachinesByRole(): Promise<Machine[]> {
  const res = await apiClient.get<Machine[]>('/api/v1/machines')
  return res.data
}

/** Update a machine's status. */
export async function updateMachineStatus(
  machineId: number,
  newStatus: MachineStatus,
  _updatedBy: number,
): Promise<void> {
  await apiClient.patch(`/api/v1/machines/${machineId}/status`, { status: newStatus })
}
