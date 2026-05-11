import type { Alert } from '../types'
import { MOCK_ALERTS } from '../data/mockAlerts'

export const alertService = {
  async getAlerts(): Promise<Alert[]> {
    return [...MOCK_ALERTS].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
  },
}
