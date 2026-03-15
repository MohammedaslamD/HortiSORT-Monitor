import type { ActivityLog } from '../types'
import { MOCK_ACTIVITY_LOG } from '../data/mockData'

/** Returns the most recent activity log entries, sorted by created_at descending. */
export async function getRecentActivity(limit: number): Promise<ActivityLog[]> {
  return [...MOCK_ACTIVITY_LOG]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit)
}
