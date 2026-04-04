import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth.ts'
import { validate } from '../middleware/validate.ts'
import { getUsers, getUserById, toggleUserActive, createUser, updateUser, assignMachinesToUser, deleteUser } from '../services/userService.ts'
import { createUserSchema, updateUserSchema, assignMachinesSchema } from '../schemas/users.ts'

export const usersRouter = Router()

// GET /users
usersRouter.get('/', authenticate, requireRole('admin'), async (_req, res, next) => {
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

// PATCH /users/:id/machines — must be declared before PATCH /:id to avoid route conflicts
usersRouter.patch(
  '/:id/machines',
  authenticate,
  requireRole('admin'),
  validate(assignMachinesSchema),
  async (req, res, next) => {
    try {
      const result = await assignMachinesToUser(Number(req.params.id), req.body.machine_ids)
      res.json({ data: result })
    } catch (err) {
      next(err)
    }
  }
)

// POST /users
usersRouter.post(
  '/',
  authenticate,
  requireRole('admin'),
  validate(createUserSchema),
  async (req, res, next) => {
    try {
      const user = await createUser(req.body)
      res.status(201).json({ data: user })
    } catch (err) {
      next(err)
    }
  }
)

// PATCH /users/:id
usersRouter.patch(
  '/:id',
  authenticate,
  requireRole('admin'),
  validate(updateUserSchema),
  async (req, res, next) => {
    try {
      const user = await updateUser(Number(req.params.id), req.body)
      res.json({ data: user })
    } catch (err) {
      next(err)
    }
  }
)

// DELETE /users/:id
usersRouter.delete(
  '/:id',
  authenticate,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const result = await deleteUser(Number(req.params.id), req.user!.userId)
      res.json({ data: result })
    } catch (err) {
      next(err)
    }
  }
)
