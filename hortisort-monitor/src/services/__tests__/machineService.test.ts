import { describe, it, expect } from 'vitest'
import { getMachines, getMachineById, getMachineStats, getMachinesByRole } from '../machineService'

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

  it('should filter by city (case-insensitive)', async () => {
    const machines = await getMachines({ city: 'pune' })
    expect(machines).toHaveLength(1)
    expect(machines[0].city).toBe('Pune')
  })

  it('should filter by search (partial, case-insensitive)', async () => {
    // Search by machine_code prefix
    const byCode = await getMachines({ search: 'HS-2024' })
    expect(byCode).toHaveLength(5)

    // Search by city
    const byCity = await getMachines({ search: 'chennai' })
    expect(byCity).toHaveLength(1)
    expect(byCity[0].id).toBe(7)

    // Search by state (ids 1-5 + id 12 Nagpur are in Maharashtra)
    const byState = await getMachines({ search: 'maharashtra' })
    expect(byState).toHaveLength(6)

    // Search by machine_name (ids 1, 3, 11 all named "HortiSort Pro 500")
    const byName = await getMachines({ search: 'HortiSort Pro 500' })
    expect(byName).toHaveLength(3)
  })

  it('should combine filters (status + model)', async () => {
    const machines = await getMachines({ status: 'running', model: 'HS-300' })
    // HS-300 machines: ids 2,4,7,10. Running: ids 2,7. So 2 matches.
    expect(machines).toHaveLength(2)
    machines.forEach((m) => {
      expect(m.status).toBe('running')
      expect(m.model).toBe('HS-300')
    })
  })
})

describe('getMachineById', () => {
  it('should return the machine when found', async () => {
    const machine = await getMachineById(1)
    expect(machine).toBeDefined()
    expect(machine!.id).toBe(1)
    expect(machine!.machine_code).toBe('HS-2024-0001')
  })

  it('should return undefined when not found', async () => {
    const machine = await getMachineById(999)
    expect(machine).toBeUndefined()
  })
})

describe('getMachineStats', () => {
  it('should compute correct stats for all machines', async () => {
    const machines = await getMachines()
    const stats = getMachineStats(machines)

    expect(stats).toEqual({
      total: 12,
      running: 6,
      idle: 2,
      down: 2,
      offline: 2,
    })
  })

  it('should compute stats for a filtered subset', async () => {
    const machines = await getMachines({ model: 'HS-300' })
    const stats = getMachineStats(machines)

    expect(stats.total).toBe(4)
    // HS-300 ids: 2(running), 4(idle), 7(running), 10(idle)
    expect(stats.running).toBe(2)
    expect(stats.idle).toBe(2)
    expect(stats.down).toBe(0)
    expect(stats.offline).toBe(0)
  })

  it('should return all zeros for an empty array', () => {
    const stats = getMachineStats([])

    expect(stats).toEqual({
      total: 0,
      running: 0,
      idle: 0,
      down: 0,
      offline: 0,
    })
  })
})

describe('getMachinesByRole', () => {
  it('should return only customer-owned machines for customer role', async () => {
    const machines = await getMachinesByRole('customer', 1)
    expect(machines).toHaveLength(5)
    machines.forEach((m) => expect(m.customer_id).toBe(1))
  })

  it('should return only assigned machines for engineer role', async () => {
    const machines = await getMachinesByRole('engineer', 3)
    expect(machines).toHaveLength(6)
    machines.forEach((m) => expect(m.engineer_id).toBe(3))
  })

  it('should return all machines for admin role', async () => {
    const machines = await getMachinesByRole('admin', 5)
    expect(machines).toHaveLength(12)
  })

  it('should return empty array for customer with no machines', async () => {
    const machines = await getMachinesByRole('customer', 999)
    expect(machines).toHaveLength(0)
  })
})
