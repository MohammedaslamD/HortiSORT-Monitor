import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import type { Machine, MachineStats } from '../types'
import { apiClient } from '../services/apiClient'
import { Button } from '../components/common'
import {
  StatCard,
  SectionCard,
  StatBadge,
  DataTable,
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
  { key: 'location',   label: 'Location' },
  { key: 'model',      label: 'Model' },
  { key: 'status',     label: 'Status' },
  { key: 'sw',         label: 'Software' },
  { key: 'lastActive', label: 'Last Updated' },
  { key: 'actions',    label: 'Actions' },
]

const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

const EMPTY_STATS: MachineStats = { total: 0, running: 0, idle: 0, down: 0, offline: 0 }

/** Machines page — all data from real backend API. */
export function MachinesPage() {
  const navigate = useNavigate()
  const [stats,    setStats]    = useState<MachineStats>(EMPTY_STATS)
  const [machines, setMachines] = useState<Machine[] | null>(null)

  const loadAll = useCallback(async () => {
    try {
      const [statsRes, machinesRes] = await Promise.all([
        apiClient.get<MachineStats>('/api/v1/machines/stats'),
        apiClient.get<Machine[]>('/api/v1/machines'),
      ])
      setStats(statsRes.data)
      setMachines(machinesRes.data)
    } catch {
      setMachines([])
    }
  }, [])

  useEffect(() => {
    void loadAll()
    const interval = setInterval(() => { void loadAll() }, 30_000)
    return () => clearInterval(interval)
  }, [loadAll])

  const tableRows = (machines ?? []).map((m) => ({
    id: m.id,
    cells: [
      <div key="m" className="leading-tight">
        <div className="text-fg-1 font-semibold text-xs">{m.machine_name}</div>
        <div className="text-[10px] text-fg-5 font-mono">{m.machine_code}</div>
      </div>,
      <div key="loc" className="leading-tight">
        <div className="text-xs text-fg-2">{m.city}</div>
        <div className="text-[10px] text-fg-5">{m.state}</div>
      </div>,
      <span key="mod" className="text-xs text-fg-4">{m.model}</span>,
      <StatBadge key="s" variant={statusToBadgeVariant(m.status)}>
        {capitalize(m.status)}
      </StatBadge>,
      <span key="sw" className="text-[10px] text-fg-5 font-mono">{m.software_version}</span>,
      <span key="la" className="text-[11px] text-fg-4">{formatRelative(m.last_updated)}</span>,
      <div key="a" className="flex gap-1">
        <Button size="xs" variant="ghost" onClick={() => navigate(`/machines/${m.id}/update-status`)}>
          Update
        </Button>
        <Button size="xs" variant="ghost" onClick={() => navigate(`/tickets/new?machine=${m.id}`)}>
          Ticket
        </Button>
      </div>,
    ],
  }))

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-fg-1">Machines</h1>
        <p className="text-sm text-fg-4">
          {stats.total > 0 ? `${stats.total} machines across all sites` : 'Loading…'}
        </p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard accent="green"  label="Running" value={stats.running} valueColor="#4ade80" icon={<>{STAT_ICON.running}</>} dot="green" />
        <StatCard accent="yellow" label="Idle"    value={stats.idle}    valueColor="#fbbf24" icon={<>{STAT_ICON.idle}</>} />
        <StatCard accent="red"    label="Down"    value={stats.down}    valueColor="#ef4444" icon={<>{STAT_ICON.down}</>} dot="red" />
        <StatCard accent="blue"   label="Offline" value={stats.offline} valueColor="#64748b" icon={<>{STAT_ICON.offline}</>} />
      </div>

      <SectionCard title="Fleet">
        {machines === null ? (
          <p className="text-sm text-fg-6 py-8 text-center">Loading…</p>
        ) : machines.length === 0 ? (
          <p className="text-sm text-fg-6 py-8 text-center">No machines found.</p>
        ) : (
          <DataTable columns={COLUMNS} rows={tableRows} />
        )}
      </SectionCard>
    </div>
  )
}
