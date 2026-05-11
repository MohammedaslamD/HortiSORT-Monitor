import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// datasourceUrl is passed explicitly so the Prisma query engine uses whatever
// DATABASE_URL is in process.env at instantiation time — not what it reads
// from .env on its own. This is critical in tests where vitest injects the
// test DATABASE_URL into process.env before any module loads.
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
