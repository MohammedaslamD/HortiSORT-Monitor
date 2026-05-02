import { apiClient } from './apiClient'
import { MOCK_ACTIVITY_LOG } from '../data/mockData'
import type { ActivityLog } from '../types'

/** Returns the most recent activity log entries. */
export async function getRecentActivity(limit: number): Promise<ActivityLog[]> {
  try {
    const res = await apiClient.get<ActivityLog[]>(`/api/v1/activity-log?limit=${limit}`)
    return res.data
  } catch { return MOCK_ACTIVITY_LOG.slice(0, limit) }
}
