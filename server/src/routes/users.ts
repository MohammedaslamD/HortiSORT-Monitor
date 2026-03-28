import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth.ts'
import { getUsers, getUserById, toggleUserActive } from '../services/userService.ts'

export const usersRouter = Router()

// GET /users
usersRouter.get('/', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const users = await getUsers()
    res.json({ data: users })
  } catch (err) {
    next(err)
  }
})

// GET /users/:id
usersRouter.get('/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const user = await getUserById(Number(req.params.id))
    res.json({ data: user })
  } catch (err) {
    next(err)
  }
})

// PATCH /users/:id/active
usersRouter.patch('/:id/active', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const user = await toggleUserActive(Number(req.params.id), req.user!.userId)
    res.json({ data: user })
  } catch (err) {
    next(err)
  }
})
