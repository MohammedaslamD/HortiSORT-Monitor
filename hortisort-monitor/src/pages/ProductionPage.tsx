import { useState, useEffect, useCallback } from 'react'
import type { ProductionSession } from '../types'
import { getAllTodaySessions } from '../services/productionSessionService'
import { useProductionSocket } from '../hooks/useProductionSocket'
import { ProductionLotTable } from '../components/production'

/**
 * /production page — shows today's production sessions across all machines
 * (or filtered by machine) with live Socket.io updates.
 */
export function ProductionPage() {
  const [sessions, setSessions] = useState<ProductionSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const today = new Date().toISOString().slice(0, 10)

  const fetchSessions = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await getAllTodaySessions(today)
      setSessions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load production data')
    } finally {
      setIsLoading(false)
    }
  }, [today])

  useEffect(() => {
    void fetchSessions()
  }, [fetchSessions])

  // Live updates — when a session update arrives, refresh the list
  const { lastSession } = useProductionSocket({ allMachines: true })
  useEffect(() => {
    if (lastSession) {
      setSessions((prev) => {
        const idx = prev.findIndex(
          (s) => s.machine_id === lastSession.machine_id && s.lot_number === lastSession.lot_number
        )
        if (idx >= 0) {
          const updated = [...prev]
          updated[idx] = lastSession
          return updated
        }
        return [lastSession, ...prev]
      })
    }
  }, [lastSession])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page heading */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Production</h1>

      {/* Live indicator */}
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-sm text-gray-500">Live — updates every 15 s</span>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-4 mb-4">
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="text-gray-500 py-12 text-center">Loading production data…</div>
      ) : (
        <ProductionLotTable sessions={sessions} />
      )}
    </div>
  )
}
