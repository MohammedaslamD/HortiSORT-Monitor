import { apiClient } from './apiClient'
import { MOCK_SITE_VISITS } from '../data/mockData'
import type { SiteVisit, SiteVisitFilters, NewSiteVisitData } from '../types'

export async function getSiteVisitsByMachineId(machineId: number): Promise<SiteVisit[]> {
  try {
    const res = await apiClient.get<SiteVisit[]>(`/api/v1/site-visits?machineId=${machineId}`)
    return res.data
  } catch { return MOCK_SITE_VISITS.filter(v => v.machine_id === machineId) }
}

export async function getAllSiteVisits(filters?: SiteVisitFilters): Promise<SiteVisit[]> {
  const params = new URLSearchParams()
  if (filters?.engineerId) params.set('engineerId', String(filters.engineerId))
  if (filters?.machineId) params.set('machineId', String(filters.machineId))
  if (filters?.purpose) params.set('purpose', filters.purpose)
  const query = params.toString()
  try {
    const res = await apiClient.get<SiteVisit[]>(`/api/v1/site-visits${query ? `?${query}` : ''}`)
    return res.data
  } catch {
    let results = [...MOCK_SITE_VISITS]
    if (filters?.machineId) results = results.filter(v => v.machine_id === filters.machineId)
    if (filters?.engineerId) results = results.filter(v => v.engineer_id === filters.engineerId)
    return results
  }
}

export async function logSiteVisit(data: NewSiteVisitData): Promise<SiteVisit> {
  try {
    const res = await apiClient.post<SiteVisit>('/api/v1/site-visits', { ...data })
    return res.data
  } catch {
    return { id: Date.now(), ...data, created_at: new Date().toISOString() } as SiteVisit
  }
}
