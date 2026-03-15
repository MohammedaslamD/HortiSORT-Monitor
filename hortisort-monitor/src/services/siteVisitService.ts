import type { SiteVisit, SiteVisitFilters, NewSiteVisitData } from '../types'
import { MOCK_SITE_VISITS } from '../data/mockData'

/** Returns site visits for a specific machine, sorted by visit_date descending. */
export async function getSiteVisitsByMachineId(machineId: number): Promise<SiteVisit[]> {
  return [...MOCK_SITE_VISITS]
    .filter((v) => v.machine_id === machineId)
    .sort((a, b) => b.visit_date.localeCompare(a.visit_date))
}

/** Returns all site visits, optionally filtered. Sorted by visit_date descending. */
export async function getAllSiteVisits(filters?: SiteVisitFilters): Promise<SiteVisit[]> {
  let result = [...MOCK_SITE_VISITS]

  if (filters?.engineerId) {
    result = result.filter((v) => v.engineer_id === filters.engineerId)
  }

  if (filters?.machineId) {
    result = result.filter((v) => v.machine_id === filters.machineId)
  }

  if (filters?.purpose) {
    result = result.filter((v) => v.visit_purpose === filters.purpose)
  }

  return result.sort((a, b) => b.visit_date.localeCompare(a.visit_date))
}

/** Logs a new site visit. Auto-generates id and created_at. */
export async function logSiteVisit(data: NewSiteVisitData): Promise<SiteVisit> {
  const now = new Date().toISOString()
  const visit: SiteVisit = {
    id: MOCK_SITE_VISITS.length + 1,
    ...data,
    created_at: now,
  }
  MOCK_SITE_VISITS.push(visit)
  return visit
}
