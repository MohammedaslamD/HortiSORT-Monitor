import { apiClient } from './apiClient'
import type { User } from '../types'
import type { CreateUserPayload, UpdateUserPayload } from '../types'

/** Returns all users. */
export async function getUsers(): Promise<User[]> {
  const res = await apiClient.get<User[]>('/api/v1/users')
  return res.data
}

/** Returns a single user by ID, or null if not found. */
export async function getUserById(id: number): Promise<User | null> {
  try {
    const res = await apiClient.get<User>(`/api/v1/users/${id}`)
    return res.data
  } catch {
    return null
  }
}

/** Toggles a user's is_active flag. Returns the updated user. Throws if not found. */
export async function toggleUserActive(id: number): Promise<User> {
  const res = await apiClient.patch<User>(`/api/v1/users/${id}/active`)
  return res.data
}

/** Creates a new user. Returns the created user. Throws on duplicate email (409). */
export async function createUser(data: CreateUserPayload): Promise<User> {
  const res = await apiClient.post<User>('/api/v1/users', data)
  return res.data
}

/** Updates a user's profile. Returns the updated user. Throws if not found. */
export async function updateUser(id: number, data: UpdateUserPayload): Promise<User> {
  const res = await apiClient.patch<User>(`/api/v1/users/${id}`, data)
  return res.data
}

/** Assigns machines to a user (customer). Replaces the existing machine assignment. */
export async function assignMachinesToUser(id: number, machineIds: number[]): Promise<void> {
  await apiClient.patch(`/api/v1/users/${id}/machines`, { machine_ids: machineIds })
}

/** Deletes a user by ID. Throws if user has associated records (409). */
export async function deleteUser(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/users/${id}`)
}
