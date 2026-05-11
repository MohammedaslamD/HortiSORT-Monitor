import type { DailyLog, DailyLogStats } from '../types'

/** ms in 7 days (inclusive: now-6d through now). */
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Pure aggregate over a role-scoped daily-log list.
 *
 * - `logs_this_week` includes any log whose `date` falls within the past
 *   7 days inclusive of today (>= now - 6 days at 00:00).
 * - `running_days`, `maintenance_days`, `not_running_days` count distinct
 *   `(machine_id, date)` pairs per status. Same machine logged twice on
 *   the same day collapses to one day.
 *
 * `now` is injected so callers (and tests) can pin a reference date.
 */
export function computeDailyLogStats(logs: DailyLog[], now: Date = new Date()): DailyLogStats {
  const cutoff = now.getTime() - WEEK_MS + 1
  let logsThisWeek = 0
  const runningPairs = new Set<string>()
  const maintPairs = new Set<string>()
  const notRunningPairs = new Set<string>()
  for (const l of logs) {
    const t = new Date(l.date).getTime()
    if (!Number.isNaN(t) && t >= cutoff) logsThisWeek++
    const key = `${l.machine_id}|${l.date}`
    if (l.status === 'running') runningPairs.add(key)
    else if (l.status === 'maintenance') maintPairs.add(key)
    else if (l.status === 'not_running') notRunningPairs.add(key)
  }
  return {
    logs_this_week: logsThisWeek,
    running_days: runningPairs.size,
    maintenance_days: maintPairs.size,
    not_running_days: notRunningPairs.size,
  }
}
