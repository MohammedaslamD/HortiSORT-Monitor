import { getIo } from './index.ts'

/**
 * Broadcast a production session update to:
 * - room `machine:<machine_id>` (machine-specific subscribers)
 * - room `all-machines` (dashboard subscribers)
 */
export function broadcastSessionUpdate(machine_id: number, session: unknown): void {
  const io = getIo()
  if (!io) return
  io.to(`machine:${machine_id}`).emit('session:update', session)
  io.to('all-machines').emit('session:update', session)
}

/**
 * Broadcast a machine error event to machine-specific room.
 */
export function broadcastMachineError(machine_id: number, error: unknown): void {
  const io = getIo()
  if (!io) return
  io.to(`machine:${machine_id}`).emit('machine:error', error)
}

/**
 * Broadcast a machine status change to:
 * - room `machine:<machine_id>` (machine-specific subscribers)
 * - room `all-machines` (dashboard subscribers)
 */
export function broadcastMachineStatus(machine_id: number, payload: unknown): void {
  const io = getIo()
  if (!io) return
  io.to(`machine:${machine_id}`).emit('machine:status', payload)
  io.to('all-machines').emit('machine:status', payload)
}
