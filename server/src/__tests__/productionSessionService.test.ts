import { vi, beforeEach, it, expect, describe } from 'vitest'
import type { Decimal } from '@prisma/client/runtime/library'

vi.mock('../utils/prisma.ts', () => ({
  prisma: {
    productionSession: {
      upsert: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

import {
  upsertSession,
  getTodaySessionsByMachineId,
  getRunningMachineCount,
} from '../services/productionSessionService.ts'
import { prisma } from '../utils/prisma.ts'

const mockUpsert = prisma.productionSession.upsert as ReturnType<typeof vi.fn>
const mockFindMany = prisma.productionSession.findMany as ReturnType<typeof vi.fn>
const mockCount = prisma.productionSession.count as ReturnType<typeof vi.fn>

const SESSION = {
  id: 1,
  machine_id: 1,
  lot_number: 1,
  session_date: new Date('2026-04-23'),
  start_time: new Date('2026-04-23T06:00:00Z'),
  stop_time: null,
  fruit_type: 'Mango',
  quantity_kg: 500 as unknown as Decimal,
  status: 'running',
  raw_tdms_rows: null,
  created_at: new Date(),
  updated_at: new Date(),
}

describe('productionSessionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('upsertSession', () => {
    it('calls prisma.productionSession.upsert with correct unique key', async () => {
      mockUpsert.mockResolvedValue(SESSION)
      await upsertSession(1, {
        lot_number: 1,
        session_date: '2026-04-23',
        start_time: '2026-04-23T06:00:00Z',
        stop_time: null,
        fruit_type: 'Mango',
        quantity_kg: 500,
        status: 'running',
        raw_tdms_rows: null,
      })
      expect(mockUpsert).toHaveBeenCalledOnce()
      const call = mockUpsert.mock.calls[0][0]
      expect(call.where.machine_id_session_date_lot_number).toEqual({
        machine_id: 1,
        session_date: new Date('2026-04-23'),
        lot_number: 1,
      })
    })

    it('returns the upserted session', async () => {
      mockUpsert.mockResolvedValue(SESSION)
      const result = await upsertSession(1, {
        lot_number: 1,
        session_date: '2026-04-23',
        start_time: '2026-04-23T06:00:00Z',
        stop_time: null,
        fruit_type: null,
        quantity_kg: null,
        status: 'running',
        raw_tdms_rows: null,
      })
      expect(result).toBe(SESSION)
    })
  })

  describe('getTodaySessionsByMachineId', () => {
    it('queries with machine_id and today date', async () => {
      mockFindMany.mockResolvedValue([SESSION])
      const result = await getTodaySessionsByMachineId(1, '2026-04-23')
      expect(mockFindMany).toHaveBeenCalledOnce()
      const call = mockFindMany.mock.calls[0][0]
      expect(call.where.machine_id).toBe(1)
      expect(call.where.session_date).toEqual(new Date('2026-04-23'))
      expect(result).toEqual([SESSION])
    })
  })

  describe('getRunningMachineCount', () => {
    it('counts distinct machines with status=running for today', async () => {
      mockCount.mockResolvedValue(3)
      const result = await getRunningMachineCount('2026-04-23')
      expect(mockCount).toHaveBeenCalledOnce()
      const call = mockCount.mock.calls[0][0]
      expect(call.where.status).toBe('running')
      expect(call.where.session_date).toEqual(new Date('2026-04-23'))
      expect(result).toBe(3)
    })
  })
})
