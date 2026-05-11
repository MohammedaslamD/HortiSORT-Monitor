import { vi, beforeEach, it, expect, describe } from 'vitest'

vi.mock('../apiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

import { apiClient } from '../apiClient'
import {
  getTodaySessions,
  getAllTodaySessions,
} from '../productionSessionService'
import type { ProductionSession } from '../../types'

const mockGet = apiClient.get as ReturnType<typeof vi.fn>

const SESSION: ProductionSession = {
  id: 1,
  machine_id: 1,
  lot_number: 1,
  session_date: '2026-04-23',
  start_time: '2026-04-23T06:00:00Z',
  stop_time: null,
  fruit_type: 'Mango',
  quantity_kg: '500.00',
  status: 'running',
  raw_tdms_rows: null,
  created_at: '2026-04-23T06:00:00Z',
  updated_at: '2026-04-23T06:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getTodaySessions', () => {
  it('calls GET /api/v1/production-sessions/today with machine_id and date', async () => {
    mockGet.mockResolvedValue({ data: [SESSION] })
    const result = await getTodaySessions(1, '2026-04-23')
    expect(mockGet).toHaveBeenCalledWith(
      '/api/v1/production-sessions/today?machine_id=1&date=2026-04-23'
    )
    expect(result).toEqual([SESSION])
  })
})

describe('getAllTodaySessions', () => {
  it('calls GET /api/v1/production-sessions with date filter', async () => {
    mockGet.mockResolvedValue({ data: [SESSION] })
    const result = await getAllTodaySessions('2026-04-23')
    expect(mockGet).toHaveBeenCalledWith(
      '/api/v1/production-sessions?date=2026-04-23'
    )
    expect(result).toEqual([SESSION])
  })

  it('calls GET without date param when no date provided', async () => {
    mockGet.mockResolvedValue({ data: [] })
    await getAllTodaySessions()
    expect(mockGet).toHaveBeenCalledWith('/api/v1/production-sessions')
  })
})
