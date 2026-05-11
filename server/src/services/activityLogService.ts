import { prisma } from '../utils/prisma.ts'
import type { EntityType } from '@prisma/client'

/**
 * Return the most recent activity log entries, ordered by created_at descending.
 */
export async function getRecentActivity(limit: number) {
  return prisma.activityLog.findMany({
    include: {
      user: { select: { name: true, role: true } },
    },
    orderBy: { created_at: 'desc' },
    take: limit,
  })
}

/**
 * Fire-and-forget helper to write an activity log entry.
 * Errors are swallowed so callers are never disrupted.
 */
export function logActivity(
  userId: number,
  action: string,
  entityType: EntityType,
  entityId: number,
  details: string,
): void {
  prisma.activityLog
    .create({
      data: {
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details,
      },
    })
    .catch((err: unknown) => {
      console.error('[activityLog] failed to write activity:', err)
    })
}
