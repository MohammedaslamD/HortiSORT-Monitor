import { vi, beforeEach, it, expect } from 'vitest'

vi.mock('../apiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

import { apiClient } from '../apiClient'
import { getRecentActivity } from '../activityLogService'

beforeEach(() => {
  vi.clearAllMocks()
})

it('getRecentActivity calls GET /api/v1/activity-log?limit=:limit', async () => {
  ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] })
  await getRecentActivity(10)
  expect(apiClient.get).toHaveBeenCalledWith('/api/v1/activity-log?limit=10')
})

it('getRecentActivity returns the data array from the response', async () => {
  const mockEntries = [
    { id: 1, user_id: 1, action: 'Updated machine status', entity_type: 'machine', entity_id: 1, details: 'changed to running', created_at: '2025-01-01T00:00:00Z' },
  ]
  ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockEntries })
  const result = await getRecentActivity(5)
  expect(result).toEqual(mockEntries)
})

it('getRecentActivity passes the limit value in the query string', async () => {
  ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] })
  await getRecentActivity(3)
  expect(apiClient.get).toHaveBeenCalledWith('/api/v1/activity-log?limit=3')
})
