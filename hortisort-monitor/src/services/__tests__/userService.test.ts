import { vi, beforeEach, it, expect, describe } from 'vitest'

vi.mock('../apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

import { apiClient } from '../apiClient'
import { getUsers, getUserById, toggleUserActive, createUser, updateUser, assignMachinesToUser, deleteUser } from '../userService'
import type { UserRole } from '../../types'

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

describe('createUser', () => {
  it('posts to /users and returns the created user', async () => {
    const newUser = { id: 99, name: 'New', email: 'new@test.com', phone: '9000000099', role: 'engineer' as UserRole, is_active: true, created_at: '', updated_at: '', password_hash: '' }
    ;(apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: newUser })
    const result = await createUser({ name: 'New', email: 'new@test.com', phone: '9000000099', role: 'engineer', password: 'password123' })
    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/users', expect.objectContaining({ email: 'new@test.com' }))
    expect(result.email).toBe('new@test.com')
  })
})

describe('updateUser', () => {
  it('patches /users/:id and returns the updated user', async () => {
    const updated = { id: 3, name: 'Updated', email: 'amit@test.com', phone: '9999999999', role: 'engineer' as UserRole, is_active: true, created_at: '', updated_at: '', password_hash: '' }
    ;(apiClient.patch as ReturnType<typeof vi.fn>).mockResolvedValue({ data: updated })
    const result = await updateUser(3, { name: 'Updated', phone: '9999999999', role: 'engineer' })
    expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/users/3', expect.objectContaining({ name: 'Updated' }))
    expect(result.name).toBe('Updated')
  })
})

describe('assignMachinesToUser', () => {
  it('patches /users/:id/machines with machine_ids', async () => {
    ;(apiClient.patch as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { updated: 2 } })
    await assignMachinesToUser(1, [3, 4])
    expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/users/1/machines', { machine_ids: [3, 4] })
  })
})

describe('deleteUser', () => {
  it('sends DELETE /users/:id', async () => {
    ;(apiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { deleted: true } })
    await deleteUser(5)
    expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/users/5')
  })
})
