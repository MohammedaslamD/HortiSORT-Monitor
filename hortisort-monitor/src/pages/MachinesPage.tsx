import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import type { FleetSummary, MachineRow } from '../types'
import { liveMetricsService } from '../services/liveMetricsService'
import { Button } from '../components/common'
import {
  StatCard,
  SectionCard,
  StatBadge,
  DataTable,
  ProgressBar,
  statusToBadgeVariant,
} from '../components/dark'
import { formatRelative } from '../utils/formatRelative'

const STAT_ICON = {
  running: '\u25B6',
  idle:    '\u23F8',
  down:    '\u26A0',
  offline: '\u26AA',
} as const

const COLUMNS = [
  { key: 'machine',    label: 'Machine' },
  { key: 'site',       label: 'Site' },
  { key: 'fruit',      label: 'Fruit' },
  { key: 'status',     label: 'Status' },
  { key: 'throughput', label: 'Throughput' },
  { key: 'uptime',     label: 'Uptime Today' },
  { key: 'lastActive', label: 'Last Active' },
  { key: 'tickets',    label: 'Open Tickets', align: 'right' as const },
  { key: 'actions',    label: 'Actions' },
]

const TONE_COLOR: Record<MachineRow['status'], string> = {
  running: 'text-green-400',
  idle:    'text-yellow-400',
  down:    'text-red-400',
  offline: 'text-slate-400',
}

const PROGRESS_TONE: Record<'running' | 'down', 'green' | 'red'> = {
  running: 'green',
  down: 'red',
}

const capitalize = (s: string): string => s[0].toUpperCase() + s.slice(1)

/** Phase-B Machines page — dense dark table per dark-ui-v2.html lines 498-521. */
export function MachinesPage() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<FleetSummary | null>(null)
  const [rows, setRows] = useState<MachineRow[] | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      liveMetricsService.getFleetSummary(),
      liveMetricsService.getMachineRows(),
    ]).then(([s, r]) => {
      if (cancelled) return
      setSummary(s)
      setRows(r)
    })
    return () => { cancelled = true }
  }, [])

  const tableRows = (rows ?? []).map((r) => ({
    id: r.machine_id,
    cells: [
      r.machine_label,
      r.site,
      r.fruit,
      <StatBadge key="s" variant={statusToBadgeVariant(r.status)}>
        {capitalize(r.status)}
      </StatBadge>,
      r.tons_per_hour === null ? '--' : `${r.tons_per_hour.toFixed(1)} t/hr`,
      r.uptime_percent === null || (r.status !== 'running' && r.status !== 'down') ? '--' : (
        <div key="u" className="flex items-center gap-1.5">
          <div className="w-[70px]">
            <ProgressBar percent={r.uptime_percent} tone={PROGRESS_TONE[r.status]} />
          </div>
          <span className={`text-[10px] ${TONE_COLOR[r.status]}`}>{r.uptime_percent}%</span>
        </div>
      ),
      formatRelative(r.last_active),
      r.open_tickets_count,
      <div key="a" className="flex gap-1">
        <Button size="xs" variant="ghost" onClick={() => navigate(`/machines/${r.machine_id}/update-status`)}>Update</Button>
        <Button size="xs" variant="ghost" onClick={() => navigate(`/tickets/new?machine=${r.machine_id}`)}>Ticket</Button>
      </div>,
    ],
  }))

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-fg-1">Machines</h1>
        <p className="text-sm text-fg-4">All 12 machines across 4 sites</p>
      </header>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard accent="green"  label="Running" value={summary.running} valueColor="#4ade80" icon={<>{STAT_ICON.running}</>} dot="green" />
          <StatCard accent="yellow" label="Idle"    value={summary.idle}    valueColor="#fbbf24" icon={<>{STAT_ICON.idle}</>} />
          <StatCard accent="red"    label="Down"    value={summary.down}    valueColor="#ef4444" icon={<>{STAT_ICON.down}</>} dot="red" />
          <StatCard accent="blue"   label="Offline" value={summary.offline} valueColor="#64748b" icon={<>{STAT_ICON.offline}</>} />
        </div>
      )}

      <SectionCard title="Fleet">
        {rows === null ? (
          <p className="text-sm text-fg-6 py-8 text-center">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-fg-6 py-8 text-center">No machines found.</p>
        ) : (
          <DataTable columns={COLUMNS} rows={tableRows} />
        )}
      </SectionCard>
    </div>
  )
}
