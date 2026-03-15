import { describe, it, expect } from 'vitest'
import { getUserById, getUserName } from '../userLookup'

describe('userLookup', () => {
  describe('getUserById', () => {
    it('should return the user when given a valid ID', () => {
      const user = getUserById(1)

      expect(user).toBeDefined()
      expect(user?.name).toBe('Rajesh Patel')
    })

    it('should return undefined for an invalid ID', () => {
      const user = getUserById(999)

      expect(user).toBeUndefined()
    })
  })

  describe('getUserName', () => {
    it('should return the user name for a valid ID', () => {
      const name = getUserName(3)

      expect(name).toBe('Amit Sharma')
    })

    it('should return "Unknown" for an invalid ID', () => {
      const name = getUserName(999)

      expect(name).toBe('Unknown')
    })
  })
})
