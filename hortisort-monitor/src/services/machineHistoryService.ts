import { apiClient } from './apiClient'
import { MOCK_MACHINE_HISTORY } from '../data/mockData'
import type { MachineHistory } from '../types'

/** Returns history entries for a specific machine. */
export async function getHistoryByMachineId(machineId: number): Promise<MachineHistory[]> {
  try {
    const res = await apiClient.get<MachineHistory[]>(`/api/v1/machine-history/${machineId}`)
    return res.data
  } catch { return MOCK_MACHINE_HISTORY.filter(h => h.machine_id === machineId) }
}
