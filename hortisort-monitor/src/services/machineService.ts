import type { Machine, MachineFilters } from '../types'
import { MOCK_MACHINES } from '../data/mockData'

/** Return all machines, optionally filtered. */
export async function getMachines(filters?: MachineFilters): Promise<Machine[]> {
  let result = MOCK_MACHINES

  if (filters?.status) {
    result = result.filter((m) => m.status === filters.status)
  }

  return result
}
