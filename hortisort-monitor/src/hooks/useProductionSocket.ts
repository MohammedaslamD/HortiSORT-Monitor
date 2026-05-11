import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import type { ProductionSession, MachineStatus } from '../types'

interface UseProductionSocketOptions {
  /** Subscribe to a specific machine room. */
  machineId?: number
  /** Subscribe to the all-machines room (for dashboard). */
  allMachines?: boolean
}

/** Payload emitted by the server on machine:status events. */
export interface MachineStatusUpdate {
  machine_id: number
  status: MachineStatus
}

interface UseProductionSocketResult {
  lastSession: ProductionSession | null
  lastStatusUpdate: MachineStatusUpdate | null
}

const BACKEND_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

/**
 * Subscribe to real-time production session updates via Socket.io.
 * Pass machineId to join machine:<id> room, or allMachines=true for dashboard.
 */
export function useProductionSocket(
  options: UseProductionSocketOptions = {}
): UseProductionSocketResult {
  const [lastSession, setLastSession] = useState<ProductionSession | null>(null)
  const [lastStatusUpdate, setLastStatusUpdate] = useState<MachineStatusUpdate | null>(null)

  useEffect(() => {
    const socket = io(BACKEND_URL, { transports: ['websocket'] })

    if (options.machineId !== undefined) {
      socket.emit('join:machine', options.machineId)
    }
    if (options.allMachines) {
      socket.emit('join:all-machines')
    }

    socket.on('session:update', (session: ProductionSession) => {
      setLastSession(session)
    })

    socket.on('machine:status', (update: MachineStatusUpdate) => {
      setLastStatusUpdate(update)
    })

    return () => {
      socket.off('session:update')
      socket.off('machine:status')
      socket.disconnect()
    }
  }, [options.machineId, options.allMachines])

  return { lastSession, lastStatusUpdate }
}
