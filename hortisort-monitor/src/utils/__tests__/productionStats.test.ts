import { describe, it, expect } from 'vitest'
import { computeProductionStats } from '../productionStats'
import type { ProductionSession } from '../../types'

const baseSession = (overrides: Partial<ProductionSession>): ProductionSession => ({
  id: 1,
  machine_id: 1,
  lot_number: 1,
  session_date: '2026-05-01',
  start_time: '2026-05-01T06:00:00Z',
  stop_time: null,
  fruit_type: 'Banana',
  quantity_kg: null,
  status: 'running',
  raw_tdms_rows: null,
  created_at: '2026-05-01T06:00:00Z',
  updated_at: '2026-05-01T06:00:00Z',
  ...overrides,
})

describe('computeProductionStats', () => {
  it('returns zeros for an empty array', () => {
    expect(computeProductionStats([])).toEqual({
      active_sessions: 0,
      lots_today: 0,
      items_processed_kg: 0,
      rejection_rate_pct: 0,
    })
  })

  it('counts every running session as active', () => {
    const sessions = [
      baseSession({ id: 1, status: 'running' }),
      baseSession({ id: 2, status: 'running' }),
      baseSession({ id: 3, status: 'running' }),
    ]
    const stats = computeProductionStats(sessions)
    expect(stats.active_sessions).toBe(3)
    expect(stats.lots_today).toBe(3)
  })

  it('counts only running sessions in active, but includes all in lots_today', () => {
    const sessions = [
      baseSession({ id: 1, status: 'running' }),
      baseSession({ id: 2, status: 'completed' }),
      baseSession({ id: 3, status: 'completed' }),
      baseSession({ id: 4, status: 'error' }),
    ]
    const stats = computeProductionStats(sessions)
    expect(stats.active_sessions).toBe(1)
    expect(stats.lots_today).toBe(4)
  })

  it('sums quantity_kg via parseFloat and skips null entries', () => {
    const sessions = [
      baseSession({ id: 1, quantity_kg: '850.0' }),
      baseSession({ id: 2, quantity_kg: '360.5' }),
      baseSession({ id: 3, quantity_kg: null }),
      baseSession({ id: 4, quantity_kg: '290.0' }),
    ]
    const stats = computeProductionStats(sessions)
    // 850 + 360.5 + 290 = 1500.5 → rounded → 1501
    expect(stats.items_processed_kg).toBe(1501)
    // rejection_rate_pct stays 0 until items_rejected exists
    expect(stats.rejection_rate_pct).toBe(0)
  })
})
