import type { User } from '../types'
import { MOCK_USERS } from '../data/mockData'

/** Finds a user by their ID from MOCK_USERS. */
export function getUserById(id: number): User | undefined {
  return MOCK_USERS.find((user) => user.id === id)
}

/** Returns the user's name for a given ID, or "Unknown" if not found. */
export function getUserName(id: number): string {
  const user = getUserById(id)
  return user ? user.name : 'Unknown'
}
