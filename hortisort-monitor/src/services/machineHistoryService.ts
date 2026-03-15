import { apiClient } from './apiClient'
import type { MachineHistory } from '../types'

/** Returns history entries for a specific machine, sorted by created_at descending. */
export async function getHistoryByMachineId(machineId: number): Promise<MachineHistory[]> {
  const res = await apiClient.get<MachineHistory[]>(`/api/v1/machine-history/${machineId}`)
  return res.data
}
