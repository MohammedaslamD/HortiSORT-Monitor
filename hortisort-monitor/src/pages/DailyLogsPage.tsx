import { useState, useEffect } from 'react'

import type { DailyLog, Machine, DailyLogStatus } from '../types'
import { useAuth } from '../context/AuthContext'
import { getAllDailyLogs } from '../services/dailyLogService'
import { getMachinesByRole } from '../services/machineService'
import { getUserName } from '../utils/userLookup'
import { computeDailyLogStats } from '../utils/dailyLogStats'
import {
  StatCard,
  SectionCard,
  StatBadge,
  DataTable,
  InfoBanner,
  type StatBadgeVariant,
} from '../components/dark'

const COLUMNS = [
  { key: 'date',    label: 'Date' },
  { key: 'machine', label: 'Machine' },
  { key: 'status',  label: 'Status' },
  { key: 'fruit',   label: 'Fruit / Tons' },
  { key: 'notes',   label: 'Notes' },
  { key: 'by',      label: 'By' },
]

const STATUS_BADGE: Record<DailyLogStatus, { variant: StatBadgeVariant; label: string }> = {
  running:     { variant: 'running',     label: 'Running' },
  maintenance: { variant: 'maintenance', label: 'Maintenance' },
  not_running: { variant: 'notrun',      label: 'Not Running' },
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatLogDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function formatAuto(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `auto · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/**
 * Phase B Daily Logs page — info banner + 4 derived stat cards + dense
 * dark table per `dark-ui-v2.html` lines 572-635. Filters from the
 * legacy page are dropped per spec §7 row 5.
 *
 * Role scoping is preserved verbatim from the prior implementation:
 * - admin sees all logs
 * - engineer sees logs they recorded
 * - customer sees logs for their machines
 */
export function DailyLogsPage() {
  const { user } = useAuth()

  const [allLogs, setAllLogs] = useState<DailyLog[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    async function fetchData() {
      setIsLoading(true)
      setError(null)
      try {
        const [fetchedLogs, fetchedMachines] = await Promise.all([
          getAllDailyLogs(),
          getMachinesByRole(),
        ])
        if (cancelled) return

        const machineIdSet = new Set(fetchedMachines.map((m) => m.id))
        let scoped: DailyLog[]
        if (user!.role === 'admin') {
          scoped = fetchedLogs
        } else if (user!.role === 'engineer') {
          scoped = fetchedLogs.filter((l) => l.updated_by === user!.id)
        } else {
          scoped = fetchedLogs.filter((l) => machineIdSet.has(l.machine_id))
        }
        setAllLogs(scoped)
        setMachines(fetchedMachines)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load daily logs.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [user])

  if (!user) return null

  const machineNameMap: Record<number, string> = {}
  const machineCodeMap: Record<number, string> = {}
  for (const m of machines) {
    machineNameMap[m.id] = m.machine_name
    machineCodeMap[m.id] = m.machine_code
  }

  const stats = computeDailyLogStats(allLogs)

  const tableRows = allLogs.map((l) => {
    const badge = STATUS_BADGE[l.status]
    const machineLabel = `${machineCodeMap[l.machine_id] ?? '#' + l.machine_id} ${machineNameMap[l.machine_id] ?? ''}`.trim()
    const fruitTons = l.status === 'running'
      ? `${l.fruit_type || '—'} — ${l.tons_processed} t`
      : '—'
    return {
      id: l.id,
      cells: [
        <div key="d" className="leading-tight">
          <div className="text-fg-1 font-semibold text-xs">{formatLogDate(l.date)}</div>
          <div className="text-[10px] text-fg-6">{formatAuto(l.created_at)}</div>
        </div>,
        machineLabel,
        <StatBadge key="st" variant={badge.variant}>{badge.label}</StatBadge>,
        fruitTons,
        l.notes,
        <span key="by" className="text-fg-4 text-[11px]">{getUserName(l.updated_by)}</span>,
      ],
    }
  })

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-fg-1">Daily Logs</h1>
        <p className="text-sm text-fg-4">Auto-generated from machine status updates</p>
      </header>

      <InfoBanner>
        <strong>How daily logs work:</strong> A log entry is automatically created
        each time an engineer updates a machine status via the Update Status
        action. It records that day's shift times, fruit type, tons processed,
        and notes. You cannot manually create one — use "Update Status" on a
        machine instead.
      </InfoBanner>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          accent="blue"
          label="Logs This Week"
          value={stats.logs_this_week}
          icon={<>{'\u2630'}</>}
        />
        <StatCard
          accent="green"
          label="Running Days"
          value={stats.running_days}
          valueColor="#4ade80"
          icon={<>{'\u25B6'}</>}
          dot="green"
        />
        <StatCard
          accent="yellow"
          label="Maintenance Days"
          value={stats.maintenance_days}
          valueColor="#fbbf24"
          icon={<>{'\u2699'}</>}
        />
        <StatCard
          accent="red"
          label="Not-Running Days"
          value={stats.not_running_days}
          valueColor="#ef4444"
          icon={<>{'\u26A0'}</>}
        />
      </div>

      <SectionCard title="Recent Daily Logs">
        {isLoading ? (
          <p className="text-sm text-fg-6 py-8 text-center">Loading…</p>
        ) : allLogs.length === 0 ? (
          <p className="text-sm text-fg-6 py-8 text-center">No logs found.</p>
        ) : (
          <DataTable columns={COLUMNS} rows={tableRows} />
        )}
      </SectionCard>
    </div>
  )
}
