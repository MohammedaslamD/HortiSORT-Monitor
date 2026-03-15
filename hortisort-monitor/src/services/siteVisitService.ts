import type { SiteVisit } from '../types'
import { MOCK_SITE_VISITS } from '../data/mockData'

/** Returns site visits for a specific machine, sorted by visit_date descending. */
export async function getSiteVisitsByMachineId(machineId: number): Promise<SiteVisit[]> {
  return [...MOCK_SITE_VISITS]
    .filter((v) => v.machine_id === machineId)
    .sort((a, b) => b.visit_date.localeCompare(a.visit_date))
}
