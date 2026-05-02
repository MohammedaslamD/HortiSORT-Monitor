import { useState, useEffect, useCallback } from 'react'
import { getDatalogReport } from '../services/datalogService'
import type { DatalogReport, TdmsLot, TdmsError } from '../types'

// ── helpers ───────────────────────────────────────────────────────────────────

/** Parse "05-03-2026 : 10:20" → "10:20" */
function timeOnly(tdmsDate: string): string {
  if (!tdmsDate) return '—'
  const parts = tdmsDate.split(':')
  if (parts.length >= 3) return `${parts[1].trim()}:${parts[2].trim()}`
  if (parts.length === 2) return parts[1].trim()
  return tdmsDate
}

/** Parse "X Hrs Y Min Z.ZZZ Sec" → "Xh Ym" or "~Ym" */
function formatElapsed(elapsed: string | undefined): string {
  if (!elapsed) return '—'
  const hMatch = elapsed.match(/(\d+)\s*Hrs/)
  const mMatch = elapsed.match(/(\d+)\s*Min/)
  const h = hMatch ? parseInt(hMatch[1]) : 0
  const m = mMatch ? parseInt(mMatch[1]) : 0
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `~${m}m`
  return '<1m'
}

/** Short lot ID for display: last 6 chars of lot number */
function shortLot(lotNum: string): string {
  return lotNum ? lotNum.slice(-6) : '—'
}

type FilterType = 'all' | 'running' | 'completed' | 'errors'

// ── sub-components ─────────────────────────────────────────────────────────────

interface LotRow {
  lot: TdmsLot
  index: number
}

function StatusBadge({ elapsed }: { elapsed: string | undefined }) {
  // Treat lots with elapsed < 1 min as running (heuristic for demo)
  const isRunning = !elapsed || elapsed.includes('0 Hrs 0 Min')
  if (isRunning) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
        Running
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-white/10 text-fg-3">
      Completed
    </span>
  )
}

function LotTableRow({ lot, index }: LotRow) {
  const inspected = lot.inspection?.['Vision Result Count']?.total ?? '—'
  const start = timeOnly(lot.lot_start)
  const stop = timeOnly(lot.lot_stop)
  const elapsed = formatElapsed(lot.elapsed_time)
  const isRunning = !lot.elapsed_time || lot.elapsed_time.includes('0 Hrs 0 Min')

  return (
    <tr className="border-t border-white/5 hover:bg-white/[0.03] transition-colors">
      <td className="py-2.5 px-4 text-xs font-semibold text-fg-2">{lot.system_name}</td>
      <td className="py-2.5 px-4 text-xs text-fg-4">{lot.system_id}</td>
      <td className="py-2.5 px-4 text-xs font-mono text-fg-2">{index + 1}</td>
      <td className="py-2.5 px-4 text-xs text-fg-4 font-mono">{shortLot(lot.lot_number)}</td>
      <td className="py-2.5 px-4 text-xs text-fg-3">{start}</td>
      <td className="py-2.5 px-4 text-xs text-fg-3">{isRunning ? '—' : stop}</td>
      <td className="py-2.5 px-4 text-xs text-fg-3">{elapsed}</td>
      <td className="py-2.5 px-4 text-xs text-right font-semibold text-fg-2">
        {inspected !== '—' ? Number(inspected).toLocaleString() : '—'}
      </td>
      <td className="py-2.5 px-4 text-xs">
        <StatusBadge elapsed={lot.elapsed_time} />
      </td>
    </tr>
  )
}

interface ErrorLogRowProps { err: TdmsError; idx: number }
function ErrorLogRow({ err, idx }: ErrorLogRowProps) {
  const isWarn = err.group === 'SegmentAndRegroupUnit'
  return (
    <tr className={`border-t border-white/5 ${idx % 2 === 0 ? '' : 'bg-white/[0.015]'}`}>
      <td className="py-2 px-4 text-xs text-fg-4 whitespace-nowrap font-mono">{err.datetime}</td>
      <td className="py-2 px-4 text-xs">
        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
          isWarn
            ? 'bg-yellow-500/20 text-yellow-400'
            : 'bg-red-500/20 text-red-400'
        }`}>
          {err.group}
        </span>
      </td>
      <td className="py-2 px-4 text-xs text-fg-3 font-mono">{err.error_code || '—'}</td>
      <td className="py-2 px-4 text-xs text-fg-3 max-w-xs truncate">{err.error_source}</td>
    </tr>
  )
}

// ── main page ──────────────────────────────────────────────────────────────────

/**
 * Production page — matches the mockup:
 * stat cards → filter pills → All Production Lots table → Error Log
 * All data sourced from TDMS datalog (public/datalog.json).
 */
export function ProductionPage() {
  const [report, setReport] = useState<DatalogReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await getDatalogReport()
      setReport(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load production data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    const interval = setInterval(() => { void load() }, 30_000)
    return () => clearInterval(interval)
  }, [load])

  const lots = report?.lots ?? []
  const errors = report?.errors ?? []
  const summary = report?.summary

  // ── derived stat values ──
  const runningCount = lots.filter(
    (l) => !l.elapsed_time || l.elapsed_time.includes('0 Hrs 0 Min')
  ).length
  const totalInspected = lots.reduce((acc, l) => {
    const v = l.inspection?.['Vision Result Count']?.total
    return acc + (v ? parseInt(v) : 0)
  }, 0)

  // ── filter logic ──
  const isRunningLot = (l: TdmsLot) =>
    !l.elapsed_time || l.elapsed_time.includes('0 Hrs 0 Min')

  const filteredLots = lots.filter((l) => {
    if (filter === 'running' && !isRunningLot(l)) return false
    if (filter === 'completed' && isRunningLot(l)) return false
    if (filter === 'errors') return false // errors shown in error log, not lot table
    if (search) {
      const q = search.toLowerCase()
      return (
        l.lot_number.toLowerCase().includes(q) ||
        l.system_name.toLowerCase().includes(q) ||
        l.system_id.toLowerCase().includes(q)
      )
    }
    return true
  })

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  })

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'all',       label: 'All Machines' },
    { key: 'running',   label: 'Running' },
    { key: 'completed', label: 'Completed' },
    { key: 'errors',    label: 'Errors' },
  ]

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <header>
        <h1 className="text-xl font-semibold text-fg-1 flex items-center gap-2">
          Live Production
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        </h1>
        <p className="text-xs text-fg-4 mt-0.5">
          Today &middot; {today} &middot; Auto-updates every 30 seconds
        </p>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      {/* ── Stat cards (mockup style: 4 cards) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Machines Running */}
        <div className="bg-surface-2 border border-line rounded-xl p-4">
          <p className="text-[10px] font-semibold tracking-widest text-fg-5 uppercase">Machines Running</p>
          <p className="mt-2 text-4xl font-extrabold text-fg-1">{isLoading ? '…' : runningCount}</p>
        </div>
        {/* Total Lots Today */}
        <div className="bg-surface-2 border border-line rounded-xl p-4">
          <p className="text-[10px] font-semibold tracking-widest text-fg-5 uppercase">Total Lots Today</p>
          <p className="mt-2 text-4xl font-extrabold text-brand-blue">{isLoading ? '…' : lots.length}</p>
        </div>
        {/* Total Qty Today */}
        <div className="bg-surface-2 border border-line rounded-xl p-4">
          <p className="text-[10px] font-semibold tracking-widest text-fg-5 uppercase">Total Qty Today</p>
          <p className="mt-2 text-3xl font-extrabold text-brand-cyan">
            {isLoading ? '…' : `${totalInspected.toLocaleString()} fruits`}
          </p>
        </div>
        {/* Errors Today */}
        <div className="bg-surface-2 border border-line rounded-xl p-4">
          <p className="text-[10px] font-semibold tracking-widest text-fg-5 uppercase">Errors Today</p>
          <p className="mt-2 text-4xl font-extrabold text-red-400">{isLoading ? '…' : errors.length}</p>
        </div>
      </div>

      {/* ── Filter pills + search ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-fg-5 mr-1">Filter:</span>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === f.key
                ? 'bg-brand-blue/20 text-brand-blue border border-brand-blue/40'
                : 'bg-white/5 text-fg-4 border border-white/10 hover:bg-white/10'
            }`}
          >
            {f.label}
          </button>
        ))}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search machine or lot..."
          className="ml-auto px-3 py-1 text-xs rounded-md bg-surface-3 border border-line text-fg-2 placeholder:text-fg-6 focus:outline-none focus:border-brand-blue/50 w-52"
        />
      </div>

      {/* ── Production Lots table ── */}
      <div className="bg-surface-2 border border-line rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-line flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
          <span className="text-sm font-semibold text-fg-1">
            All Production Lots — Today
          </span>
          {summary && (
            <span className="ml-auto text-xs text-fg-5">
              {summary.machine_name} · {summary.machine_id}
            </span>
          )}
        </div>

        {isLoading ? (
          <p className="text-sm text-fg-6 py-10 text-center">Loading production data…</p>
        ) : filter === 'errors' ? (
          <p className="text-sm text-fg-5 py-10 text-center">
            See the Error Log section below.
          </p>
        ) : filteredLots.length === 0 ? (
          <p className="text-sm text-fg-6 py-10 text-center">No lots match the current filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] text-fg-5 uppercase tracking-wider bg-surface-3">
                  <th className="py-2.5 px-4 font-medium">Machine</th>
                  <th className="py-2.5 px-4 font-medium">Location</th>
                  <th className="py-2.5 px-4 font-medium">Lot #</th>
                  <th className="py-2.5 px-4 font-medium">Lot ID</th>
                  <th className="py-2.5 px-4 font-medium">Start Time</th>
                  <th className="py-2.5 px-4 font-medium">Stop Time</th>
                  <th className="py-2.5 px-4 font-medium">Duration</th>
                  <th className="py-2.5 px-4 font-medium text-right">Qty (Fruits)</th>
                  <th className="py-2.5 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLots.map((lot, i) => (
                  <LotTableRow key={lot.lot_number} lot={lot} index={i} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Error Log ── */}
      <div className="bg-surface-2 border border-line rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-line flex items-center gap-2">
          <span className="text-sm font-semibold text-fg-1">Error Log</span>
          <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
            {errors.length}
          </span>
        </div>

        {errors.length === 0 ? (
          <p className="text-sm text-fg-6 py-8 text-center">No errors recorded.</p>
        ) : (
          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-surface-3 z-10">
                <tr className="text-[11px] text-fg-5 uppercase tracking-wider">
                  <th className="py-2.5 px-4 font-medium">Date / Time</th>
                  <th className="py-2.5 px-4 font-medium">Group</th>
                  <th className="py-2.5 px-4 font-medium">Code</th>
                  <th className="py-2.5 px-4 font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {errors.slice(0, 100).map((err, i) => (
                  <ErrorLogRow key={i} err={err} idx={i} />
                ))}
              </tbody>
            </table>
            {errors.length > 100 && (
              <p className="text-xs text-fg-5 text-center py-2 border-t border-line">
                Showing 100 of {errors.length} entries
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
