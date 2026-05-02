import { describe, it, expect } from 'vitest'

import type { SiteVisit } from '../../types'
import { computeSiteVisitStats } from '../siteVisitStats'

const NOW = new Date('2026-04-25T10:00:00Z')

function makeVisit(overrides: Partial<SiteVisit>): SiteVisit {
  return {
    id: 1,
    machine_id: 1,
    engineer_id: 1,
    visit_date: '2026-04-20',
    visit_purpose: 'routine',
    findings: '',
    actions_taken: '',
    created_at: '2026-04-20T10:00:00Z',
    ...overrides,
  }
}

describe('computeSiteVisitStats', () => {
  it('returns all zeros for an empty visit array', () => {
    expect(computeSiteVisitStats([], NOW)).toEqual({
      visits_this_month: 0,
      emergency_count: 0,
      routine_count: 0,
      due_this_week: 0,
    })
  })

  it("counts visits whose visit_date falls within now's calendar month", () => {
    const visits: SiteVisit[] = [
      makeVisit({ id: 1, visit_date: '2026-04-01' }), // April → in
      makeVisit({ id: 2, visit_date: '2026-04-30' }), // April → in
      makeVisit({ id: 3, visit_date: '2026-03-31' }), // March → out
      makeVisit({ id: 4, visit_date: '2026-05-01' }), // May → out
    ]
    expect(computeSiteVisitStats(visits, NOW).visits_this_month).toBe(2)
  })

  it("counts emergency (purpose='ticket') and routine (purpose='routine') separately, excluding installation/training", () => {
    const visits: SiteVisit[] = [
      makeVisit({ id: 1, visit_purpose: 'ticket' }),
      makeVisit({ id: 2, visit_purpose: 'ticket' }),
      makeVisit({ id: 3, visit_purpose: 'routine' }),
      makeVisit({ id: 4, visit_purpose: 'installation' }),
      makeVisit({ id: 5, visit_purpose: 'training' }),
    ]
    const stats = computeSiteVisitStats(visits, NOW)
    expect(stats.emergency_count).toBe(2)
    expect(stats.routine_count).toBe(1)
  })

  it('counts due_this_week as visits with next_visit_due in [now, now+7d), excluding undefined', () => {
    const visits: SiteVisit[] = [
      makeVisit({ id: 1, next_visit_due: '2026-04-25' }), // today → in
      makeVisit({ id: 2, next_visit_due: '2026-04-30' }), // +5d → in
      makeVisit({ id: 3, next_visit_due: '2026-05-02' }), // +7d → out (exclusive)
      makeVisit({ id: 4, next_visit_due: '2026-04-24' }), // yesterday → out
      makeVisit({ id: 5 }), // undefined → out
    ]
    expect(computeSiteVisitStats(visits, NOW).due_this_week).toBe(2)
  })
})
