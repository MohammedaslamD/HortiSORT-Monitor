import { describe, it, expect } from 'vitest'
import { getDailyLogs, getDailyLogsByMachineId, getRecentDailyLogs, getAllDailyLogs } from '../dailyLogService'

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

  describe('getAllDailyLogs', () => {
    it('should return all 15 logs sorted by date desc when no filters given', async () => {
      const logs = await getAllDailyLogs()
      expect(logs).toHaveLength(15)
      for (let i = 0; i < logs.length - 1; i++) {
        expect(logs[i].date >= logs[i + 1].date).toBe(true)
      }
    })

    it('should filter by machineId', async () => {
      const logs = await getAllDailyLogs({ machineId: 1 })
      expect(logs).toHaveLength(3)
      expect(logs.every((l) => l.machine_id === 1)).toBe(true)
    })

    it('should filter by date', async () => {
      const logs = await getAllDailyLogs({ date: '2026-03-15' })
      expect(logs).toHaveLength(4)
      expect(logs.every((l) => l.date === '2026-03-15')).toBe(true)
    })

    it('should filter by status', async () => {
      const logs = await getAllDailyLogs({ status: 'running' })
      expect(logs).toHaveLength(12)
      expect(logs.every((l) => l.status === 'running')).toBe(true)
    })

    it('should combine multiple filters', async () => {
      const logs = await getAllDailyLogs({ machineId: 1, status: 'running' })
      expect(logs).toHaveLength(3)
      expect(logs.every((l) => l.machine_id === 1 && l.status === 'running')).toBe(true)
    })
  })
})
