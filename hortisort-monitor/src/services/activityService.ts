import type { ActivityEvent } from '../types'
import { MOCK_ACTIVITY } from '../data/mockActivity'

export const activityService = {
  async getActivity(): Promise<ActivityEvent[]> {
    return [...MOCK_ACTIVITY].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
  },
}
