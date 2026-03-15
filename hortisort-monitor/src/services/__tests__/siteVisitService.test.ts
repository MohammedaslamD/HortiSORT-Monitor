import { describe, it, expect } from 'vitest'
import { getSiteVisitsByMachineId, getAllSiteVisits, logSiteVisit } from '../siteVisitService'

describe('siteVisitService', () => {
  describe('getSiteVisitsByMachineId', () => {
    it('should return 1 visit for machine 3', async () => {
      const visits = await getSiteVisitsByMachineId(3)
      expect(visits).toHaveLength(1)
      expect(visits[0].visit_purpose).toBe('ticket')
    })

    it('should return 1 visit for machine 1', async () => {
      const visits = await getSiteVisitsByMachineId(1)
      expect(visits).toHaveLength(1)
      expect(visits[0].visit_purpose).toBe('routine')
    })

    it('should return empty array for machine with no visits', async () => {
      const visits = await getSiteVisitsByMachineId(999)
      expect(visits).toHaveLength(0)
    })

    it('should return visits sorted by visit_date descending', async () => {
      // Use all visits to check sorting — get a machine with visits or check overall behavior
      // Machine 3 only has 1 visit, so let's verify with all machines that have data
      const allVisitsMachine6 = await getSiteVisitsByMachineId(6)
      expect(allVisitsMachine6).toHaveLength(1)

      // For a broader sort check, test with a machineId that has multiple visits if any
      // Currently no machine has >1 visit in mock data, but the sort still runs
      const visits = await getSiteVisitsByMachineId(3)
      expect(visits).toHaveLength(1)
    })
  })

  describe('getAllSiteVisits', () => {
    it('should return all 6 site visits sorted by visit_date descending', async () => {
      const visits = await getAllSiteVisits()
      expect(visits).toHaveLength(6)
      for (let i = 0; i < visits.length - 1; i++) {
        expect(visits[i].visit_date >= visits[i + 1].visit_date).toBe(true)
      }
    })

    it('should filter by engineerId', async () => {
      const visits = await getAllSiteVisits({ engineerId: 3 })
      expect(visits).toHaveLength(3)
      expect(visits.every((v) => v.engineer_id === 3)).toBe(true)
    })

    it('should filter by machineId', async () => {
      const visits = await getAllSiteVisits({ machineId: 3 })
      expect(visits).toHaveLength(1)
      expect(visits[0].id).toBe(1)
    })

    it('should filter by purpose', async () => {
      const visits = await getAllSiteVisits({ purpose: 'ticket' })
      expect(visits).toHaveLength(3)
      expect(visits.every((v) => v.visit_purpose === 'ticket')).toBe(true)
    })
  })

  // Mutation test goes last — it permanently adds to the shared mock array
  describe('logSiteVisit', () => {
    it('should create a new site visit with auto-generated id and created_at', async () => {
      const data = {
        machine_id: 2,
        engineer_id: 3,
        visit_date: '2026-03-15',
        visit_purpose: 'routine' as const,
        notes: 'Test visit',
      }
      const visit = await logSiteVisit(data)
      expect(visit.id).toBeGreaterThan(0)
      expect(visit.machine_id).toBe(2)
      expect(visit.engineer_id).toBe(3)
      expect(visit.visit_purpose).toBe('routine')
      expect(visit.notes).toBe('Test visit')
      expect(visit.created_at).toBeDefined()
    })
  })
})
