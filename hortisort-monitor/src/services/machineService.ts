import { apiClient } from './apiClient'
import { MOCK_MACHINES } from '../data/mockData'
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
  try {
    const res = await apiClient.get<Machine[]>(path)
    return res.data
  } catch {
    let results = [...MOCK_MACHINES]
    if (filters?.status) results = results.filter(m => m.status === filters.status)
    if (filters?.search) results = results.filter(m => m.machine_code.toLowerCase().includes(filters.search!.toLowerCase()) || m.site.toLowerCase().includes(filters.search!.toLowerCase()))
    return results
  }
}

/** Return a single machine by its ID. Throws if not found. */
export async function getMachineById(id: number): Promise<Machine> {
  try {
    const res = await apiClient.get<Machine>(`/api/v1/machines/${id}`)
    return res.data
  } catch {
    const m = MOCK_MACHINES.find(m => m.id === id)
    if (!m) throw new Error(`Machine ${id} not found`)
    return m
  }
}

/** Return aggregated machine status counts. */
export async function getMachineStats(): Promise<MachineStats> {
  try {
    const res = await apiClient.get<MachineStats>('/api/v1/machines/stats')
    return res.data
  } catch {
    const running = MOCK_MACHINES.filter(m => m.status === 'running').length
    const idle = MOCK_MACHINES.filter(m => m.status === 'idle').length
    const down = MOCK_MACHINES.filter(m => m.status === 'down').length
    const offline = MOCK_MACHINES.filter(m => m.status === 'offline').length
    return { total: MOCK_MACHINES.length, running, idle, down, offline }
  }
}

/** Return machines visible to the authenticated user. */
export async function getMachinesByRole(): Promise<Machine[]> {
  try {
    const res = await apiClient.get<Machine[]>('/api/v1/machines')
    return res.data
  } catch {
    return [...MOCK_MACHINES]
  }
}

/** Update a machine's status. */
export async function updateMachineStatus(
  machineId: number,
  newStatus: MachineStatus,
  _updatedBy: number,
): Promise<void> {
  try {
    await apiClient.patch(`/api/v1/machines/${machineId}/status`, { status: newStatus })
  } catch {
    // no-op in demo mode
  }
}
