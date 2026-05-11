import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiClient } from '../services/apiClient'
import {
  StatCard, SectionCard, MachineTile, DonutChart, SeverityBar,
  AlertRow, TimelineItem,
} from '../components/dark'
import { formatRelative } from '../utils/formatRelative'
import { useProductionSocket } from '../hooks/useProductionSocket'
import type {
  Machine, MachineStats, ProductionSession, Ticket, ActivityLog, MachineStatus,
} from '../types'

// ── helpers ───────────────────────────────────────────────────────────────────

/** Derive tone for a machine tile from DB status. */
function machineTone(status: Machine['status']): 'running' | 'idle' | 'down' | 'offline' {
  return status as 'running' | 'idle' | 'down' | 'offline'
}

/** Map a Ticket to the Alert shape expected by AlertRow. */
function ticketToAlert(t: Ticket) {
  return {
    id: t.id,
    machine_id: t.machine_id,
    machine_label: t.ticket_number,
    severity: t.severity === 'P1_critical' ? 'critical' as const
      : t.severity === 'P2_high' ? 'warn' as const
      : 'info' as const,
    badge_label: (t.severity === 'P1_critical' ? 'P1'
      : t.severity === 'P2_high' ? 'P2'
      : t.severity === 'P3_medium' ? 'P3' : 'P4') as 'P1' | 'P2' | 'P3' | 'P4',
    message: t.title,
    created_at: t.created_at,
  }
}

/** Map an ActivityLog DB row to the TimelineItem shape. */
function activityToEvent(a: ActivityLog) {
  const iconTone =
    a.entity_type === 'ticket'  ? 'red'    as const :
    a.entity_type === 'machine' ? 'blue'   as const :
    a.entity_type === 'user'    ? 'purple' as const : 'cyan' as const
  return {
    id: a.id,
    type: a.entity_type as 'ticket' | 'machine' | 'user',
    icon_tone: iconTone,
    title: a.details,
    meta: `${a.entity_type} #${a.entity_id}`,
    created_at: a.created_at,
  }
}

// ── empty defaults ─────────────────────────────────────────────────────────────

const EMPTY_STATS: MachineStats = { total: 0, running: 0, idle: 0, down: 0, offline: 0 }

// ── component ─────────────────────────────────────────────────────────────────

/** Command Center — all data from the real backend API. */
export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [machineStats,  setMachineStats]  = useState<MachineStats>(EMPTY_STATS)
  const [machines,      setMachines]      = useState<Machine[]>([])
  const [sessions,      setSessions]      = useState<ProductionSession[]>([])
  const [openTickets,   setOpenTickets]   = useState<Ticket[]>([])
  const [activity,      setActivity]      = useState<ActivityLog[]>([])
  const [loading,       setLoading]       = useState(true)
  // Live machine status overrides from socket — keyed by machine_id
  const [machineStatuses, setMachineStatuses] = useState<Record<number, MachineStatus>>({})

  const today = new Date().toISOString().slice(0, 10)

  const loadAll = useCallback(async () => {
    try {
      const [statsRes, machinesRes, sessionsRes, ticketsRes] = await Promise.all([
        apiClient.get<MachineStats>('/api/v1/machines/stats'),
        apiClient.get<Machine[]>('/api/v1/machines'),
        apiClient.get<ProductionSession[]>(`/api/v1/production-sessions?date=${today}&limit=200`),
        apiClient.get<Ticket[]>('/api/v1/tickets?status=open&limit=50'),
      ])
      setMachineStats(statsRes.data)
      setMachines(machinesRes.data)
      setSessions(sessionsRes.data)
      setOpenTickets(ticketsRes.data)
    } catch { /* keep stale state */ }

    // Activity log — admin only; silently skip for other roles
    try {
      const actRes = await apiClient.get<ActivityLog[]>('/api/v1/activity-log?limit=10')
      setActivity(actRes.data)
    } catch { /* non-admin: no activity log */ }

    setLoading(false)
  }, [today])

  useEffect(() => {
    void loadAll()
    const interval = setInterval(() => { void loadAll() }, 30_000)
    return () => clearInterval(interval)
  }, [loadAll])

  // Live machine status via socket — updates instantly without waiting for poll
  const { lastStatusUpdate } = useProductionSocket({ allMachines: true })
  useEffect(() => {
    if (!lastStatusUpdate) return
    setMachineStatuses((prev) => ({
      ...prev,
      [lastStatusUpdate.machine_id]: lastStatusUpdate.status,
    }))
    // Also patch the stats counters to reflect the new status immediately
    setMachines((prev) => prev.map((m) =>
      m.id === lastStatusUpdate.machine_id ? { ...m, status: lastStatusUpdate.status } : m
    ))
  }, [lastStatusUpdate])

  if (!user) return null

  // ── derived values ──────────────────────────────────────────────────────────

  // Machines actively running sessions today
  const activeMachineIds = new Set(
    sessions.filter((s) => s.status === 'running').map((s) => s.machine_id)
  )
  const inProduction = activeMachineIds.size

  // Total fruits processed today across all sessions
  const totalFruitsToday = sessions.reduce((sum, s) => {
    const v = s.quantity_kg !== null ? parseFloat(String(s.quantity_kg)) : 0
    return sum + (isNaN(v) ? 0 : v)
  }, 0)

  // Open ticket counts by severity
  const p1Count = openTickets.filter((t) => t.severity === 'P1_critical').length
  const p2Count = openTickets.filter((t) => t.severity === 'P2_high').length
  const p3Count = openTickets.filter((t) => t.severity === 'P3_medium').length
  const p4Count = openTickets.filter((t) => t.severity === 'P4_low').length

  // Fleet tiles — up to 8 machines
  const fleetTiles = machines.slice(0, 8)

  // Alerts = open P1 + P2 tickets sorted newest first
  const alertTickets = openTickets
    .filter((t) => t.severity === 'P1_critical' || t.severity === 'P2_high')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-4">
      {/* ── Stat row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard
          accent="blue"
          label="TOTAL MACHINES"
          icon="⚙"
          value={loading ? '—' : machineStats.total}
          sub={`Across ${new Set(machines.map((m) => m.city)).size || '—'} sites`}
        />
        <StatCard
          accent="green"
          label="RUNNING"
          dot="green"
          icon="▶"
          value={loading ? '—' : machineStats.running}
          valueColor="#4ade80"
          sub="machines online"
        />
        <StatCard
          accent="green"
          label="IN PRODUCTION"
          dot="green"
          icon="✦"
          value={loading ? '—' : inProduction}
          valueColor="#4ade80"
          sub="Live TDMS sessions"
        />
        <StatCard
          accent="red"
          label="OPEN TICKETS"
          dot="red"
          icon="⚑"
          value={loading ? '—' : openTickets.length}
          valueColor="#ef4444"
          sub={`${p1Count} P1 Critical · ${openTickets.length - p1Count} open`}
        />
        <StatCard
          accent="cyan"
          label="FRUITS TODAY"
          icon="⚖"
          value={loading ? '—' : Math.round(totalFruitsToday).toLocaleString()}
          valueColor="#22d3ee"
          sub="UI Result Update Count"
        />
      </div>

      {/* ── Fleet + Breakdown row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Machine Fleet tiles */}
        <div className="lg:col-span-2">
          <SectionCard
            title="Machine Fleet"
            link={{ label: 'View all →', onClick: () => navigate('/machines') }}
          >
            {loading ? (
              <p className="text-xs text-fg-5 py-6 text-center">Loading machines…</p>
            ) : fleetTiles.length === 0 ? (
              <p className="text-xs text-fg-5 py-6 text-center">No machines found.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {fleetTiles.map((m) => {
                  // Use live socket status override if available, else DB status
                  const liveStatus = machineStatuses[m.id] ?? m.status
                  const tone = machineTone(liveStatus)
                  // How many sessions today for this machine
                  const machineSessions = sessions.filter((s) => s.machine_id === m.id)
                  const totalFruits = machineSessions.reduce((sum, s) => {
                    const v = s.quantity_kg !== null ? parseFloat(String(s.quantity_kg)) : 0
                    return sum + (isNaN(v) ? 0 : v)
                  }, 0)
                  return (
                    <MachineTile
                      key={m.id}
                      tone={tone}
                      name={m.machine_name}
                      badge={
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-bg-surface3 text-fg-3">
                          {tone.toUpperCase()}
                        </span>
                      }
                      value={totalFruits > 0 ? Math.round(totalFruits).toLocaleString() : '—'}
                      valueColor={totalFruits === 0 ? '#64748b' : undefined}
                      unit={totalFruits > 0 ? `fruits · ${m.city}` : m.city}
                      onClick={() => navigate(`/machines/${m.id}`)}
                    />
                  )
                })}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Fleet Breakdown donut */}
        <SectionCard title="Fleet Breakdown">
          <DonutChart
            centerLabel="machines"
            segments={[
              { label: 'Running', value: machineStats.running, color: '#4ade80' },
              { label: 'Idle',    value: machineStats.idle,    color: '#fbbf24' },
              { label: 'Down',    value: machineStats.down,    color: '#ef4444' },
              { label: 'Offline', value: machineStats.offline, color: '#64748b' },
            ]}
          />
          <div className="mt-3 pt-3 border-t border-line">
            <div className="text-xs font-semibold tracking-wider text-fg-3 uppercase mb-2">
              Tickets by Severity
            </div>
            <SeverityBar p1={p1Count} p2={p2Count} p3={p3Count} p4={p4Count} />
          </div>
        </SectionCard>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity — from activity_log table (admin) or empty for others */}
        <SectionCard title="Recent Activity">
          {activity.length === 0 ? (
            <p className="text-xs text-fg-5 py-6 text-center">
              {user.role === 'admin' ? 'No recent activity.' : 'Activity log visible to admins only.'}
            </p>
          ) : (
            <div>
              {activity.slice(0, 5).map((e) => (
                <TimelineItem
                  key={e.id}
                  event={activityToEvent(e)}
                  timeAgo={formatRelative(e.created_at)}
                />
              ))}
            </div>
          )}
        </SectionCard>

        {/* Live Alerts — from open P1/P2 tickets */}
        <SectionCard
          title="Live Alerts"
          link={{ label: 'View all →', onClick: () => navigate('/tickets') }}
        >
          {alertTickets.length === 0 ? (
            <p className="text-xs text-fg-5 py-6 text-center">
              No critical or high-priority tickets open.
            </p>
          ) : (
            <div className="space-y-2">
              {alertTickets.map((t) => (
                <AlertRow
                  key={t.id}
                  alert={ticketToAlert(t)}
                  timeAgo={formatRelative(t.created_at)}
                />
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
