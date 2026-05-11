import bcrypt from 'bcrypt'
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

/**
 * Create a new user with a bcrypt-hashed password. Throws 409 on duplicate email.
 */
export async function createUser(data: {
  name: string
  email: string
  phone: string
  whatsapp_number?: string
  role: 'customer' | 'engineer' | 'admin'
  password: string
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) throw new AppError('Email already in use', 409)
  const password_hash = await bcrypt.hash(data.password, 10)
  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      whatsapp_number: data.whatsapp_number,
      role: data.role,
      password_hash,
    },
    select: userSelect,
  })
}

/**
 * Update a user's name, phone, whatsapp_number and role. Throws 404 if not found.
 */
export async function updateUser(
  id: number,
  data: { name: string; phone: string; whatsapp_number?: string; role: 'customer' | 'engineer' | 'admin' }
) {
  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) throw new AppError('User not found', 404)
  return prisma.user.update({
    where: { id },
    data: {
      name: data.name,
      phone: data.phone,
      whatsapp_number: data.whatsapp_number ?? null,
      role: data.role,
    },
    select: userSelect,
  })
}

/**
 * Assign machines to a customer by setting customer_id on the given machines.
 * Previously-owned machines (not in new list) are NOT reassigned — only the
 * specified machines are set to customer_id = userId.
 */
export async function assignMachinesToUser(
  userId: number,
  machineIds: number[]
): Promise<{ updated: number }> {
  const existing = await prisma.user.findUnique({ where: { id: userId } })
  if (!existing) throw new AppError('User not found', 404)
  if (machineIds.length > 0) {
    await prisma.machine.updateMany({
      where: { id: { in: machineIds } },
      data: { customer_id: userId },
    })
  }
  return { updated: machineIds.length }
}

/**
 * Hard-delete a user. Throws 403 if trying to delete self, 409 if user has
 * associated records (tickets, daily logs, site visits, machines).
 */
export async function deleteUser(
  id: number,
  callerUserId: number
): Promise<{ deleted: boolean }> {
  if (id === callerUserId) throw new AppError('Cannot delete your own account', 403)
  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) throw new AppError('User not found', 404)

  const [ticketCount, logCount, visitCount, machineCount] = await Promise.all([
    prisma.ticket.count({ where: { OR: [{ raised_by: id }, { assigned_to: id }] } }),
    prisma.dailyLog.count({ where: { updated_by: id } }),
    prisma.siteVisit.count({ where: { engineer_id: id } }),
    prisma.machine.count({ where: { OR: [{ customer_id: id }, { engineer_id: id }] } }),
  ])
  if (ticketCount + logCount + visitCount + machineCount > 0) {
    throw new AppError('Cannot delete — user has existing records. Deactivate instead.', 409)
  }

  await prisma.user.delete({ where: { id } })
  return { deleted: true }
}
