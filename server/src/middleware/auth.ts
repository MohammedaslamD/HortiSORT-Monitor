import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/AppError.ts'
import { verifyAccessToken, type JwtPayload } from '../utils/jwt.ts'

// Extend Express Request to carry the authenticated user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

/**
 * Verifies the Bearer token from the Authorization header.
 * Attaches decoded payload to req.user on success.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('No token provided', 401))
  }

  const token = authHeader.slice(7)
  try {
    req.user = verifyAccessToken(token)
    next()
  } catch {
    next(new AppError('Invalid or expired token', 401))
  }
}

/**
 * Role guard — must be used after authenticate middleware.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401))
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Forbidden: insufficient role', 403))
    }
    next()
  }
}
