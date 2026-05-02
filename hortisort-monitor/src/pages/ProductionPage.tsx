import { useState, useEffect, useCallback } from 'react'
import type { ProductionSession, ProductionStatus } from '../types'
import { getAllTodaySessions } from '../services/productionSessionService'
import { useProductionSocket } from '../hooks/useProductionSocket'
import { computeProductionStats } from '../utils/productionStats'
import {
  StatCard,
  SectionCard,
  StatBadge,
  DataTable,
  type StatBadgeVariant,
} from '../components/dark'

const COLUMNS = [
  { key: 'lot',       label: 'Lot #' },
  { key: 'machine',   label: 'Machine' },
  { key: 'fruit',     label: 'Fruit' },
  { key: 'status',    label: 'Status' },
  { key: 'start',     label: 'Start' },
  { key: 'stop',      label: 'Stop' },
  { key: 'processed', label: 'Processed' },
  { key: 'rejected',  label: 'Rejected' },
  { key: 'qty',       label: 'Qty', align: 'right' as const },
]

const STATUS_BADGE: Record<ProductionStatus, { variant: StatBadgeVariant; label: string }> = {
  running:   { variant: 'live',      label: 'LIVE' },
  completed: { variant: 'completed', label: 'Completed' },
  error:     { variant: 'down',      label: 'Error' },
}

function formatLot(lotNumber: number, sessionDate: string): string {
  const year = sessionDate.slice(0, 4)
  return `LOT-${year}-${String(lotNumber).padStart(3, '0')}`
}

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatQty(quantityKg: string | null): string {
  if (!quantityKg) return '—'
  const n = parseFloat(quantityKg)
  if (Number.isNaN(n)) return '—'
  return `${n.toLocaleString()} kg`
}

/**
 * Phase-B Production page — dense dark table per `dark-ui-v2.html` lines 524-545.
 * Stat cards are derived live from today's sessions; Socket.io stream still
 * pushes live updates into the table.
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

  const { lastSession } = useProductionSocket({ allMachines: true })
  useEffect(() => {
    if (!lastSession) return
    setSessions((prev) => {
      const idx = prev.findIndex(
        (s) => s.machine_id === lastSession.machine_id && s.lot_number === lastSession.lot_number,
      )
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = lastSession
        return next
      }
      return [lastSession, ...prev]
    })
  }, [lastSession])

  const stats = computeProductionStats(sessions)

  const tableRows = sessions.map((s) => {
    const badge = STATUS_BADGE[s.status]
    return {
      id: s.id,
      cells: [
        formatLot(s.lot_number, s.session_date),
        s.machine?.machine_code ?? `#${s.machine_id}`,
        s.fruit_type ?? '—',
        <StatBadge key="st" variant={badge.variant}>{badge.label}</StatBadge>,
        formatTime(s.start_time),
        formatTime(s.stop_time),
        // TODO(phase-c): wire real items_processed once ProductionSession carries it
        '—',
        // TODO(phase-c): wire real items_rejected once ProductionSession carries it
        '—',
        formatQty(s.quantity_kg),
      ],
    }
  })

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-fg-1">Production</h1>
        <p className="text-sm text-fg-4 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Live — updates every 15 s
        </p>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          accent="green"
          label="Active Sessions"
          value={stats.active_sessions}
          valueColor="#4ade80"
          icon={<>{'\u2698'}</>}
          dot="green"
        />
        <StatCard
          accent="blue"
          label="Lots Today"
          value={stats.lots_today}
          icon={<>{'\u25A3'}</>}
        />
        <StatCard
          accent="cyan"
          label="Items Processed"
          value={stats.items_processed_kg.toLocaleString()}
          icon={<>{'\u2696'}</>}
        />
        <StatCard
          accent="yellow"
          label="Rejection Rate"
          // TODO(phase-c): replace '—' with `${stats.rejection_rate_pct}%` once items_rejected exists
          value={<>{'—'}</>}
          icon={<>{'\u26A0'}</>}
        />
      </div>

      <SectionCard title="Today's Lots">
        {isLoading ? (
          <p className="text-sm text-fg-6 py-8 text-center">Loading production data…</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-fg-6 py-8 text-center">No production data for today yet.</p>
        ) : (
          <DataTable columns={COLUMNS} rows={tableRows} />
        )}
      </SectionCard>
    </div>
  )
}
