import bcrypt from 'bcrypt'
import { prisma } from '../utils/prisma.ts'
import { AppError } from '../utils/AppError.ts'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.ts'
import type { User } from '@prisma/client'

// Fields returned to clients — never expose password_hash
type SafeUser = Omit<User, 'password_hash'>

/**
 * Authenticates a user by email + password.
 * Returns the user (without password_hash) and signed JWT tokens.
 */
export async function login(
  email: string,
  password: string,
): Promise<{ user: SafeUser; accessToken: string; refreshToken: string }> {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw new AppError('Invalid email or password', 401)
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash)
  if (!passwordMatch) {
    throw new AppError('Invalid email or password', 401)
  }

  if (!user.is_active) {
    throw new AppError('Account is deactivated', 403)
  }

  const payload = { userId: user.id, email: user.email, role: user.role }
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash: _pw, ...safeUser } = user
  return { user: safeUser, accessToken, refreshToken }
}

/**
 * Returns a user by ID without password_hash.
 */
export async function getUserById(id: number): Promise<SafeUser> {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    throw new AppError('User not found', 404)
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash: _pw, ...safeUser } = user
  return safeUser
}

/**
 * Verifies a refresh token and issues a new access token.
 */
export async function refreshAccessToken(
  token: string,
): Promise<{ accessToken: string }> {
  let payload
  try {
    payload = verifyRefreshToken(token)
  } catch {
    throw new AppError('Invalid or expired refresh token', 401)
  }

  // Verify user still exists and is active
  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user || !user.is_active) {
    throw new AppError('User not found or deactivated', 401)
  }

  const accessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role })
  return { accessToken }
}
