import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../utils/prisma.ts'
import { AppError } from '../utils/AppError.ts'

// Extend Express Request to carry the authenticated machine id
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      machine_id?: number
    }
  }
}

/**
 * Validates the X-Machine-Key header against machine_api_keys table.
 * Attaches machine_id to req on success.
 */
export async function machineAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const key = req.headers['x-machine-key']
  if (!key || typeof key !== 'string') {
    return next(new AppError('Missing X-Machine-Key header', 401))
  }

  const record = await prisma.machineApiKey.findUnique({ where: { api_key: key } })
  if (!record) {
    return next(new AppError('Invalid machine API key', 401))
  }
  if (!record.is_active) {
    return next(new AppError('Machine API key is inactive', 403))
  }

  req.machine_id = record.machine_id
  next()
}
