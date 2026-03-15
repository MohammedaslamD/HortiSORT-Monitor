import { describe, it, expect } from 'vitest'
import { getMachines } from '../machineService'

describe('getMachines', () => {
  it('should return all 12 machines when no filters are provided', async () => {
    const machines = await getMachines()
    expect(machines).toHaveLength(12)
  })

  it('should filter by status', async () => {
    const machines = await getMachines({ status: 'running' })
    expect(machines).toHaveLength(6)
  })

  it('should filter by model', async () => {
    const machines = await getMachines({ model: 'HS-300' })
    expect(machines).toHaveLength(4)
  })
})
