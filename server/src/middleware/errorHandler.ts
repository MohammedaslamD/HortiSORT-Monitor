import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { PrismaClientInitializationError } from '@prisma/client/runtime/library.js'
import { AppError } from '../utils/AppError.ts'

/**
 * Central error handler. Maps operational errors, Zod validation errors,
 * Prisma known errors, and unknown errors to appropriate HTTP responses.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message })
    return
  }

  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation error', details: err.errors })
    return
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'A record with that value already exists' })
      return
    }
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Record not found' })
      return
    }
  }

  if (err instanceof PrismaClientInitializationError) {
    res.status(503).json({ error: 'Database unavailable' })
    return
  }

  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
}
