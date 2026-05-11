import type { SiteVisit, SiteVisitStats } from '../types'

/** Strip time-of-day from a `Date`, returning UTC midnight ms. */
function toUtcMidnight(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Pure aggregation over a `SiteVisit[]` for the four Phase B
 * SiteVisitsPage stat cards. `now` is injected for deterministic
 * tests (defaults to `new Date()` in production callers).
 *
 * - `visits_this_month` — visits whose `visit_date` falls in the
 *   same UTC calendar year + month as `now`.
 * - `emergency_count` — visits with `visit_purpose === 'ticket'`.
 * - `routine_count` — visits with `visit_purpose === 'routine'`.
 * - `due_this_week` — visits whose `next_visit_due` (compared at
 *   day granularity) is within `[today, today + 7d)`. Undefined
 *   `next_visit_due` is excluded.
 */
export function computeSiteVisitStats(
  visits: SiteVisit[],
  now: Date = new Date(),
): SiteVisitStats {
  const nowYear = now.getUTCFullYear()
  const nowMonth = now.getUTCMonth()
  const todayMs = toUtcMidnight(now)
  const weekCutoffMs = todayMs + 7 * DAY_MS

  let visitsThisMonth = 0
  let emergencyCount = 0
  let routineCount = 0
  let dueThisWeek = 0

  for (const v of visits) {
    const visitDate = new Date(v.visit_date)
    if (
      !Number.isNaN(visitDate.getTime()) &&
      visitDate.getUTCFullYear() === nowYear &&
      visitDate.getUTCMonth() === nowMonth
    ) {
      visitsThisMonth++
    }

    if (v.visit_purpose === 'ticket') emergencyCount++
    else if (v.visit_purpose === 'routine') routineCount++

    if (v.next_visit_due) {
      const due = new Date(v.next_visit_due)
      if (!Number.isNaN(due.getTime())) {
        const dueMid = toUtcMidnight(due)
        if (dueMid >= todayMs && dueMid < weekCutoffMs) dueThisWeek++
      }
    }
  }

  return {
    visits_this_month: visitsThisMonth,
    emergency_count: emergencyCount,
    routine_count: routineCount,
    due_this_week: dueThisWeek,
  }
}
