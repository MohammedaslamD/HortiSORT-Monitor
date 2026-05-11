import { describe, it, expect } from 'vitest'
import { computeDailyLogStats } from '../dailyLogStats'
import type { DailyLog } from '../../types'

const baseLog = (overrides: Partial<DailyLog>): DailyLog => ({
  id: 1,
  machine_id: 1,
  date: '2026-05-01',
  status: 'running',
  fruit_type: 'Banana',
  tons_processed: 1,
  shift_start: '06:00',
  shift_end: '14:00',
  notes: '',
  updated_by: 1,
  created_at: '2026-05-01T06:00:00Z',
  updated_at: '2026-05-01T06:00:00Z',
  ...overrides,
})

const NOW = new Date('2026-05-07T12:00:00Z')

describe('computeDailyLogStats', () => {
  it('returns zeros for an empty array', () => {
    expect(computeDailyLogStats([], NOW)).toEqual({
      logs_this_week: 0,
      running_days: 0,
      maintenance_days: 0,
      not_running_days: 0,
    })
  })

  it('counts only logs within the past 7 days as logs_this_week', () => {
    const logs = [
      baseLog({ id: 1, date: '2026-05-07' }), // today
      baseLog({ id: 2, date: '2026-05-01' }), // 6 days ago — included
      baseLog({ id: 3, date: '2026-04-30' }), // 7 days ago — excluded (>7d)
      baseLog({ id: 4, date: '2026-04-15' }), // very old — excluded
    ]
    expect(computeDailyLogStats(logs, NOW).logs_this_week).toBe(2)
  })

  it('collapses duplicate (machine_id, date) pairs by status', () => {
    const logs = [
      baseLog({ id: 1, machine_id: 1, date: '2026-05-07', status: 'running' }),
      baseLog({ id: 2, machine_id: 1, date: '2026-05-07', status: 'running' }), // dup
      baseLog({ id: 3, machine_id: 1, date: '2026-05-06', status: 'running' }),
      baseLog({ id: 4, machine_id: 2, date: '2026-05-07', status: 'running' }),
    ]
    expect(computeDailyLogStats(logs, NOW).running_days).toBe(3)
  })

  it('counts each status independently across machines and dates', () => {
    const logs = [
      baseLog({ id: 1, machine_id: 1, date: '2026-05-07', status: 'running' }),
      baseLog({ id: 2, machine_id: 1, date: '2026-05-06', status: 'maintenance' }),
      baseLog({ id: 3, machine_id: 2, date: '2026-05-07', status: 'maintenance' }),
      baseLog({ id: 4, machine_id: 2, date: '2026-05-05', status: 'not_running' }),
      baseLog({ id: 5, machine_id: 3, date: '2026-05-04', status: 'not_running' }),
    ]
    const stats = computeDailyLogStats(logs, NOW)
    expect(stats.running_days).toBe(1)
    expect(stats.maintenance_days).toBe(2)
    expect(stats.not_running_days).toBe(2)
    expect(stats.logs_this_week).toBe(5)
  })
})
