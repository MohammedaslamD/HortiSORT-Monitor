import { describe, it, expect } from 'vitest'
import { getDailyLogs, getDailyLogsByMachineId, getRecentDailyLogs } from '../dailyLogService'

describe('dailyLogService', () => {
  describe('getDailyLogs', () => {
    it('should return all 15 daily logs', async () => {
      const logs = await getDailyLogs()
      expect(logs).toHaveLength(15)
    })
  })

  describe('getDailyLogsByMachineId', () => {
    it('should return 3 logs for machine id 1', async () => {
      const logs = await getDailyLogsByMachineId(1)
      expect(logs).toHaveLength(3)
    })

    it('should return empty array for machine with no logs', async () => {
      const logs = await getDailyLogsByMachineId(999)
      expect(logs).toHaveLength(0)
    })
  })

  describe('getRecentDailyLogs', () => {
    it('should return logs sorted by date desc, limited to N', async () => {
      const logs = await getRecentDailyLogs(3)
      expect(logs).toHaveLength(3)
      expect(logs.every((log) => log.date === '2026-03-15')).toBe(true)
    })

    it('should return all logs sorted when limit exceeds total', async () => {
      const logs = await getRecentDailyLogs(100)
      expect(logs).toHaveLength(15)
      // Verify sorted descending: each date >= next date
      for (let i = 0; i < logs.length - 1; i++) {
        expect(logs[i].date >= logs[i + 1].date).toBe(true)
      }
    })
  })
})
