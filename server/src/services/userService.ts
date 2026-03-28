import { prisma } from '../utils/prisma.ts'
import { AppError } from '../utils/AppError.ts'
import { logActivity } from './activityLogService.ts'

const userSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  whatsapp_number: true,
  role: true,
  is_active: true,
  created_at: true,
  updated_at: true,
  // password_hash intentionally excluded
} as const

/**
 * Return all users, excluding password_hash.
 */
export async function getUsers() {
  return prisma.user.findMany({
    select: userSelect,
    orderBy: { name: 'asc' },
  })
}

/**
 * Return a single user by ID, excluding password_hash. Throws 404 if not found.
 */
export async function getUserById(id: number) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: userSelect,
  })
  if (!user) throw new AppError(`User ${id} not found`, 404)
  return user
}

/**
 * Toggle a user's is_active flag. Throws 404 if not found.
 * Writes a fire-and-forget activity log entry attributed to callerUserId.
 */
export async function toggleUserActive(id: number, callerUserId: number) {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw new AppError(`User ${id} not found`, 404)

  const updated = await prisma.user.update({
    where: { id },
    data: { is_active: !user.is_active },
    select: userSelect,
  })

  logActivity(callerUserId, 'user_toggled_active', 'user', id, `User ${id} active status toggled`)
  return updated
}
