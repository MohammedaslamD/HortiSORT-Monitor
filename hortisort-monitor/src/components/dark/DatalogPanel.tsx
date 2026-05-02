import { useState, useEffect } from 'react'
import { getDatalogReport } from '../../services/datalogService'
import type { DatalogReport, TdmsLot, TdmsError } from '../../types'
import { SectionCard } from './SectionCard'
import { StatCard } from './StatCard'

// ── helpers ──────────────────────────────────────────────────────────────────

function num(val: string | undefined): string {
  if (!val || val === '0') return '0'
  return val
}

// ── sub-components ────────────────────────────────────────────────────────────

function LotRow({ lot }: { lot: TdmsLot }) {
  const inspected = lot.inspection?.['Vision Result Count']?.total ?? '—'
  const ejected   = lot.inspection?.['Ejection done']?.total ?? '—'
  const lost      = lot.default_bin?.['Lost Fruit']?.total ?? '—'

  return (
    <tr className="border-t border-white/5 hover:bg-white/[0.03] transition-colors">
      <td className="py-2 px-3 font-mono text-xs text-fg-2 whitespace-nowrap">{lot.lot_number}</td>
      <td className="py-2 px-3 text-xs text-fg-3 whitespace-nowrap">{lot.lot_start}</td>
      <td className="py-2 px-3 text-xs text-fg-3 whitespace-nowrap">{lot.lot_stop}</td>
      <td className="py-2 px-3 text-xs text-fg-3 whitespace-nowrap">{lot.elapsed_time ?? '—'}</td>
      <td className="py-2 px-3 text-xs text-right text-fg-2">{num(inspected)}</td>
      <td className="py-2 px-3 text-xs text-right text-green-400">{num(ejected)}</td>
      <td className="py-2 px-3 text-xs text-right text-red-400">{num(lost)}</td>
    </tr>
  )
}

function ErrorRow({ err }: { err: TdmsError }) {
  const isWarn = err.group === 'SegmentAndRegroupUnit'
  return (
    <tr className="border-t border-white/5 hover:bg-white/[0.03] transition-colors">
      <td className="py-2 px-3 text-xs text-fg-4 whitespace-nowrap">{err.datetime}</td>
      <td className="py-2 px-3 text-xs">
        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
          isWarn ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {err.group}
        </span>
      </td>
      <td className="py-2 px-3 text-xs text-fg-2 font-mono">{err.error_code}</td>
      <td className="py-2 px-3 text-xs text-fg-3 max-w-xs truncate">{err.error_source}</td>
    </tr>
  )
}

// ── main component ─────────────────────────────────────────────────────────────

/**
 * DatalogPanel — displayed on the Production page.
 * Reads public/datalog.json (written by tdms-parser.py / tdms-watcher.js).
 * Shows: machine info, per-lot table, error log.
 */
export function DatalogPanel() {
  const [report, setReport] = useState<DatalogReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setIsLoading(true)
        const data = await getDatalogReport()
        if (!cancelled) setReport(data)
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Failed to load datalog report')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void load()
    // Refresh every 30 s to pick up watcher updates
    const interval = setInterval(() => { void load() }, 30_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  if (isLoading) {
    return (
      <p className="text-sm text-fg-6 py-6 text-center">Loading datalog report…</p>
    )
  }

  if (error || !report) {
    return (
      <p className="text-sm text-red-400 py-6 text-center">
        Failed to load datalog report{error ? `: ${error}` : ''}
      </p>
    )
  }

  const { summary, lots, errors } = report

  return (
    <div className="space-y-4">
      {/* ── Machine summary cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard accent="blue" label="Machine" value={summary.machine_name} icon={<>&#9881;</>} />
        <StatCard accent="cyan" label="Machine ID" value={summary.machine_id} icon={<>&#128203;</>} />
        <StatCard accent="green" label="Total Lots" value={summary.total_lots} icon={<>&#9783;</>} dot="green" />
        <StatCard accent="red" label="Total Errors" value={summary.total_errors} icon={<>&#9888;</>} />
      </div>

      {/* ── Fruit counters from latest lot ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard accent="cyan"   label="Fruits Inspected" value={summary.fruits_inspected} icon={<>&#128065;</>} />
        <StatCard accent="green"  label="Fruits Ejected"   value={summary.fruits_ejected}   icon={<>&#10003;</>} />
        <StatCard accent="red"    label="Fruits Lost"      value={summary.fruits_lost}       icon={<>&#9888;</>} />
        <StatCard accent="yellow" label="Double Fruits"    value={summary.double_fruits}     icon={<>&#10006;</>} />
      </div>

      {/* ── Lot table ── */}
      <SectionCard title={`Lot History (${lots.length} lots)`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] text-fg-5 uppercase tracking-wider">
                <th className="py-2 px-3 font-medium">Lot #</th>
                <th className="py-2 px-3 font-medium">Start</th>
                <th className="py-2 px-3 font-medium">Stop</th>
                <th className="py-2 px-3 font-medium">Elapsed</th>
                <th className="py-2 px-3 font-medium text-right">Inspected</th>
                <th className="py-2 px-3 font-medium text-right">Ejected</th>
                <th className="py-2 px-3 font-medium text-right">Lost</th>
              </tr>
            </thead>
            <tbody>
              {lots.map((lot) => (
                <LotRow key={lot.lot_number} lot={lot} />
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* ── Error log ── */}
      <SectionCard title={`Error Log (${errors.length} entries)`}>
        {errors.length === 0 ? (
          <p className="text-sm text-fg-6 py-4 text-center">No errors recorded.</p>
        ) : (
          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-surface-2 z-10">
                <tr className="text-[11px] text-fg-5 uppercase tracking-wider">
                  <th className="py-2 px-3 font-medium">Date/Time</th>
                  <th className="py-2 px-3 font-medium">Group</th>
                  <th className="py-2 px-3 font-medium">Code</th>
                  <th className="py-2 px-3 font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {errors.slice(0, 100).map((err, i) => (
                  <ErrorRow key={i} err={err} />
                ))}
              </tbody>
            </table>
            {errors.length > 100 && (
              <p className="text-xs text-fg-5 text-center py-2">
                Showing first 100 of {errors.length} entries
              </p>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
