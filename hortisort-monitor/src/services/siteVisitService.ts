import { apiClient } from './apiClient'
import type { SiteVisit, SiteVisitFilters, NewSiteVisitData } from '../types'

/** Returns site visits for a specific machine, sorted by visit_date descending (server-side). */
export async function getSiteVisitsByMachineId(machineId: number): Promise<SiteVisit[]> {
  const res = await apiClient.get<SiteVisit[]>(`/api/v1/site-visits?machineId=${machineId}`)
  return res.data
}

/** Returns all site visits, optionally filtered. */
export async function getAllSiteVisits(filters?: SiteVisitFilters): Promise<SiteVisit[]> {
  const params = new URLSearchParams()
  if (filters?.engineerId) params.set('engineerId', String(filters.engineerId))
  if (filters?.machineId) params.set('machineId', String(filters.machineId))
  if (filters?.purpose) params.set('purpose', filters.purpose)

  const query = params.toString()
  const res = await apiClient.get<SiteVisit[]>(`/api/v1/site-visits${query ? `?${query}` : ''}`)
  return res.data
}

/** Logs a new site visit. */
export async function logSiteVisit(data: NewSiteVisitData): Promise<SiteVisit> {
  const res = await apiClient.post<SiteVisit>('/api/v1/site-visits', { ...data })
  return res.data
}
