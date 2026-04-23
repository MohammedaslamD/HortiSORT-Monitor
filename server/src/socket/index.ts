import type { Server } from 'socket.io'

let _io: Server | null = null

/**
 * Store the Socket.io server instance for use across services.
 */
export function setIo(io: Server): void {
  _io = io
}

/**
 * Get the Socket.io server instance.
 * Returns null if Socket.io has not been initialized yet.
 */
export function getIo(): Server | null {
  return _io
}
