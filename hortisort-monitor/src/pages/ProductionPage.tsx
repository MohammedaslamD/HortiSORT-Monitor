import { useState, useEffect, useCallback } from 'react'
import { getDatalogReport } from '../services/datalogService'
import { MOCK_DAILY_LOGS, MOCK_MACHINES } from '../data/mockData'
import type { DatalogReport, TdmsError, DailyLogStatus } from '../types'

// ── helpers ───────────────────────────────────────────────────────────────────

function calcDuration(start: string, end: string): string {
  if (!start || !end) return '—'
  // start/end are "HH:MM" strings
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  if (isNaN(sh) || isNaN(eh)) return '—'
  const mins = (eh * 60 + em) - (sh * 60 + sm)
  if (mins <= 0) return '—'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

type FilterType = 'all' | 'running' | 'completed' | 'errors'

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<DailyLogStatus, { bg: string; text: string; dot?: boolean }> = {
  running:     { bg: 'bg-green-500/20 border border-green-500/30', text: 'text-green-400', dot: true },
  not_running: { bg: 'bg-red-500/20 border border-red-500/30',   text: 'text-red-400' },
  maintenance: { bg: 'bg-yellow-500/20 border border-yellow-500/30', text: 'text-yellow-400' },
}
const STATUS_LABELS: Record<DailyLogStatus, string> = {
  running:     'Running',
  not_running: 'Error',
  maintenance: 'Maintenance',
}

function StatusBadge({ status }: { status: DailyLogStatus }) {
  const s = STATUS_STYLES[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${s.bg} ${s.text}`}>
      {s.dot && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />}
      {STATUS_LABELS[status]}
    </span>
  )
}

// ── Error log row ─────────────────────────────────────────────────────────────

function ErrorLogRow({ err, idx }: { err: TdmsError; idx: number }) {
  const isWarn = err.group === 'SegmentAndRegroupUnit'
  return (
    <tr className={`border-t border-white/5 ${idx % 2 !== 0 ? 'bg-white/[0.015]' : ''}`}>
      <td className="py-2 px-4 text-xs text-fg-4 whitespace-nowrap font-mono">{err.datetime}</td>
      <td className="py-2 px-4 text-xs">
        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
          isWarn ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {err.group}
        </span>
      </td>
      <td className="py-2 px-4 text-xs text-fg-3 font-mono">{err.error_code || '—'}</td>
      <td className="py-2 px-4 text-xs text-fg-3 max-w-xs truncate">{err.error_source}</td>
    </tr>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

/**
 * Production page — table rows from MOCK_DAILY_LOGS joined with MOCK_MACHINES,
 * matching the mockup design. Error log from TDMS datalog.json below.
 */
export function ProductionPage() {
  const [datalog, setDatalog] = useState<DatalogReport | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')

  const loadDatalog = useCallback(async () => {
    try {
      const data = await getDatalogReport()
      setDatalog(data)
    } catch {
      // silently fall back — errors section shows nothing
    }
  }, [])

  useEffect(() => {
    void loadDatalog()
    const interval = setInterval(() => { void loadDatalog() }, 30_000)
    return () => clearInterval(interval)
  }, [loadDatalog])

  // ── Build table rows by joining logs → machines ──
  const machineMap = new Map(MOCK_MACHINES.map((m) => [m.id, m]))

  const allRows = MOCK_DAILY_LOGS.map((log, idx) => {
    const machine = machineMap.get(log.machine_id)
    return {
      id: idx + 1,
      log,
      machine,
      machineCode: machine?.machine_code ?? `#${log.machine_id}`,
      city: machine?.city ?? '—',
      duration: calcDuration(log.shift_start, log.shift_end),
    }
  })

  // ── Filter ──
  const filteredRows = allRows.filter((r) => {
    if (filter === 'running'   && r.log.status !== 'running')     return false
    if (filter === 'completed' && r.log.status === 'running')     return false
    if (filter === 'errors'    && r.log.status !== 'not_running') return false
    if (search) {
      const q = search.toLowerCase()
      return (
        r.machineCode.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        (r.log.fruit_type?.toLowerCase().includes(q) ?? false)
      )
    }
    return true
  })

  // ── Stat card derivations ──
  const runningCount  = allRows.filter((r) => r.log.status === 'running').length
  const totalQtyKg    = allRows.reduce((s, r) => s + r.log.tons_processed * 1000, 0)
  const errors        = datalog?.errors ?? []
  const totalLots     = allRows.length

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

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-surface-2 border border-line rounded-xl p-4">
          <p className="text-[10px] font-semibold tracking-widest text-fg-5 uppercase">Machines Running</p>
          <p className="mt-2 text-4xl font-extrabold text-fg-1">{runningCount}</p>
        </div>
        <div className="bg-surface-2 border border-line rounded-xl p-4">
          <p className="text-[10px] font-semibold tracking-widest text-fg-5 uppercase">Total Lots Today</p>
          <p className="mt-2 text-4xl font-extrabold text-brand-blue">{totalLots}</p>
        </div>
        <div className="bg-surface-2 border border-line rounded-xl p-4">
          <p className="text-[10px] font-semibold tracking-widest text-fg-5 uppercase">Total Qty Today</p>
          <p className="mt-2 text-3xl font-extrabold text-brand-cyan">
            {(totalQtyKg / 1000).toFixed(1)} t
          </p>
        </div>
        <div className="bg-surface-2 border border-line rounded-xl p-4">
          <p className="text-[10px] font-semibold tracking-widest text-fg-5 uppercase">Errors Today</p>
          <p className="mt-2 text-4xl font-extrabold text-red-400">{errors.length}</p>
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
          placeholder="Search machine or fruit..."
          className="ml-auto px-3 py-1 text-xs rounded-md bg-surface-3 border border-line text-fg-2 placeholder:text-fg-6 focus:outline-none focus:border-brand-blue/50 w-52"
        />
      </div>

      {/* ── Production lots table ── */}
      <div className="bg-surface-2 border border-line rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-line flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
          <span className="text-sm font-semibold text-fg-1">All Production Lots — Today</span>
        </div>

        {filteredRows.length === 0 ? (
          <p className="text-sm text-fg-6 py-10 text-center">No lots match the current filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] text-fg-5 uppercase tracking-wider bg-surface-3">
                  <th className="py-2.5 px-4 font-medium">Machine</th>
                  <th className="py-2.5 px-4 font-medium">Location</th>
                  <th className="py-2.5 px-4 font-medium">Lot #</th>
                  <th className="py-2.5 px-4 font-medium">Fruit</th>
                  <th className="py-2.5 px-4 font-medium">Start Time</th>
                  <th className="py-2.5 px-4 font-medium">Stop Time</th>
                  <th className="py-2.5 px-4 font-medium">Duration</th>
                  <th className="py-2.5 px-4 font-medium text-right">Qty (KG)</th>
                  <th className="py-2.5 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r) => (
                  <tr key={r.id} className="border-t border-white/5 hover:bg-white/[0.03] transition-colors">
                    <td className="py-2.5 px-4 text-xs">
                      <span className="font-semibold text-fg-1">{r.machineCode}</span>
                      {r.machine && (
                        <span className="ml-1.5 text-fg-5 text-[10px]">{r.city}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-xs text-fg-3">{r.city}</td>
                    <td className="py-2.5 px-4 text-xs font-mono text-fg-2">{r.id}</td>
                    <td className="py-2.5 px-4 text-xs text-brand-cyan">{r.log.fruit_type ?? '—'}</td>
                    <td className="py-2.5 px-4 text-xs text-fg-3">{r.log.shift_start}</td>
                    <td className="py-2.5 px-4 text-xs text-fg-3">
                      {r.log.status === 'running' ? '—' : r.log.shift_end}
                    </td>
                    <td className="py-2.5 px-4 text-xs text-fg-3">
                      {r.log.status === 'running' ? `~${calcDuration(r.log.shift_start, new Date().toTimeString().slice(0, 5))}` : r.duration}
                    </td>
                    <td className="py-2.5 px-4 text-xs text-right font-semibold text-fg-2">
                      {r.log.tons_processed > 0
                        ? (r.log.tons_processed * 1000).toLocaleString()
                        : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-xs">
                      <StatusBadge status={r.log.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Error Log (TDMS) ── */}
      <div className="bg-surface-2 border border-line rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-line flex items-center gap-2">
          <span className="text-sm font-semibold text-fg-1">Error Log</span>
          <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
            {errors.length}
          </span>
          {datalog && (
            <span className="ml-auto text-[10px] text-fg-5">
              From TDMS · parsed {new Date(datalog.parsed_at).toLocaleTimeString()}
            </span>
          )}
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
