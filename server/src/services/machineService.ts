import { prisma } from '../utils/prisma.ts'
import { AppError } from '../utils/AppError.ts'
import { logActivity } from './activityLogService.ts'
import type { MachineStatus } from '@prisma/client'

interface AuthUser {
  id: number
  role: 'customer' | 'engineer' | 'admin'
}

interface MachineFilters {
  status?: MachineStatus
  model?: string
  city?: string
  search?: string
  limit?: number
}

const machineInclude = {
  customer: { select: { name: true } },
  engineer: { select: { name: true } },
} as const

/**
 * Return machines role-scoped to the requesting user, with optional filters.
 */
export async function getMachines(filters: MachineFilters, user: AuthUser) {
  const roleWhere =
    user.role === 'customer'
      ? { customer_id: user.id }
      : user.role === 'engineer'
        ? { engineer_id: user.id }
        : {}

  const searchWhere = filters.search
    ? {
        OR: [
          { machine_code: { contains: filters.search, mode: 'insensitive' as const } },
          { machine_name: { contains: filters.search, mode: 'insensitive' as const } },
          { city: { contains: filters.search, mode: 'insensitive' as const } },
          { state: { contains: filters.search, mode: 'insensitive' as const } },
        ],
      }
    : {}

  return prisma.machine.findMany({
    where: {
      ...roleWhere,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.model ? { model: filters.model } : {}),
      ...(filters.city ? { city: { equals: filters.city, mode: 'insensitive' as const } } : {}),
      ...searchWhere,
      is_active: true,
    },
    include: machineInclude,
    ...(filters.limit ? { take: filters.limit } : {}),
  })
}

/**
 * Return a single machine by ID, including customer, engineer, and last_updated_user names.
 */
export async function getMachineById(id: number) {
  const machine = await prisma.machine.findUnique({
    where: { id },
    include: {
      customer: { select: { name: true } },
      engineer: { select: { name: true } },
      last_updated_user: { select: { name: true } },
    },
  })
  if (!machine) throw new AppError(`Machine ${id} not found`, 404)
  return machine
}

/**
 * Return aggregated machine status counts, role-scoped.
 */
export async function getMachineStats(user: AuthUser) {
  const roleWhere =
    user.role === 'customer'
      ? { customer_id: user.id }
      : user.role === 'engineer'
        ? { engineer_id: user.id }
        : {}

  const groups = await prisma.machine.groupBy({
    by: ['status'],
    where: { ...roleWhere, is_active: true },
    _count: { id: true },
  })

  const counts: Record<string, number> = { running: 0, idle: 0, down: 0, offline: 0 }
  for (const g of groups) {
    counts[g.status] = g._count.id
  }

  return {
    running: counts.running,
    idle: counts.idle,
    down: counts.down,
    offline: counts.offline,
    total: counts.running + counts.idle + counts.down + counts.offline,
  }
}

/**
 * Update a machine's status, auto-record a MachineHistory row, and write
 * a fire-and-forget activity log entry.
 */
export async function updateMachineStatus(
  id: number,
  status: MachineStatus,
  userId: number,
) {
  const machine = await prisma.machine.findUnique({ where: { id } })
  if (!machine) throw new AppError(`Machine ${id} not found`, 404)

  const [updated] = await prisma.$transaction([
    prisma.machine.update({
      where: { id },
      data: {
        status,
        last_updated: new Date(),
        last_updated_by: userId,
      },
    }),
    prisma.machineHistory.create({
      data: {
        machine_id: id,
        change_type: 'status_change',
        old_value: machine.status,
        new_value: status,
        changed_by: userId,
      },
    }),
  ])

  logActivity(
    userId,
    'status_updated',
    'machine',
    id,
    `Machine status changed from ${machine.status} to ${status}`,
  )

  return updated
}
