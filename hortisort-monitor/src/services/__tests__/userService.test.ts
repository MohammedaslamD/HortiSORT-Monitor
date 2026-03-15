import { vi, beforeEach, it, expect } from 'vitest'

vi.mock('../apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}))

import { apiClient } from '../apiClient'
import { getUsers, getUserById, toggleUserActive } from '../userService'

beforeEach(() => {
  vi.clearAllMocks()
})

it('getUsers calls GET /api/v1/users', async () => {
  ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] })
  const result = await getUsers()
  expect(apiClient.get).toHaveBeenCalledWith('/api/v1/users')
  expect(result).toEqual([])
})

it('getUserById calls GET /api/v1/users/:id and returns the user', async () => {
  const mockUser = { id: 2, name: 'Test Engineer', email: 'e@test.com', role: 'engineer' }
  ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockUser })
  const result = await getUserById(2)
  expect(apiClient.get).toHaveBeenCalledWith('/api/v1/users/2')
  expect(result).toEqual(mockUser)
})

it('getUserById returns null when the request throws (404)', async () => {
  ;(apiClient.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('User 999 not found'))
  const result = await getUserById(999)
  expect(result).toBeNull()
})

it('toggleUserActive calls PATCH /api/v1/users/:id/active', async () => {
  const mockUser = { id: 3, is_active: false }
  ;(apiClient.patch as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockUser })
  const result = await toggleUserActive(3)
  expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/users/3/active')
  expect(result).toEqual(mockUser)
})
