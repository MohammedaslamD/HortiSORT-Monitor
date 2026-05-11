import { prisma } from '../utils/prisma.ts'

/**
 * Return all history entries for a given machine, ordered by created_at descending.
 */
export async function getHistoryByMachineId(machineId: number) {
  return prisma.machineHistory.findMany({
    where: { machine_id: machineId },
    include: {
      changed_by_user: { select: { name: true } },
    },
    orderBy: { created_at: 'desc' },
  })
}
