import { useState, useEffect, useCallback, useRef } from 'react'
import { getDatalogReport } from '../services/datalogService'
import { MOCK_DAILY_LOGS, MOCK_MACHINES } from '../data/mockData'
import type { DatalogReport, TdmsError, TdmsMachine, DailyLogStatus } from '../types'

// ── helpers ───────────────────────────────────────────────────────────────────

/** "DD-MM-YYYY : HH:MM" → "HH:MM" */
function timeOnly(raw: string): string {
  if (!raw) return '—'
  const idx = raw.indexOf(' : ')
  if (idx !== -1) return raw.slice(idx + 3, idx + 8)
  return raw.slice(0, 5)
}

/** "DD-MM-YYYY : HH:MM" → "DD MMM YYYY" */
function dateOnly(raw: string): string {
  if (!raw) return '—'
  const match = raw.match(/^(\d{2})-(\d{2})-(\d{4})/)
  if (!match) return raw
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${match[1]} ${months[parseInt(match[2]) - 1]} ${match[3]}`
}

function calcDuration(start: string, end: string): string {
  if (!start || !end) return '—'
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

// ── unified row type ──────────────────────────────────────────────────────────

interface TableRow {
  id: string
  source: 'tdms' | 'mock'
  machine: string
  machineId: string
  location: string
  totalLots: string
  date: string
  fruit: string
  startTime: string
  stopTime: string
  duration: string
  qty: string
  status: 'running' | 'completed' | 'error'
  errors?: TdmsError[]
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  running:   { bg: 'bg-green-500/20 border border-green-500/30', text: 'text-green-400', dot: true,  label: 'Running' },
  completed: { bg: 'bg-white/10',                                text: 'text-fg-3',      dot: false, label: 'Completed' },
  error:     { bg: 'bg-red-500/20 border border-red-500/30',     text: 'text-red-400',   dot: false, label: 'Error' },
}

function StatusBadge({ status }: { status: TableRow['status'] }) {
  const s = STATUS_STYLES[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${s.bg} ${s.text}`}>
      {s.dot && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />}
      {s.label}
    </span>
  )
}

// ── Source badge ──────────────────────────────────────────────────────────────

function SourceBadge({ source }: { source: TableRow['source'] }) {
  if (source === 'tdms') {
    return (
      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-blue/20 text-brand-blue border border-brand-blue/30 ml-1">
        LIVE
      </span>
    )
  }
  return (
    <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/5 text-fg-5 border border-white/10 ml-1">
      DEMO
    </span>
  )
}


// ── Error modal (portal-style, rendered at page level) ───────────────────────

interface ErrorModalProps {
  machineName: string
  machineId: string
  errors: TdmsError[]
  onClose: () => void
}

function ErrorModal({ machineName, machineId, errors, onClose }: ErrorModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null)

  // Close on backdrop click
  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose()
  }

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const warnCount  = errors.filter((e) => e.group === 'SegmentAndRegroupUnit').length
  const errorCount = errors.length - warnCount

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Error log for ${machineId}`}
    >
      <div className="bg-surface-1 border border-line rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-line flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-fg-1 truncate">
              Error Log — {machineName}
            </h2>
            <p className="text-[11px] text-fg-5 mt-0.5">{machineId}</p>
          </div>
          {/* Summary badges */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
              {errorCount} errors
            </span>
            {warnCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                {warnCount} warnings
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-fg-3 border border-white/10">
              {errors.length} total
            </span>
          </div>
          <button
            onClick={onClose}
            className="ml-2 shrink-0 w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 text-fg-4 hover:text-fg-1 transition-colors text-sm"
            aria-label="Close error log"
          >
            ✕
          </button>
        </div>

        {/* Error table */}
        <div className="overflow-y-auto flex-1">
          {errors.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-2xl mb-2">✅</p>
              <p className="text-sm font-semibold text-fg-2">No Errors Recorded</p>
              <p className="text-xs text-fg-5 mt-1">This machine ran without any logged errors.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-surface-2 z-10">
                <tr className="text-[10px] text-fg-5 uppercase tracking-wider border-b border-line">
                  <th className="py-2.5 px-4 font-medium">Date / Time</th>
                  <th className="py-2.5 px-4 font-medium">Group</th>
                  <th className="py-2.5 px-4 font-medium">Code</th>
                  <th className="py-2.5 px-4 font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {errors.map((err, i) => {
                  const isWarn = err.group === 'SegmentAndRegroupUnit'
                  return (
                    <tr key={i} className={`border-t border-white/5 ${i % 2 !== 0 ? 'bg-white/[0.015]' : ''}`}>
                      <td className="py-2 px-4 text-xs text-fg-4 whitespace-nowrap font-mono">{err.datetime}</td>
                      <td className="py-2 px-4 text-xs">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          isWarn ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {err.group}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-xs text-fg-3 font-mono">{err.error_code || '—'}</td>
                      <td className="py-2 px-4 text-xs text-fg-3">{err.error_source}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-line flex items-center justify-between">
          <p className="text-[11px] text-fg-5">
            Showing all {errors.length} entries from TDMS error log
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand-blue/20 text-brand-blue border border-brand-blue/30 hover:bg-brand-blue/30 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Errors cell ───────────────────────────────────────────────────────────────

interface ErrorsCellProps {
  errors: TdmsError[] | undefined
  machineName: string
  machineId: string
  onViewAll: (machineName: string, machineId: string, errors: TdmsError[]) => void
}

function ErrorsCell({ errors, machineName, machineId, onViewAll }: ErrorsCellProps) {
  // DEMO rows have no errors array
  if (errors === undefined) {
    return <span className="text-xs text-fg-6">—</span>
  }
  if (errors.length === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
        <span>✓</span> No Errors
      </span>
    )
  }
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/15 text-red-400 border border-red-500/25">
        ⚠ {errors.length}
      </span>
      <button
        onClick={() => onViewAll(machineName, machineId, errors)}
        className="text-[11px] font-semibold text-brand-blue hover:underline whitespace-nowrap"
        aria-label={`View all errors for ${machineId}`}
      >
        View All
      </button>
    </div>
  )
}

// ── build TDMS rows (one per machine) ─────────────────────────────────────────

function buildTdmsRows(machines: TdmsMachine[]): TableRow[] {
  return machines.map((m) => ({
    id: `tdms-${m.machine_id}`,
    source: 'tdms' as const,
    machine: m.machine_name,
    machineId: m.machine_id,
    location: m.machine_id,
    totalLots: String(m.total_lots),
    date: dateOnly(m.first_lot_start),
    fruit: '—',
    startTime: timeOnly(m.first_lot_start),
    stopTime: timeOnly(m.last_lot_stop),
    duration: calcDuration(timeOnly(m.first_lot_start), timeOnly(m.last_lot_stop)),
    qty: m.total_inspected > 0 ? `${m.total_inspected} fruits` : '—',
    status: 'completed' as const,
    errors: m.errors,
  }))
}

// ── build mock rows (one per daily log) ───────────────────────────────────────

function buildMockRows(): TableRow[] {
  const machineMap = new Map(MOCK_MACHINES.map((m) => [m.id, m]))
  const statusMap: Record<DailyLogStatus, TableRow['status']> = {
    running:     'running',
    not_running: 'error',
    maintenance: 'completed',
  }
  return MOCK_DAILY_LOGS.map((log, i) => {
    const machine = machineMap.get(log.machine_id)
    const dur = calcDuration(log.shift_start, log.shift_end)
    return {
      id: `mock-${i}`,
      source: 'mock' as const,
      machine: machine?.machine_code ?? `#${log.machine_id}`,
      machineId: machine?.machine_code ?? '',
      location: machine?.city ?? '—',
      totalLots: '1',
      date: log.date,
      fruit: log.fruit_type ?? '—',
      startTime: log.shift_start,
      stopTime: log.status === 'running' ? '—' : log.shift_end,
      duration: log.status === 'running'
        ? `~${calcDuration(log.shift_start, new Date().toTimeString().slice(0, 5))}`
        : dur,
      qty: log.tons_processed > 0 ? `${(log.tons_processed * 1000).toLocaleString()} kg` : '—',
      status: statusMap[log.status],
    }
  })
}

// ── main page ─────────────────────────────────────────────────────────────────

interface ModalState {
  machineName: string
  machineId: string
  errors: TdmsError[]
}

export function ProductionPage() {
  const [datalog, setDatalog] = useState<DatalogReport | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<ModalState | null>(null)

  const loadDatalog = useCallback(async () => {
    try {
      const data = await getDatalogReport()
      setDatalog(data)
    } catch { /* silently ignore */ }
  }, [])

  useEffect(() => {
    void loadDatalog()
    const interval = setInterval(() => { void loadDatalog() }, 30_000)
    return () => clearInterval(interval)
  }, [loadDatalog])

  // ── rows: one TDMS row per machine, then mock rows ──
  const tdmsRows = datalog?.machines ? buildTdmsRows(datalog.machines) : []
  const mockRows = buildMockRows()
  const allRows  = [...tdmsRows, ...mockRows]

  // ── filter ──
  const filteredRows = allRows.filter((r) => {
    if (filter === 'running'   && r.status !== 'running')   return false
    if (filter === 'completed' && r.status !== 'completed') return false
    if (filter === 'errors'    && r.status !== 'error')     return false
    if (search) {
      const q = search.toLowerCase()
      return (
        r.machine.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.fruit.toLowerCase().includes(q)
      )
    }
    return true
  })

  const totalErrors = datalog?.errors?.length ?? 0

  // ── stat cards ──
  const runningCount  = allRows.filter((r) => r.status === 'running').length
  const totalQtyKg    = MOCK_DAILY_LOGS.reduce((s, l) => s + l.tons_processed * 1000, 0)
  const tdmsInspected = datalog?.machines?.reduce((s, m) => s + m.total_inspected, 0) ?? 0

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
          <p className="mt-2 text-4xl font-extrabold text-brand-blue">
            {allRows.length}
          </p>
        </div>
        <div className="bg-surface-2 border border-line rounded-xl p-4">
          <p className="text-[10px] font-semibold tracking-widest text-fg-5 uppercase">Total Qty Today</p>
          <p className="mt-2 text-lg font-extrabold text-brand-cyan leading-tight">
            {(totalQtyKg / 1000).toFixed(1)}t
            <span className="block text-xs font-normal text-fg-4 mt-0.5">
              + {tdmsInspected.toLocaleString()} fruits (LIVE)
            </span>
          </p>
        </div>
        <div className="bg-surface-2 border border-line rounded-xl p-4">
          <p className="text-[10px] font-semibold tracking-widest text-fg-5 uppercase">Errors Today</p>
          <p className="mt-2 text-4xl font-extrabold text-red-400">{totalErrors}</p>
        </div>
      </div>

      {/* ── Filter + search ── */}
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
          placeholder="Search machine or location..."
          className="ml-auto px-3 py-1 text-xs rounded-md bg-surface-3 border border-line text-fg-2 placeholder:text-fg-6 focus:outline-none focus:border-brand-blue/50 w-52"
        />
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center gap-4 text-[11px] text-fg-5">
        <span className="flex items-center gap-1.5">
          <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-blue/20 text-brand-blue border border-brand-blue/30">LIVE</span>
          Real TDMS data — one row per machine, all lots combined
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/5 text-fg-5 border border-white/10">DEMO</span>
          Demo data
        </span>
      </div>

      {/* ── Production table ── */}
      <div className="bg-surface-2 border border-line rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-line flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
          <span className="text-sm font-semibold text-fg-1">Production — Today</span>
          <span className="ml-auto text-xs text-fg-5">{filteredRows.length} machines</span>
        </div>

        {filteredRows.length === 0 ? (
          <p className="text-sm text-fg-6 py-10 text-center">No machines match the current filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] text-fg-5 uppercase tracking-wider bg-surface-3">
                  <th className="py-2.5 px-4 font-medium">Machine</th>
                  <th className="py-2.5 px-4 font-medium">Location</th>
                  <th className="py-2.5 px-4 font-medium">Lots Run</th>
                  <th className="py-2.5 px-4 font-medium">Date</th>
                  <th className="py-2.5 px-4 font-medium">Fruit</th>
                  <th className="py-2.5 px-4 font-medium">First Start</th>
                  <th className="py-2.5 px-4 font-medium">Last Stop</th>
                  <th className="py-2.5 px-4 font-medium">Total Time</th>
                  <th className="py-2.5 px-4 font-medium text-right">Total Qty</th>
                  <th className="py-2.5 px-4 font-medium">Status</th>
                  <th className="py-2.5 px-4 font-medium">Errors</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r) => (
                  <tr key={r.id} className="border-t border-white/5 hover:bg-white/[0.03] transition-colors align-top">
                    <td className="py-2.5 px-4 text-xs">
                      <span className="font-semibold text-fg-1">{r.machine}</span>
                      <SourceBadge source={r.source} />
                    </td>
                    <td className="py-2.5 px-4 text-xs text-fg-3">{r.location}</td>
                    <td className="py-2.5 px-4 text-xs text-fg-2 font-semibold">{r.totalLots}</td>
                    <td className="py-2.5 px-4 text-xs text-fg-4 whitespace-nowrap">{r.date}</td>
                    <td className="py-2.5 px-4 text-xs text-brand-cyan">{r.fruit}</td>
                    <td className="py-2.5 px-4 text-xs text-fg-3">{r.startTime}</td>
                    <td className="py-2.5 px-4 text-xs text-fg-3">{r.stopTime}</td>
                    <td className="py-2.5 px-4 text-xs text-fg-3">{r.duration}</td>
                    <td className="py-2.5 px-4 text-xs text-right font-semibold text-fg-2">{r.qty}</td>
                    <td className="py-2.5 px-4 text-xs"><StatusBadge status={r.status} /></td>
                    <td className="py-2.5 px-4 text-xs">
                      <ErrorsCell
                        errors={r.errors}
                        machineName={r.machine}
                        machineId={r.machineId}
                        onViewAll={(name, id, errs) => setModal({ machineName: name, machineId: id, errors: errs })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Error modal ── */}
      {modal && (
        <ErrorModal
          machineName={modal.machineName}
          machineId={modal.machineId}
          errors={modal.errors}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
