import { vi, beforeEach, it, expect, describe } from 'vitest'

vi.mock('../apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

import { apiClient } from '../apiClient'
import {
  getDailyLogs,
  getDailyLogsByMachineId,
  getRecentDailyLogs,
  getAllDailyLogs,
  addDailyLog,
} from '../dailyLogService'
import type { NewDailyLogInput } from '../dailyLogService'

const mockGet = apiClient.get as ReturnType<typeof vi.fn>
const mockPost = apiClient.post as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getDailyLogs', () => {
  it('calls GET /api/v1/daily-logs with no query when no filters', async () => {
    mockGet.mockResolvedValue({ data: [] })
    const result = await getDailyLogs()
    expect(mockGet).toHaveBeenCalledWith('/api/v1/daily-logs')
    expect(result).toEqual([])
  })

  it('calls GET /api/v1/daily-logs with machineId query param', async () => {
    mockGet.mockResolvedValue({ data: [] })
    await getDailyLogs({ machineId: 3 })
    expect(mockGet).toHaveBeenCalledWith('/api/v1/daily-logs?machineId=3')
  })

  it('calls GET /api/v1/daily-logs with date query param', async () => {
    mockGet.mockResolvedValue({ data: [] })
    await getDailyLogs({ date: '2026-03-15' })
    expect(mockGet).toHaveBeenCalledWith('/api/v1/daily-logs?date=2026-03-15')
  })

  it('calls GET /api/v1/daily-logs with status query param', async () => {
    mockGet.mockResolvedValue({ data: [] })
    await getDailyLogs({ status: 'running' })
    expect(mockGet).toHaveBeenCalledWith('/api/v1/daily-logs?status=running')
  })

  it('calls GET /api/v1/daily-logs with multiple query params', async () => {
    mockGet.mockResolvedValue({ data: [] })
    await getDailyLogs({ machineId: 2, status: 'maintenance' })
    const called = mockGet.mock.calls[0][0] as string
    expect(called).toContain('machineId=2')
    expect(called).toContain('status=maintenance')
  })

  it('returns data from the response', async () => {
    const logs = [{ id: 1, machine_id: 1, date: '2026-03-15' }]
    mockGet.mockResolvedValue({ data: logs })
    const result = await getDailyLogs()
    expect(result).toEqual(logs)
  })
})

describe('getDailyLogsByMachineId', () => {
  it('calls GET /api/v1/daily-logs?machineId=:id', async () => {
    mockGet.mockResolvedValue({ data: [] })
    const result = await getDailyLogsByMachineId(7)
    expect(mockGet).toHaveBeenCalledWith('/api/v1/daily-logs?machineId=7')
    expect(result).toEqual([])
  })
})

describe('getRecentDailyLogs', () => {
  it('calls GET /api/v1/daily-logs with limit and sort params', async () => {
    mockGet.mockResolvedValue({ data: [] })
    await getRecentDailyLogs(5)
    expect(mockGet).toHaveBeenCalledWith('/api/v1/daily-logs?limit=5&sort=date%3Adesc')
  })
})

describe('getAllDailyLogs', () => {
  it('calls GET /api/v1/daily-logs with no params when no filters', async () => {
    mockGet.mockResolvedValue({ data: [] })
    await getAllDailyLogs()
    expect(mockGet).toHaveBeenCalledWith('/api/v1/daily-logs')
  })

  it('calls GET /api/v1/daily-logs with machineId filter', async () => {
    mockGet.mockResolvedValue({ data: [] })
    await getAllDailyLogs({ machineId: 1 })
    expect(mockGet).toHaveBeenCalledWith('/api/v1/daily-logs?machineId=1')
  })

  it('calls GET /api/v1/daily-logs with date filter', async () => {
    mockGet.mockResolvedValue({ data: [] })
    await getAllDailyLogs({ date: '2026-03-10' })
    expect(mockGet).toHaveBeenCalledWith('/api/v1/daily-logs?date=2026-03-10')
  })

  it('calls GET /api/v1/daily-logs with status filter', async () => {
    mockGet.mockResolvedValue({ data: [] })
    await getAllDailyLogs({ status: 'not_running' })
    expect(mockGet).toHaveBeenCalledWith('/api/v1/daily-logs?status=not_running')
  })
})

describe('addDailyLog', () => {
  it('calls POST /api/v1/daily-logs with the correct body', async () => {
    const input: NewDailyLogInput = {
      machine_id: 2,
      date: '2026-03-15',
      status: 'running',
      fruit_type: 'mango',
      tons_processed: 12.5,
      shift_start: '08:00',
      shift_end: '16:00',
      notes: 'All good',
      updated_by: 3,
    }
    const created = { id: 99, ...input }
    mockPost.mockResolvedValue({ data: created })
    const result = await addDailyLog(input)
    expect(mockPost).toHaveBeenCalledWith('/api/v1/daily-logs', {
      machine_id: 2,
      date: '2026-03-15',
      status: 'running',
      fruit_type: 'mango',
      tons_processed: 12.5,
      shift_start: '08:00',
      shift_end: '16:00',
      notes: 'All good',
    })
    expect(result).toEqual(created)
  })
})
