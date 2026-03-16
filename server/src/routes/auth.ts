import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { validate } from '../middleware/validate.ts'
import { authenticate } from '../middleware/auth.ts'
import { loginSchema } from '../schemas/auth.ts'
import * as authService from '../services/authService.ts'

export const authRouter = Router()

const REFRESH_COOKIE = 'refresh_token'
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
}

// POST /api/v1/auth/login
authRouter.post(
  '/login',
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body as { email: string; password: string }
      const { user, accessToken, refreshToken } = await authService.login(email, password)
      res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS)
      // Also return refreshToken in the body so per-tab sessionStorage can be used
      res.json({ data: { accessToken, refreshToken, user } })
    } catch (err) {
      next(err)
    }
  },
)

// POST /api/v1/auth/logout
authRouter.post(
  '/logout',
  authenticate,
  (_req: Request, res: Response): void => {
    res.clearCookie(REFRESH_COOKIE, { httpOnly: true, sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', secure: process.env.NODE_ENV === 'production' })
    res.json({ data: { message: 'Logged out' } })
  },
)

// GET /api/v1/auth/me
authRouter.get(
  '/me',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await authService.getUserById(req.user!.userId)
      res.json({ data: user })
    } catch (err) {
      next(err)
    }
  },
)

// POST /api/v1/auth/refresh
authRouter.post(
  '/refresh',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Accept refresh token from request body (per-tab sessionStorage) or httpOnly cookie
      const token = (req.body as { refreshToken?: string }).refreshToken ?? req.cookies[REFRESH_COOKIE] as string | undefined
      if (!token) {
        res.status(401).json({ error: 'No refresh token' })
        return
      }
      const { accessToken } = await authService.refreshAccessToken(token)
      res.json({ data: { accessToken } })
    } catch (err) {
      next(err)
    }
  },
)
