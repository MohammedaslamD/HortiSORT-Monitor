import { vi, beforeEach, it, expect, describe } from 'vitest'

vi.mock('../utils/prisma.ts', () => ({
  prisma: {
    machineError: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

import { createError, getTodayErrors } from '../services/machineErrorService.ts'
import { prisma } from '../utils/prisma.ts'

const mockCreate = prisma.machineError.create as ReturnType<typeof vi.fn>
const mockFindMany = prisma.machineError.findMany as ReturnType<typeof vi.fn>

const ERROR_RECORD = {
  id: 1,
  machine_id: 1,
  occurred_at: new Date('2026-04-23T08:00:00Z'),
  error_code: 'ERR_LANE',
  message: 'Lane 3 blocked',
  raw_line: null,
  created_at: new Date(),
}

describe('machineErrorService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createError', () => {
    it('calls prisma.machineError.create with machine_id and data', async () => {
      mockCreate.mockResolvedValue(ERROR_RECORD)
      await createError(1, {
        occurred_at: '2026-04-23T08:00:00Z',
        error_code: 'ERR_LANE',
        message: 'Lane 3 blocked',
        raw_line: null,
      })
      expect(mockCreate).toHaveBeenCalledOnce()
      const call = mockCreate.mock.calls[0][0]
      expect(call.data.machine_id).toBe(1)
      expect(call.data.error_code).toBe('ERR_LANE')
    })

    it('returns the created error record', async () => {
      mockCreate.mockResolvedValue(ERROR_RECORD)
      const result = await createError(1, {
        occurred_at: '2026-04-23T08:00:00Z',
        error_code: null,
        message: null,
        raw_line: null,
      })
      expect(result).toBe(ERROR_RECORD)
    })
  })

  describe('getTodayErrors', () => {
    it('queries machine_id and date range for the given date', async () => {
      mockFindMany.mockResolvedValue([ERROR_RECORD])
      const result = await getTodayErrors(1, '2026-04-23')
      expect(mockFindMany).toHaveBeenCalledOnce()
      const call = mockFindMany.mock.calls[0][0]
      expect(call.where.machine_id).toBe(1)
      expect(result).toEqual([ERROR_RECORD])
    })
  })
})
