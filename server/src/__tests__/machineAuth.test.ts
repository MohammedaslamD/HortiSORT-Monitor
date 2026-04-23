import type { Request, Response, NextFunction } from 'express'
import { vi, beforeEach, it, expect, describe } from 'vitest'

// Mock prisma before importing the middleware
vi.mock('../utils/prisma.ts', () => ({
  prisma: {
    machineApiKey: {
      findUnique: vi.fn(),
    },
  },
}))

import { machineAuthenticate } from '../middleware/machineAuth.ts'
import { prisma } from '../utils/prisma.ts'

const mockFindUnique = prisma.machineApiKey.findUnique as ReturnType<typeof vi.fn>

function makeReq(key?: string): Request {
  return {
    headers: key ? { 'x-machine-key': key } : {},
  } as unknown as Request
}

function makeRes(): Response {
  return {} as Response
}

describe('machineAuthenticate middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls next(AppError 401) when X-Machine-Key header is missing', async () => {
    const next = vi.fn() as unknown as NextFunction
    await machineAuthenticate(makeReq(), makeRes(), next)
    expect(next).toHaveBeenCalledOnce()
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(err).toBeDefined()
    expect(err.statusCode).toBe(401)
  })

  it('calls next(AppError 401) when api key is not found in DB', async () => {
    mockFindUnique.mockResolvedValue(null)
    const next = vi.fn() as unknown as NextFunction
    await machineAuthenticate(makeReq('unknown-key'), makeRes(), next)
    expect(next).toHaveBeenCalledOnce()
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(err.statusCode).toBe(401)
  })

  it('calls next(AppError 403) when api key is found but is_active is false', async () => {
    mockFindUnique.mockResolvedValue({ is_active: false, machine_id: 1 })
    const next = vi.fn() as unknown as NextFunction
    await machineAuthenticate(makeReq('inactive-key'), makeRes(), next)
    expect(next).toHaveBeenCalledOnce()
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(err.statusCode).toBe(403)
  })

  it('attaches machine_id to req and calls next() with no error on valid active key', async () => {
    mockFindUnique.mockResolvedValue({ is_active: true, machine_id: 42 })
    const next = vi.fn() as unknown as NextFunction
    const req = makeReq('valid-key')
    await machineAuthenticate(req, makeRes(), next)
    expect(next).toHaveBeenCalledWith()
    expect((req as unknown as { machine_id: number }).machine_id).toBe(42)
  })
})
