import { getUsers, getUserById, toggleUserActive } from '../userService'
import { MOCK_USERS } from '../../data/mockData'

/** Snapshot of original is_active values — restored after each test to prevent state leaking. */
let originalActiveStates: Map<number, boolean>

describe('userService', () => {
  beforeEach(() => {
    originalActiveStates = new Map(MOCK_USERS.map((u) => [u.id, u.is_active]))
  })

  afterEach(() => {
    for (const user of MOCK_USERS) {
      user.is_active = originalActiveStates.get(user.id) ?? true
    }
  })

  describe('getUsers', () => {
    it('returns all 6 mock users', async () => {
      const users = await getUsers()
      expect(users).toHaveLength(6)
    })

    it('returns users with expected properties', async () => {
      const users = await getUsers()
      const first = users[0]
      expect(first).toHaveProperty('id')
      expect(first).toHaveProperty('name')
      expect(first).toHaveProperty('email')
      expect(first).toHaveProperty('role')
      expect(first).toHaveProperty('is_active')
    })
  })

  describe('getUserById', () => {
    it('returns the correct user for a valid ID', async () => {
      const user = await getUserById(1)
      expect(user).not.toBeNull()
      expect(user!.name).toBe('Rajesh Patel')
      expect(user!.role).toBe('customer')
    })

    it('returns null for a non-existent ID', async () => {
      const user = await getUserById(999)
      expect(user).toBeNull()
    })
  })

  describe('toggleUserActive', () => {
    it('deactivates an active user', async () => {
      const user = await toggleUserActive(1)
      expect(user.is_active).toBe(false)
    })

    it('activates an inactive user', async () => {
      // Explicitly deactivate first so this test is self-contained
      await toggleUserActive(1)
      const user = await toggleUserActive(1)
      expect(user.is_active).toBe(true)
    })

    it('throws for a non-existent user ID', async () => {
      await expect(toggleUserActive(999)).rejects.toThrow('User 999 not found')
    })

    it('updates the updated_at timestamp', async () => {
      const before = new Date().toISOString()
      const user = await toggleUserActive(2)
      expect(user.updated_at >= before).toBe(true)
    })
  })
})
