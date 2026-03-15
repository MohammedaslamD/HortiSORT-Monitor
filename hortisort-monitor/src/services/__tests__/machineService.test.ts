import { vi, beforeEach, it, expect, describe } from 'vitest'

vi.mock('../apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}))

import { apiClient } from '../apiClient'
import { getMachines, getMachineById, getMachineStats, getMachinesByRole, updateMachineStatus } from '../machineService'

const mockGet = apiClient.get as ReturnType<typeof vi.fn>
const mockPatch = apiClient.patch as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getMachines', () => {
  it('calls GET /api/v1/machines with no params when no filters', async () => {
    mockGet.mockResolvedValue({ data: [] })
    const result = await getMachines()
    expect(mockGet).toHaveBeenCalledWith('/api/v1/machines')
    expect(result).toEqual([])
  })

  it('calls GET /api/v1/machines with status query param', async () => {
    mockGet.mockResolvedValue({ data: [] })
    await getMachines({ status: 'running' })
    expect(mockGet).toHaveBeenCalledWith('/api/v1/machines?status=running')
  })

  it('calls GET /api/v1/machines with multiple filter params', async () => {
    mockGet.mockResolvedValue({ data: [] })
    await getMachines({ status: 'idle', city: 'Mumbai' })
    const called = mockGet.mock.calls[0][0] as string
    expect(called).toContain('status=idle')
    expect(called).toContain('city=Mumbai')
  })

  it('returns the data array from the response', async () => {
    const machines = [{ id: 1, machine_code: 'HS-001' }]
    mockGet.mockResolvedValue({ data: machines })
    const result = await getMachines()
    expect(result).toEqual(machines)
  })
})

describe('getMachineById', () => {
  it('calls GET /api/v1/machines/:id', async () => {
    mockGet.mockResolvedValue({ data: { id: 5 } })
    const result = await getMachineById(5)
    expect(mockGet).toHaveBeenCalledWith('/api/v1/machines/5')
    expect(result).toEqual({ id: 5 })
  })
})

describe('getMachineStats', () => {
  it('calls GET /api/v1/machines/stats and returns stats', async () => {
    const stats = { running: 3, idle: 2, down: 1, offline: 0, total: 6 }
    mockGet.mockResolvedValue({ data: stats })
    const result = await getMachineStats()
    expect(mockGet).toHaveBeenCalledWith('/api/v1/machines/stats')
    expect(result).toEqual(stats)
  })
})

describe('getMachinesByRole', () => {
  it('calls GET /api/v1/machines (server handles role-scoping)', async () => {
    mockGet.mockResolvedValue({ data: [] })
    await getMachinesByRole()
    expect(mockGet).toHaveBeenCalledWith('/api/v1/machines')
  })
})

describe('updateMachineStatus', () => {
  it('calls PATCH /api/v1/machines/:id/status with correct body', async () => {
    mockPatch.mockResolvedValue({ data: {} })
    await updateMachineStatus(3, 'down', 1)
    expect(mockPatch).toHaveBeenCalledWith('/api/v1/machines/3/status', { status: 'down' })
  })
})
