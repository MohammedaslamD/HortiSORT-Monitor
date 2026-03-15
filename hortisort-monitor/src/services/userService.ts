import type { User } from '../types'
import { MOCK_USERS } from '../data/mockData'

/** Returns all users. */
export async function getUsers(): Promise<User[]> {
  return [...MOCK_USERS]
}

/** Returns a single user by ID, or null if not found. */
export async function getUserById(id: number): Promise<User | null> {
  const found = MOCK_USERS.find((u) => u.id === id)
  return found ? { ...found } : null
}

/** Toggles a user's is_active flag. Returns the updated user. Throws if not found. */
export async function toggleUserActive(id: number): Promise<User> {
  const user = MOCK_USERS.find((u) => u.id === id)
  if (!user) throw new Error(`User ${id} not found`)

  user.is_active = !user.is_active
  user.updated_at = new Date().toISOString()
  return user
}
