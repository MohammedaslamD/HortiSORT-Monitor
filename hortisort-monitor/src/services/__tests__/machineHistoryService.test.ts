import { vi, beforeEach, it, expect } from 'vitest'

vi.mock('../apiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

import { apiClient } from '../apiClient'
import { getHistoryByMachineId } from '../machineHistoryService'

beforeEach(() => {
  vi.clearAllMocks()
})

it('getHistoryByMachineId calls GET /api/v1/machine-history/:machineId', async () => {
  ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] })
  const result = await getHistoryByMachineId(3)
  expect(apiClient.get).toHaveBeenCalledWith('/api/v1/machine-history/3')
  expect(result).toEqual([])
})

it('getHistoryByMachineId returns the data array from the response', async () => {
  const mockHistory = [
    { id: 1, machine_id: 3, change_type: 'status_change', old_value: 'idle', new_value: 'running', changed_by: 1, created_at: '2025-01-01T00:00:00Z' },
  ]
  ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockHistory })
  const result = await getHistoryByMachineId(3)
  expect(result).toEqual(mockHistory)
})
