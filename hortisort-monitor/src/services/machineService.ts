import type { Machine, MachineFilters, MachineStats, MachineStatus, UserRole } from '../types'
import { MOCK_MACHINES } from '../data/mockData'

/** Return all machines, optionally filtered. All filters are AND-combined. */
export async function getMachines(filters?: MachineFilters): Promise<Machine[]> {
  let result = MOCK_MACHINES

  if (filters?.status) {
    result = result.filter((m) => m.status === filters.status)
  }

  if (filters?.model) {
    result = result.filter((m) => m.model === filters.model)
  }

  if (filters?.city) {
    const cityLower = filters.city.toLowerCase()
    result = result.filter((m) => m.city.toLowerCase() === cityLower)
  }

  if (filters?.search) {
    const term = filters.search.toLowerCase()
    result = result.filter(
      (m) =>
        m.machine_code.toLowerCase().includes(term) ||
        m.machine_name.toLowerCase().includes(term) ||
        m.city.toLowerCase().includes(term) ||
        m.state.toLowerCase().includes(term),
    )
  }

  return result
}

/** Return a single machine by its ID, or undefined if not found. */
export async function getMachineById(id: number): Promise<Machine | undefined> {
  return MOCK_MACHINES.find((m) => m.id === id)
}

/** Compute aggregated status counts from the given array of machines. */
export function getMachineStats(machines: Machine[]): MachineStats {
  return {
    total: machines.length,
    running: machines.filter((m) => m.status === 'running').length,
    idle: machines.filter((m) => m.status === 'idle').length,
    down: machines.filter((m) => m.status === 'down').length,
    offline: machines.filter((m) => m.status === 'offline').length,
  }
}

/** Return machines visible to a user based on their role.
 *  - customer: only machines where customer_id matches userId
 *  - engineer: only machines where engineer_id matches userId
 *  - admin: all machines
 */
export async function getMachinesByRole(role: UserRole, userId: number): Promise<Machine[]> {
  switch (role) {
    case 'customer':
      return MOCK_MACHINES.filter((m) => m.customer_id === userId)
    case 'engineer':
      return MOCK_MACHINES.filter((m) => m.engineer_id === userId)
    case 'admin':
      return [...MOCK_MACHINES]
  }
}

/**
 * Mutates the in-memory mock machine record with the given status and timestamp.
 * Used by UpdateStatusPage to reflect submitted data without a real backend.
 */
export async function updateMachineStatus(
  machineId: number,
  newStatus: MachineStatus,
  updatedBy: number,
): Promise<void> {
  const machine = MOCK_MACHINES.find((m) => m.id === machineId)
  if (!machine) throw new Error(`Machine ${machineId} not found`)
  machine.status = newStatus
  machine.last_updated = new Date().toISOString()
  machine.last_updated_by = updatedBy
  machine.updated_at = new Date().toISOString()
}
