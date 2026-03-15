import type { MachineHistory } from '../types'
import { MOCK_MACHINE_HISTORY } from '../data/mockData'

/** Returns history entries for a specific machine, sorted by created_at descending. */
export async function getHistoryByMachineId(machineId: number): Promise<MachineHistory[]> {
  return [...MOCK_MACHINE_HISTORY]
    .filter((h) => h.machine_id === machineId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}
