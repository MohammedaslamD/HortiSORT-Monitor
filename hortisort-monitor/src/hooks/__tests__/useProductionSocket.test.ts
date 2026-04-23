import { vi, beforeEach, it, expect, describe } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock socket.io-client
const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  connected: false,
}

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}))

import { useProductionSocket } from '../useProductionSocket'
import type { ProductionSession } from '../../types'

const SESSION: ProductionSession = {
  id: 1,
  machine_id: 1,
  lot_number: 1,
  session_date: '2026-04-23',
  start_time: '2026-04-23T06:00:00Z',
  stop_time: null,
  fruit_type: 'Mango',
  quantity_kg: '500.00',
  status: 'running',
  raw_tdms_rows: null,
  created_at: '2026-04-23T06:00:00Z',
  updated_at: '2026-04-23T06:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useProductionSocket', () => {
  it('registers session:update event handler on mount', () => {
    renderHook(() => useProductionSocket({ machineId: 1 }))
    expect(mockSocket.on).toHaveBeenCalledWith('session:update', expect.any(Function))
  })

  it('emits join:machine with machineId on mount', () => {
    renderHook(() => useProductionSocket({ machineId: 5 }))
    expect(mockSocket.emit).toHaveBeenCalledWith('join:machine', 5)
  })

  it('emits join:all-machines when allMachines=true', () => {
    renderHook(() => useProductionSocket({ allMachines: true }))
    expect(mockSocket.emit).toHaveBeenCalledWith('join:all-machines')
  })

  it('updates lastSession state when session:update event fires', () => {
    const { result } = renderHook(() => useProductionSocket({ machineId: 1 }))
    const handler = mockSocket.on.mock.calls.find(
      (c: unknown[]) => c[0] === 'session:update'
    )?.[1] as ((s: ProductionSession) => void) | undefined

    act(() => {
      handler?.(SESSION)
    })
    expect(result.current.lastSession).toEqual(SESSION)
  })

  it('calls disconnect on unmount', () => {
    const { unmount } = renderHook(() => useProductionSocket({ machineId: 1 }))
    unmount()
    expect(mockSocket.disconnect).toHaveBeenCalled()
  })
})
