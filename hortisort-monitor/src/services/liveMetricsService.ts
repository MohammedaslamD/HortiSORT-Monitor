import type { MachineLiveMetrics, FleetSummary, ThroughputPoint } from '../types'
import { MOCK_FLEET_SUMMARY, MOCK_MACHINE_METRICS, generateThroughputSeries } from '../data/mockLiveData'

/**
 * Live fleet metrics service.
 * Mock implementation; future Phase C swaps the bodies for real backend calls.
 */
export const liveMetricsService = {
  async getFleetSummary(): Promise<FleetSummary> {
    return MOCK_FLEET_SUMMARY
  },
  async getMachineMetrics(): Promise<MachineLiveMetrics[]> {
    return MOCK_MACHINE_METRICS
  },
  async getThroughputSeries(now: Date = new Date()): Promise<ThroughputPoint[]> {
    return generateThroughputSeries(now)
  },
}
