import { getRecentActivity } from '../activityLogService'

describe('activityLogService', () => {
  describe('getRecentActivity', () => {
    it('returns entries sorted by created_at descending', async () => {
      const activities = await getRecentActivity(10)
      for (let i = 1; i < activities.length; i++) {
        expect(activities[i - 1].created_at >= activities[i].created_at).toBe(true)
      }
    })

    it('respects the limit parameter', async () => {
      const activities = await getRecentActivity(3)
      expect(activities).toHaveLength(3)
    })

    it('returns all entries when limit exceeds total count', async () => {
      const activities = await getRecentActivity(100)
      expect(activities).toHaveLength(10)
    })

    it('returns entries with expected properties', async () => {
      const activities = await getRecentActivity(1)
      const entry = activities[0]
      expect(entry).toHaveProperty('id')
      expect(entry).toHaveProperty('user_id')
      expect(entry).toHaveProperty('action')
      expect(entry).toHaveProperty('entity_type')
      expect(entry).toHaveProperty('entity_id')
      expect(entry).toHaveProperty('details')
      expect(entry).toHaveProperty('created_at')
    })

    it('returns the most recent entry first', async () => {
      const all = await getRecentActivity(100)
      const activities = await getRecentActivity(1)
      // First entry should have the latest created_at of any entry
      const maxTimestamp = all.reduce(
        (max, a) => (a.created_at > max ? a.created_at : max),
        '',
      )
      expect(activities[0].created_at).toBe(maxTimestamp)
    })
  })
})
