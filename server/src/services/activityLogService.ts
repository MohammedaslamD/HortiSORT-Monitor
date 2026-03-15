import { prisma } from '../utils/prisma.ts'

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
