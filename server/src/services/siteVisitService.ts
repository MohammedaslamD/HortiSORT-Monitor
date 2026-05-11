import { prisma } from '../utils/prisma.ts'
import { logActivity } from './activityLogService.ts'
import type { VisitPurpose } from '@prisma/client'

interface AuthUser {
  id: number
  role: 'customer' | 'engineer' | 'admin'
}

interface SiteVisitFilters {
  engineerId?: number
  machineId?: number
  purpose?: VisitPurpose
  limit?: number
  sort?: string
}

interface CreateSiteVisitData {
  machine_id: number
  engineer_id: number
  visit_date: string
  visit_purpose: VisitPurpose
  ticket_id?: number
  findings: string
  actions_taken: string
  parts_replaced?: string
  next_visit_due?: string
}

/**
 * Return site visits role-scoped to the requesting user, with optional filters.
 * Customer → visits for machines they own; engineer → their own visits; admin → all.
 */
export async function getSiteVisits(
  filters: SiteVisitFilters,
  user: AuthUser,
) {
  const roleWhere =
    user.role === 'customer'
      ? { machine: { customer_id: user.id } }
      : user.role === 'engineer'
        ? { engineer_id: user.id }
        : {}

  return prisma.siteVisit.findMany({
    where: {
      ...roleWhere,
      ...(filters.engineerId ? { engineer_id: filters.engineerId } : {}),
      ...(filters.machineId ? { machine_id: filters.machineId } : {}),
      ...(filters.purpose ? { visit_purpose: filters.purpose } : {}),
    },
    include: {
      machine: { select: { machine_code: true, machine_name: true } },
      engineer: { select: { name: true } },
    },
    orderBy: { visit_date: 'desc' },
    ...(filters.limit ? { take: filters.limit } : {}),
  })
}

/**
 * Create a new site visit record and write a fire-and-forget activity log entry.
 */
export async function createSiteVisit(
  data: CreateSiteVisitData,
  userId: number,
) {
  const visit = await prisma.siteVisit.create({
    data: {
      machine_id: data.machine_id,
      engineer_id: data.engineer_id,
      visit_date: new Date(data.visit_date),
      visit_purpose: data.visit_purpose,
      ticket_id: data.ticket_id ?? null,
      findings: data.findings,
      actions_taken: data.actions_taken,
      parts_replaced: data.parts_replaced ?? null,
      next_visit_due: data.next_visit_due ? new Date(data.next_visit_due) : null,
    },
  })

  logActivity(userId, 'site_visit_logged', 'machine', data.machine_id, `Site visit logged for machine ${data.machine_id}`)
  return visit
}
