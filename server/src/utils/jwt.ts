import jwt from 'jsonwebtoken'
import { env } from '../config/env.ts'

export interface JwtPayload {
  userId: number
  email: string
  role: string
}

/**
 * Signs a short-lived access token (15 minutes).
 */
export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '15m' })
}

/**
 * Signs a long-lived refresh token (7 days).
 */
export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' })
}

/**
 * Verifies an access token and returns the decoded payload.
 * Throws if the token is invalid or expired.
 */
export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload
}

/**
 * Verifies a refresh token and returns the decoded payload.
 * Throws if the token is invalid or expired.
 */
export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload
}
