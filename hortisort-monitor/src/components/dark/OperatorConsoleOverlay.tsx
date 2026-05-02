import { useEffect, useState } from 'react'
import type { FleetSummary, MachineRow, MachineStatusTone } from '../../types'
import { liveMetricsService } from '../../services/liveMetricsService'
import { useLivePolling } from '../../hooks/useLivePolling'
import { StatCard } from './StatCard'

interface OperatorConsoleOverlayProps {
  isOpen: boolean
  onClose: () => void
}

const POLL_INTERVAL_MS = 15_000

const INITIAL_FLEET: FleetSummary = {
  total_machines: 0,
  running: 0,
  idle: 0,
  down: 0,
  offline: 0,
  in_production: 0,
  today_throughput_tons: 0,
  trend_running_vs_yesterday: 0,
  trend_throughput_pct: 0,
  open_tickets: { total: 0, p1: 0, p2: 0, p3: 0, p4: 0 },
}

/** Format Date as `HH:MM:SS` (zero-padded 24h). */
function formatClock(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** Tailwind border colour for the left accent bar of each machine tile. */
const TILE_ACCENT: Record<MachineStatusTone, string> = {
  running: 'border-l-brand-cyan',
  idle:    'border-l-yellow-500',
  down:    'border-l-brand-red',
  offline: 'border-l-slate-600',
}

/** Tailwind colour for the big value text inside each machine tile. */
const TILE_VALUE_COLOR: Record<MachineStatusTone, string> = {
  running: 'text-brand-green',
  idle:    'text-yellow-400',
  down:    'text-brand-red',
  offline: 'text-slate-500',
}

/**
 * Render the body of a machine tile: large value + caption.
 * For non-running statuses the value is the status word; for running it's tons-per-hour.
 */
function tileBody(row: MachineRow): { value: string; caption: string } {
  if (row.status === 'running' && row.tons_per_hour !== null) {
    return { value: row.tons_per_hour.toFixed(1), caption: 't/hr' }
  }
  if (row.status === 'idle') return { value: 'IDLE', caption: 'Standby' }
  if (row.status === 'down') return { value: 'DOWN', caption: 'Fault' }
  return { value: 'OFF', caption: 'Offline' }
}

/**
 * Fullscreen operator console for live floor monitoring.
 *
 * Polls fleet summary + machine rows every 15s via `useLivePolling` (which
 * automatically pauses when the tab is hidden). Displays a ticking clock,
 * KPI row, and 6-column machine grid. Closes on `Escape` or "Exit Console".
 *
 * Returns `null` when `isOpen` is false (mounted but inert).
 */
export function OperatorConsoleOverlay({ isOpen, onClose }: OperatorConsoleOverlayProps) {
  // Ticking clock state — updates every 1s while open
  const [now, setNow] = useState<Date>(() => new Date())

  // Polled data — pause polling fully when overlay is closed by passing a
  // very long interval; useLivePolling restarts on mount each open
  const fleet = useLivePolling(
    () => liveMetricsService.getFleetSummary(),
    POLL_INTERVAL_MS,
    INITIAL_FLEET,
  )
  const rows = useLivePolling(
    () => liveMetricsService.getMachineRows(),
    POLL_INTERVAL_MS,
    [] as MachineRow[],
  )

  // Esc-to-close
  useEffect(() => {
    if (!isOpen) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  // Ticking clock (1s)
  useEffect(() => {
    if (!isOpen) return
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [isOpen])

  if (!isOpen) return null

  const summary = fleet.data
  const machines = rows.data

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Operator Console"
      className="fixed inset-0 z-[200] overflow-y-auto bg-bg p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line-strong pb-4 mb-6">
        <div>
          <div className="text-2xl font-extrabold text-brand-cyan">HortiSort Operator Console</div>
          <div className="text-xs text-fg-4 mt-1">Live floor view — Auto-refresh 15s</div>
        </div>
        <div className="flex items-center gap-4">
          <div
            data-testid="console-clock"
            className="text-3xl font-extrabold text-brand-green tabular-nums"
          >
            {formatClock(now)}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-bg-surface3 border border-line-strong text-fg-3 hover:text-fg-1 px-4 py-2 rounded-md text-xs font-semibold"
          >
            Exit Console
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard
          accent="green"
          label="RUNNING"
          icon={<span aria-hidden>▶</span>}
          value={summary.running}
        />
        <StatCard
          accent="red"
          label="DOWN"
          icon={<span aria-hidden>⚠</span>}
          value={summary.down}
        />
        <StatCard
          accent="yellow"
          label="IDLE"
          icon={<span aria-hidden>⏸</span>}
          value={summary.idle}
        />
        <StatCard
          accent="blue"
          label="TODAY TONS"
          icon={<span aria-hidden>⚖</span>}
          value={summary.today_throughput_tons.toFixed(1)}
        />
      </div>

      {/* Machine grid */}
      <div
        data-testid="console-machine-grid"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
      >
        {machines.map((row) => {
          const body = tileBody(row)
          return (
            <div
              key={row.machine_id}
              className={`bg-bg-surface2 border border-line-strong border-l-4 ${TILE_ACCENT[row.status]} rounded-lg p-3 text-center`}
            >
              <div className="text-xs font-mono text-fg-4 mb-1">{row.machine_label}</div>
              <div className={`text-2xl font-extrabold ${TILE_VALUE_COLOR[row.status]}`}>{body.value}</div>
              <div className="text-[10px] text-fg-4 uppercase tracking-wider">{body.caption}</div>
              <div className="text-xs text-fg-3 mt-1">{row.fruit}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
