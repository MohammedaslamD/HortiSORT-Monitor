import { useState, useEffect, useCallback, useRef } from 'react'
import { apiClient } from '../services/apiClient'
import { useProductionSocket } from '../hooks/useProductionSocket'
import type { ProductionSession, Machine, MachineError, MachineStatus } from '../types'

// ── helpers ───────────────────────────────────────────────────────────────────

/** ISO timestamp → "HH:MM" in IST */
function timeOnly(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })
}

/** ISO date string → "DD MMM YYYY" in IST */
function dateOnly(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
}

/**
 * Parse a loose TDMS datetime string like "3/23/2026 : 8:38:10 AM" or an ISO
 * string into something new Date() can parse reliably.
 */
function parseLooseDateTime(raw: string): string | null {
  if (!raw || raw === '—') return null
  // Already ISO
  if (raw.includes('T') || raw.match(/^\d{4}-\d{2}-\d{2}/)) return raw
  // TDMS format: "M/D/YYYY : H:MM:SS AM/PM" or "M/D/YYYY : H:MM AM/PM"
  const cleaned = raw.replace(' : ', ' ')
  const d = new Date(cleaned)
  if (!isNaN(d.getTime())) return d.toISOString()
  return null
}

function calcDurationFromISO(start: string | null, end: string | null): string {
  if (!start) return '—'
  const startMs = new Date(start).getTime()
  // If no end time (still running), use current time
  const endMs = end ? new Date(end).getTime() : Date.now()
  if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) return '—'
  const totalSecs = Math.floor((endMs - startMs) / 1000)
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

/**
 * Parse TDMS elapsed_time string like "3 Hrs 55 Min 27.338 Sec" into a
 * compact "3h 55m 27s" display string. Returns null if unparseable.
 */
function parseTdmsElapsed(raw: string | null | undefined): string | null {
  if (!raw) return null
  const m = raw.match(/(\d+)\s*Hrs?\s*(\d+)\s*Min?\s*([\d.]+)\s*Sec?/i)
  if (!m) return null
  const h = parseInt(m[1], 10)
  const min = parseInt(m[2], 10)
  const sec = Math.floor(parseFloat(m[3]))
  if (h > 0) return `${h}h ${min}m ${sec}s`
  if (min > 0) return `${min}m ${sec}s`
  return `${sec}s`
}

type FilterType = 'all' | 'running' | 'completed' | 'errors'

// ── unified row type ──────────────────────────────────────────────────────────

interface TableRow {
  id: string
  machineDbId: number
  machine: string
  machineCode: string
  location: string
  totalLots: string
  date: string
  fruit: string
  startTime: string
  stopTime: string
  duration: string
  qty: string
  /** Total elapsed time computed from firstStart → lastStop (or now if running) */
  elapsedTime: string
  /** Program start time from TDMS e.g. "3:52 PM" */
  programStart: string
  /** App start time from TDMS (when HortiSort app launched) */
  appStart: string
  /** System ID from TDMS e.g. "ZLHS-68-GLobalCA" */
  systemId: string
  status: 'running' | 'completed' | 'error'
  /** Live connectivity status from the watcher heartbeat. */
  machineStatus: MachineStatus
  errorCount: number
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

// ── Connectivity badge (watcher heartbeat) ────────────────────────────────────

const CONNECTIVITY_STYLES: Record<MachineStatus, { bg: string; text: string; dot?: boolean; label: string }> = {
  running: { bg: 'bg-green-500/15 border border-green-500/25',  text: 'text-green-400',  dot: true,  label: 'Online' },
  idle:    { bg: 'bg-yellow-500/15 border border-yellow-500/25', text: 'text-yellow-400', dot: false, label: 'Idle' },
  down:    { bg: 'bg-red-500/15 border border-red-500/25',       text: 'text-red-400',    dot: false, label: 'Down' },
  offline: { bg: 'bg-white/5 border border-white/10',            text: 'text-fg-5',       dot: false, label: 'Offline' },
}

function ConnectivityBadge({ status }: { status: MachineStatus }) {
  const s = CONNECTIVITY_STYLES[status]
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${s.bg} ${s.text}`}>
      {s.dot && <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse inline-block" />}
      {s.label}
    </span>
  )
}


// ── Error modal ───────────────────────────────────────────────────────────────

interface ErrorModalProps {
  machineName: string
  machineCode: string
  errors: MachineError[]
  onClose: () => void
}

function ErrorModal({ machineName, machineCode, errors, onClose }: ErrorModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null)

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose()
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Error log for ${machineCode}`}
    >
      <div className="bg-surface-1 border border-line rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-line flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-fg-1 truncate">
              Error Log — {machineName}
            </h2>
            <p className="text-[11px] text-fg-5 mt-0.5">{machineCode}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
              {errors.length} errors
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
                  <th className="py-2.5 px-4 font-medium">Code</th>
                  <th className="py-2.5 px-4 font-medium">Message</th>
                </tr>
              </thead>
              <tbody>
                {errors.map((err, i) => (
                  <tr key={err.id} className={`border-t border-white/5 ${i % 2 !== 0 ? 'bg-white/[0.015]' : ''}`}>
                    <td className="py-2 px-4 text-xs text-fg-4 whitespace-nowrap font-mono">
                      {new Date(err.occurred_at).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                    </td>
                    <td className="py-2 px-4 text-xs">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-500/20 text-red-400">
                        {err.error_code ?? 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-xs text-fg-3">{err.message ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-line flex items-center justify-between">
          <p className="text-[11px] text-fg-5">
            Showing today&apos;s {errors.length} error entries
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
  count: number
  machineDbId: number
  machineName: string
  machineCode: string
  onViewAll: (machineDbId: number, machineName: string, machineCode: string) => void
}

function ErrorsCell({ count, machineDbId, machineName, machineCode, onViewAll }: ErrorsCellProps) {
  if (count === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
        <span>✓</span> No Errors
      </span>
    )
  }
  const displayCount = count >= 99 ? '99+' : count
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/15 text-red-400 border border-red-500/25">
        ⚠ {displayCount}
      </span>
      <button
        onClick={() => onViewAll(machineDbId, machineName, machineCode)}
        className="text-[11px] font-semibold text-brand-blue hover:underline whitespace-nowrap"
        aria-label={`View all errors for ${machineCode}`}
      >
        View All
      </button>
    </div>
  )
}

// ── buildLiveRows: one row per machine, all lots aggregated ───────────────────

function buildLiveRows(
  sessions: ProductionSession[],
  machines: Machine[],
  errorCounts: Record<number, number>,
  machineStatuses: Record<number, MachineStatus>,
): TableRow[] {
  const machineMap = new Map(machines.map((m) => [m.id, m]))

  // Group sessions by machine_id
  const byMachine = new Map<number, ProductionSession[]>()
  for (const s of sessions) {
    const list = byMachine.get(s.machine_id) ?? []
    list.push(s)
    byMachine.set(s.machine_id, list)
  }

  const rows: TableRow[] = []

  for (const [machineId, machineSessions] of byMachine) {
    const machine = machineMap.get(machineId)

    // Aggregate across all sessions for this machine
    const starts = machineSessions.map((s) => s.start_time).filter(Boolean)

    const firstStart = starts.length > 0
      ? starts.reduce((a, b) => (new Date(a) < new Date(b) ? a : b))
      : null

    const totalQty = machineSessions.reduce((sum, s) => {
      const v = s.quantity_kg !== null ? parseFloat(String(s.quantity_kg)) : 0
      return sum + (isNaN(v) ? 0 : v)
    }, 0)

    // Status: if any session is running → running; if any error → error; else completed
    const hasRunning = machineSessions.some((s) => s.status === 'running')
    const hasError   = machineSessions.some((s) => s.status === 'error')
    const status: TableRow['status'] = hasRunning ? 'running' : hasError ? 'error' : 'completed'

    // Fruit type: use first non-null value
    const fruit = machineSessions.find((s) => s.fruit_type)?.fruit_type ?? null

    // Live connectivity status from watcher heartbeat; fall back to machine DB status
    const machineStatus: MachineStatus =
      machineStatuses[machineId] ?? machine?.status ?? 'offline'

    // Metadata from raw_tdms_rows — use last lot's values (most recent run)
    // "last lot" = highest start_time (sort defensively in case API order varies)
    const lastSession = machineSessions.reduce((latest, s) =>
      new Date(s.start_time) > new Date(latest.start_time) ? s : latest
    )
    const lastRaw = lastSession?.raw_tdms_rows as Record<string, unknown> | null
    const programStart = lastRaw?.program_start_time
      ? timeOnly(parseLooseDateTime(String(lastRaw.program_start_time)))
      : '—'
    const appStart = lastRaw?.app_start_time
      ? timeOnly(parseLooseDateTime(String(lastRaw.app_start_time)))
      : '—'
    const systemId = String(lastRaw?.system_id ?? '—').trim() || '—'

    // Last Stop = stop_time of the latest lot specifically
    const latestLotStop = lastSession?.stop_time ?? null

    // Elapsed = prefer TDMS elapsed_time string from last lot (has sub-minute precision);
    // fall back to computing firstStart → latestLotStop (or now if still running)
    const tdmsElapsed = parseTdmsElapsed(lastRaw?.elapsed_time as string | null)
    const elapsedTime = tdmsElapsed ?? calcDurationFromISO(firstStart, latestLotStop)

    // Cap error count display at 99
    const rawErrorCount = errorCounts[machineId] ?? 0
    const errorCount = Math.min(rawErrorCount, 99)

    rows.push({
      id: `live-${machineId}`,
      machineDbId: machineId,
      machine: machine?.machine_name ?? `Machine #${machineId}`,
      machineCode: machine?.machine_code ?? String(machineId),
      location: machine?.city ?? '—',
      totalLots: String(machineSessions.length),
      date: dateOnly(firstStart),
      fruit: fruit ?? '—',
      startTime: timeOnly(firstStart),
      stopTime: timeOnly(latestLotStop),
      duration: calcDurationFromISO(firstStart, latestLotStop),
      qty: totalQty > 0 ? `${Math.round(totalQty).toLocaleString()} fruits` : '—',
      elapsedTime,
      programStart,
      appStart,
      systemId,
      status,
      machineStatus,
      errorCount,
    })
  }

  return rows
}

// ── main page ─────────────────────────────────────────────────────────────────

interface ModalState {
  machineDbId: number
  machineName: string
  machineCode: string
}

export function ProductionPage() {
  const [sessions,        setSessions]        = useState<ProductionSession[]>([])
  const [machines,        setMachines]        = useState<Machine[]>([])
  const [errorCounts,     setErrorCounts]     = useState<Record<number, number>>({})
  const [machineStatuses, setMachineStatuses] = useState<Record<number, MachineStatus>>({})
  const [modalErrors,     setModalErrors]     = useState<MachineError[]>([])
  const [modal,           setModal]           = useState<ModalState | null>(null)
  const [filter,          setFilter]          = useState<FilterType>('all')
  const [search,          setSearch]          = useState('')
  const [loading,         setLoading]         = useState(true)
  const [selectedDate,    setSelectedDate]    = useState<string>(
    new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  )
  // Track whether the user has manually picked a date — if so, never auto-fallback
  const userPickedDate = useRef(false)

  // ── fetch sessions + machines ──
  const loadData = useCallback(async () => {
    try {
      const [sessRes, machRes] = await Promise.all([
        apiClient.get<ProductionSession[]>(`/api/v1/production-sessions?date=${selectedDate}&limit=500`),
        apiClient.get<Machine[]>('/api/v1/machines'),
      ])

      // Auto-fallback ONLY on initial load (not user-picked date) when today has no data
      const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
      if (
        !userPickedDate.current &&
        sessRes.data.length === 0 &&
        selectedDate === todayIST
      ) {
        const allRes = await apiClient.get<ProductionSession[]>('/api/v1/production-sessions?limit=1')
        if (allRes.data.length > 0) {
          const latestDate = allRes.data[0].session_date.slice(0, 10)
          if (latestDate !== todayIST) {
            setSelectedDate(latestDate)
            return // will re-run via the useEffect on selectedDate change
          }
        }
      }

      setSessions(sessRes.data)
      setMachines(machRes.data)
    } catch {
      /* silently ignore — stale data stays on screen */
    } finally {
      setLoading(false)
    }
  }, [selectedDate])

  // ── fetch error counts for all unique machine IDs in sessions ──
  const loadErrorCounts = useCallback(async (sessionList: ProductionSession[]) => {
    const machineIds = [...new Set(sessionList.map((s) => s.machine_id))]
    const counts: Record<number, number> = {}
    await Promise.all(
      machineIds.map(async (id) => {
        try {
          const res = await apiClient.get<MachineError[]>(
            `/api/v1/machine-errors/today?machine_id=${id}&date=${selectedDate}`,
          )
          counts[id] = res.data.length
        } catch {
          counts[id] = 0
        }
      }),
    )
    setErrorCounts(counts)
  }, [selectedDate])

  useEffect(() => {
    void loadData()
    const interval = setInterval(() => { void loadData() }, 30_000)
    return () => clearInterval(interval)
  }, [loadData])

  // Reload error counts whenever the session list changes
  useEffect(() => {
    if (sessions.length > 0) void loadErrorCounts(sessions)
  }, [sessions, loadErrorCounts])

  // ── socket: refresh on new session event; update machine status live ──
  const { lastSession, lastStatusUpdate } = useProductionSocket({ allMachines: true })
  useEffect(() => {
    if (lastSession) void loadData()
  }, [lastSession, loadData])

  // Apply live watcher heartbeat status immediately without a full reload
  useEffect(() => {
    if (!lastStatusUpdate) return
    setMachineStatuses((prev) => ({
      ...prev,
      [lastStatusUpdate.machine_id]: lastStatusUpdate.status,
    }))
  }, [lastStatusUpdate])

  // ── open error modal: fetch errors lazily ──
  const handleViewErrors = useCallback(async (machineDbId: number, machineName: string, machineCode: string) => {
    setModal({ machineDbId, machineName, machineCode })
    setModalErrors([])
    try {
      const res = await apiClient.get<MachineError[]>(
        `/api/v1/machine-errors/today?machine_id=${machineDbId}&date=${selectedDate}`,
      )
      setModalErrors(res.data)
    } catch {
      setModalErrors([])
    }
  }, [selectedDate])

  // ── build rows ──
  const allRows = buildLiveRows(sessions, machines, errorCounts, machineStatuses)

  // ── filter ──
  const filteredRows = allRows.filter((r) => {
    if (filter === 'running'   && r.status !== 'running')   return false
    if (filter === 'completed' && r.status !== 'completed') return false
    if (filter === 'errors'    && r.errorCount === 0)       return false
    if (search) {
      const q = search.toLowerCase()
      return (
        r.machine.toLowerCase().includes(q) ||
        r.machineCode.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.fruit.toLowerCase().includes(q)
      )
    }
    return true
  })

  // ── stat cards ──
  const runningCount  = allRows.filter((r) => r.status === 'running').length
  const totalLots     = sessions.length
  const totalQty      = sessions.reduce((sum, s) => {
    const v = s.quantity_kg !== null ? parseFloat(String(s.quantity_kg)) : 0
    return sum + (isNaN(v) ? 0 : v)
  }, 0)
  const totalErrors   = Object.values(errorCounts).reduce((a, b) => a + b, 0)

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
    timeZone: 'Asia/Kolkata',
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
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-fg-1 flex items-center gap-2">
            Live Production
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </h1>
          <p className="text-xs text-fg-4 mt-0.5">
            {selectedDate === new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
              ? `Today · ${today} · Auto-updates every 30 seconds`
              : `Showing data for ${new Date(selectedDate).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}`
            }
          </p>
        </div>
        {/* Date picker */}
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => { userPickedDate.current = true; setLoading(true); setSelectedDate(e.target.value) }}
          className="px-3 py-1.5 text-xs rounded-lg bg-surface-3 border border-line text-fg-2 focus:outline-none focus:border-brand-blue/50"
        />
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
          <p className="mt-2 text-lg font-extrabold text-brand-cyan leading-tight">
            {Math.round(totalQty).toLocaleString()} fruits
          </p>
        </div>
        <div className="bg-surface-2 border border-line rounded-xl p-4">
          <p className="text-[10px] font-semibold tracking-widest text-fg-5 uppercase">Errors Today</p>
          <p className="mt-2 text-4xl font-extrabold text-red-400">{totalErrors > 99 ? '99+' : totalErrors}</p>
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

      {/* ── Production table ── */}
      <div className="bg-surface-2 border border-line rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-line flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
          <span className="text-sm font-semibold text-fg-1">Production — Today</span>
          <span className="ml-auto text-xs text-fg-5">{filteredRows.length} machines</span>
        </div>

        {loading ? (
          <p className="text-sm text-fg-6 py-10 text-center">Loading live data…</p>
        ) : filteredRows.length === 0 ? (
          <p className="text-sm text-fg-6 py-10 text-center">
            {allRows.length === 0
              ? 'No production sessions found for today. Start the watcher to see live data.'
              : 'No machines match the current filter.'}
          </p>
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
                   <th className="py-2.5 px-4 font-medium text-right">Fruits (UI)</th>
                   <th className="py-2.5 px-4 font-medium">Elapsed</th>
                   <th className="py-2.5 px-4 font-medium">Prog. Start</th>
                   <th className="py-2.5 px-4 font-medium">Status</th>
                   <th className="py-2.5 px-4 font-medium">Errors</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r) => (
                  <tr key={r.id} className="border-t border-white/5 hover:bg-white/[0.03] transition-colors align-top">
                    <td className="py-2.5 px-4 text-xs">
                      <span className="font-semibold text-fg-1">{r.machine}</span>
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-blue/20 text-brand-blue border border-brand-blue/30 ml-1">
                        LIVE
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] text-fg-5">{r.machineCode}</span>
                        <ConnectivityBadge status={r.machineStatus} />
                      </div>
                      {r.systemId !== '—' && (
                        <span className="block text-[9px] text-fg-6 mt-0.5 font-mono">{r.systemId}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-xs text-fg-3">{r.location}</td>
                    <td className="py-2.5 px-4 text-xs text-fg-2 font-semibold">{r.totalLots}</td>
                    <td className="py-2.5 px-4 text-xs text-fg-4 whitespace-nowrap">{r.date}</td>
                    <td className="py-2.5 px-4 text-xs text-brand-cyan">{r.fruit}</td>
                    <td className="py-2.5 px-4 text-xs text-fg-3">{r.startTime}</td>
                    <td className="py-2.5 px-4 text-xs text-fg-3">{r.stopTime}</td>
                    <td className="py-2.5 px-4 text-xs text-fg-3">{r.duration}</td>
                    <td className="py-2.5 px-4 text-xs text-right font-semibold text-fg-2">{r.qty}</td>
                    <td className="py-2.5 px-4 text-xs text-fg-4 whitespace-nowrap font-mono">{r.elapsedTime}</td>
                    <td className="py-2.5 px-4 text-xs text-fg-3">{r.programStart}</td>
                    <td className="py-2.5 px-4 text-xs"><StatusBadge status={r.status} /></td>
                    <td className="py-2.5 px-4 text-xs">
                      <ErrorsCell
                        count={r.errorCount}
                        machineDbId={r.machineDbId}
                        machineName={r.machine}
                        machineCode={r.machineCode}
                        onViewAll={handleViewErrors}
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
          machineCode={modal.machineCode}
          errors={modalErrors}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
