import 'dotenv/config'

import { createServer } from 'http'
import { Server } from 'socket.io'
import { app } from './app.ts'
import { env } from './config/env.ts'
import { setIo } from './socket/index.ts'
import { prisma } from './utils/prisma.ts'
import { broadcastMachineStatus, broadcastSessionUpdate } from './socket/productionSocket.ts'

// Prevent unhandled rejections / exceptions from killing the process
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection] caught — process kept alive:', reason)
})
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException] caught — process kept alive:', err)
})

const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: { origin: true, credentials: true },
})

// Handle Socket.io room joins
io.on('connection', (socket) => {
  socket.on('join:machine', (machineId: number) => {
    void socket.join(`machine:${machineId}`)
  })
  socket.on('join:all-machines', () => {
    void socket.join('all-machines')
  })
})

setIo(io)

// ── Stale heartbeat job ────────────────────────────────────────────────────
// Every 60 seconds: mark machines offline if last_heartbeat_at > 2 minutes ago
// (or never received). Only watcher pings update last_heartbeat_at, so this
// correctly detects network loss / watcher crash — not just any DB update.
const OFFLINE_AFTER_MS = 2 * 60 * 1000 // 2 minutes

setInterval(() => {
  const cutoff = new Date(Date.now() - OFFLINE_AFTER_MS)

  // Only mark offline machines that have RECEIVED at least one heartbeat
  // (last_heartbeat_at is not null) but it has gone stale.
  // Machines that never had a watcher (null) keep their seeded/manual status.
  prisma.machine.findMany({
    where: {
      status: { in: ['running', 'idle'] },
      last_heartbeat_at: { not: null, lt: cutoff },
    },
    select: { id: true },
  }).then((stale) => {
    if (stale.length === 0) return
    const staleIds = stale.map((m) => m.id)
    return prisma.machine.updateMany({
      where: { id: { in: staleIds } },
      data: { status: 'offline' },
    }).then((result) => {
      console.log(`[heartbeat-job] Marked ${result.count} machine(s) offline (no heartbeat since ${cutoff.toISOString()})`)
      for (const m of stale) {
        broadcastMachineStatus(m.id, { machine_id: m.id, status: 'offline' })
      }
    })
  }).catch((err: unknown) => {
    console.error('[heartbeat-job] error:', err)
  })
}, 60_000)

// ── Session staleness job ──────────────────────────────────────────────────
// Every 60 seconds: mark production sessions as "completed" if they have been
// in "running" status for more than 10 minutes with no update.
// This is the safety net for lots where the watcher never re-posts a stop_time.
const SESSION_COMPLETE_AFTER_MS = 10 * 60 * 1000 // 10 minutes

setInterval(() => {
  const cutoff = new Date(Date.now() - SESSION_COMPLETE_AFTER_MS)

  prisma.productionSession.findMany({
    where: {
      status: 'running',
      updated_at: { lt: cutoff },
    },
    select: { id: true, machine_id: true },
  }).then((stale) => {
    if (stale.length === 0) return
    const staleIds = stale.map((s) => s.id)
    return prisma.productionSession.updateMany({
      where: { id: { in: staleIds } },
      data: { status: 'completed' },
    }).then((result) => {
      console.log(`[session-job] Marked ${result.count} session(s) completed (no update for 10 min)`)
      // Broadcast updated sessions so frontend switches tab immediately
      return prisma.productionSession.findMany({
        where: { id: { in: staleIds } },
      }).then((updated) => {
        for (const s of updated) {
          broadcastSessionUpdate(s.machine_id, s)
        }
      })
    })
  }).catch((err: unknown) => {
    console.error('[session-job] error:', err)
  })
}, 60_000)

httpServer.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT} (${env.NODE_ENV})`)
})
