import { vi, beforeEach, it, expect } from 'vitest'

vi.mock('../apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

import { apiClient } from '../apiClient'
import { getSiteVisitsByMachineId, getAllSiteVisits, logSiteVisit } from '../siteVisitService'

beforeEach(() => {
  vi.clearAllMocks()
})

it('getSiteVisitsByMachineId calls GET /api/v1/site-visits?machineId=:id', async () => {
  ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] })
  const result = await getSiteVisitsByMachineId(3)
  expect(apiClient.get).toHaveBeenCalledWith('/api/v1/site-visits?machineId=3')
  expect(result).toEqual([])
})

it('getAllSiteVisits calls GET /api/v1/site-visits with no params when no filters', async () => {
  ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] })
  const result = await getAllSiteVisits()
  expect(apiClient.get).toHaveBeenCalledWith('/api/v1/site-visits')
  expect(result).toEqual([])
})

it('getAllSiteVisits appends engineerId filter to query string', async () => {
  ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] })
  await getAllSiteVisits({ engineerId: 5 })
  expect(apiClient.get).toHaveBeenCalledWith('/api/v1/site-visits?engineerId=5')
})

it('getAllSiteVisits appends machineId filter to query string', async () => {
  ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] })
  await getAllSiteVisits({ machineId: 7 })
  expect(apiClient.get).toHaveBeenCalledWith('/api/v1/site-visits?machineId=7')
})

it('getAllSiteVisits appends purpose filter to query string', async () => {
  ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] })
  await getAllSiteVisits({ purpose: 'routine' })
  expect(apiClient.get).toHaveBeenCalledWith('/api/v1/site-visits?purpose=routine')
})

it('logSiteVisit posts to /api/v1/site-visits with body', async () => {
  const mockVisit = { id: 1, machine_id: 2, engineer_id: 3, visit_purpose: 'ticket' }
  ;(apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockVisit })
  const data = {
    machine_id: 2,
    engineer_id: 3,
    visit_date: '2025-03-15',
    visit_purpose: 'ticket' as const,
    findings: 'Sensor fault',
    actions_taken: 'Replaced sensor',
  }
  const result = await logSiteVisit(data)
  expect(apiClient.post).toHaveBeenCalledWith('/api/v1/site-visits', data)
  expect(result).toEqual(mockVisit)
})
