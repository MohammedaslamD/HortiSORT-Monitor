import { apiClient } from './apiClient'
import type { User } from '../types'

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
