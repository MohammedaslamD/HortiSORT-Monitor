import { prisma } from '../utils/prisma.ts'
import { AppError } from '../utils/AppError.ts'
import { logActivity } from './activityLogService.ts'
import type { TicketStatus, TicketSeverity, TicketCategory } from '@prisma/client'

interface AuthUser {
  id: number
  role: 'customer' | 'engineer' | 'admin'
}

interface TicketFilters {
  status?: TicketStatus
  severity?: TicketSeverity
  category?: TicketCategory
  machineId?: number
  assignedTo?: number
  raisedBy?: number
  limit?: number
  sort?: string
}

interface CreateTicketData {
  machine_id: number
  severity: TicketSeverity
  category: TicketCategory
  title: string
  description: string
}

interface ResolveTicketData {
  root_cause: string
  solution: string
  parts_used?: string
}

const SLA_HOURS: Record<TicketSeverity, number> = {
  P1_critical: 4,
  P2_high: 8,
  P3_medium: 24,
  P4_low: 72,
}

/**
 * Return tickets role-scoped to the requesting user with optional filters.
 */
export async function getTickets(
  filters: TicketFilters,
  user: AuthUser,
) {
  const roleWhere =
    user.role === 'customer'
      ? {
          OR: [
            { raised_by: user.id },
            { machine: { customer_id: user.id } },
          ],
        }
      : user.role === 'engineer'
        ? {
            OR: [
              { assigned_to: user.id },
              { raised_by: user.id },
            ],
          }
        : {}

  return prisma.ticket.findMany({
    where: {
      ...roleWhere,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.severity ? { severity: filters.severity } : {}),
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.machineId ? { machine_id: filters.machineId } : {}),
      ...(filters.assignedTo ? { assigned_to: filters.assignedTo } : {}),
      ...(filters.raisedBy ? { raised_by: filters.raisedBy } : {}),
    },
    include: {
      machine: { select: { machine_code: true, machine_name: true } },
      raised_by_user: { select: { name: true } },
      assigned_to_user: { select: { name: true } },
    },
    orderBy: { created_at: 'desc' },
    ...(filters.limit ? { take: filters.limit } : {}),
  })
}

/**
 * Return a single ticket by ID with comments (including commenter names).
 */
export async function getTicketById(id: number) {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      machine: { select: { machine_code: true, machine_name: true } },
      raised_by_user: { select: { name: true } },
      assigned_to_user: { select: { name: true } },
      comments: {
        include: { user: { select: { name: true } } },
        orderBy: { created_at: 'asc' },
      },
    },
  })
  if (!ticket) throw new AppError(`Ticket ${id} not found`, 404)
  return ticket
}

/**
 * Create a new ticket. Auto-assigns to the machine's engineer_id. SLA is set from severity.
 */
export async function createTicket(data: CreateTicketData, userId: number) {
  const machine = await prisma.machine.findUnique({ where: { id: data.machine_id } })
  if (!machine) throw new AppError(`Machine ${data.machine_id} not found`, 404)

  const ticket_number = `TKT-${Date.now()}`
  const ticket = await prisma.ticket.create({
    data: {
      ticket_number,
      machine_id: data.machine_id,
      raised_by: userId,
      assigned_to: machine.engineer_id,
      severity: data.severity,
      category: data.category,
      title: data.title,
      description: data.description,
      sla_hours: SLA_HOURS[data.severity],
    },
  })

  logActivity(userId, 'ticket_created', 'ticket', ticket.id, `Ticket ${ticket.ticket_number} created`)
  return ticket
}

/**
 * Update ticket status. If status is reopened, increment reopen_count and set reopened_at.
 */
export async function updateTicketStatus(
  id: number,
  status: TicketStatus,
  userId: number,
) {
  const ticket = await prisma.ticket.findUnique({ where: { id } })
  if (!ticket) throw new AppError(`Ticket ${id} not found`, 404)

  const extraData =
    status === 'reopened'
      ? { reopen_count: { increment: 1 }, reopened_at: new Date() }
      : {}

  const updated = await prisma.ticket.update({
    where: { id },
    data: { status, ...extraData },
  })

  logActivity(userId, 'status_updated', 'ticket', id, `Ticket status changed to ${status}`)
  return updated
}

/**
 * Resolve a ticket: set status to resolved, record resolution details and timing.
 */
export async function resolveTicket(
  id: number,
  data: ResolveTicketData,
  userId: number,
) {
  const ticket = await prisma.ticket.findUnique({ where: { id } })
  if (!ticket) throw new AppError(`Ticket ${id} not found`, 404)

  const resolution_time_mins = Math.round(
    (Date.now() - ticket.created_at.getTime()) / 60000,
  )

  const resolved = await prisma.ticket.update({
    where: { id },
    data: {
      status: 'resolved',
      root_cause: data.root_cause,
      solution: data.solution,
      parts_used: data.parts_used ?? null,
      resolved_at: new Date(),
      resolution_time_mins,
    },
  })

  logActivity(userId, 'ticket_resolved', 'ticket', id, `Ticket resolved`)
  return resolved
}

/**
 * Return ticket open/active counts and breakdown by severity, role-scoped.
 */
export async function getTicketStats(user: AuthUser) {
  const roleWhere =
    user.role === 'customer'
      ? {
          OR: [
            { raised_by: user.id },
            { machine: { customer_id: user.id } },
          ],
        }
      : user.role === 'engineer'
        ? {
            OR: [
              { assigned_to: user.id },
              { raised_by: user.id },
            ],
          }
        : {}

  const openGroups = await prisma.ticket.groupBy({
    by: ['severity'],
    where: {
      ...roleWhere,
      status: { in: ['open', 'in_progress', 'reopened'] },
    },
    _count: { id: true },
  })

  const bySeverity: Record<string, number> = {
    P1_critical: 0,
    P2_high: 0,
    P3_medium: 0,
    P4_low: 0,
  }
  let open = 0
  for (const g of openGroups) {
    bySeverity[g.severity] = g._count.id
    open += g._count.id
  }

  return { open, bySeverity }
}

/**
 * Add a comment to a ticket.
 */
export async function addComment(
  ticketId: number,
  userId: number,
  data: { message: string; attachment_url?: string | null },
) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) throw new AppError(`Ticket ${ticketId} not found`, 404)

  return prisma.ticketComment.create({
    data: {
      ticket_id: ticketId,
      user_id: userId,
      message: data.message,
      attachment_url: data.attachment_url ?? null,
    },
  })
}
