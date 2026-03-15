import { apiClient } from './apiClient'
import type { ActivityLog } from '../types'

/** Returns the most recent activity log entries, sorted by created_at descending. */
export async function getRecentActivity(limit: number): Promise<ActivityLog[]> {
  const res = await apiClient.get<ActivityLog[]>(`/api/v1/activity-log?limit=${limit}`)
  return res.data
}
