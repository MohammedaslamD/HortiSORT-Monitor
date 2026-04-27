import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLivePolling } from '../hooks/useLivePolling'
import { liveMetricsService } from '../services/liveMetricsService'
import { alertService } from '../services/alertService'
import { activityService } from '../services/activityService'
import {
  StatCard, SectionCard, MachineTile, Sparkline, DonutChart, SeverityBar,
  AlertRow, TimelineItem,
} from '../components/dark'
import { formatRelative } from '../utils/formatRelative'
import type { FleetSummary, MachineLiveMetrics, ThroughputPoint, Alert, ActivityEvent } from '../types'

const EMPTY_FLEET: FleetSummary = {
  total_machines: 0, running: 0, idle: 0, down: 0, offline: 0,
  in_production: 0, today_throughput_tons: 0,
  trend_running_vs_yesterday: 0, trend_throughput_pct: 0,
  open_tickets: { total: 0, p1: 0, p2: 0, p3: 0, p4: 0 },
}

/** Command Center: live fleet snapshot per dark-ui-v2.html. */
export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // One-shot fetches: fleet summary + machine metrics + activity
  const [fleet, setFleet] = useState<FleetSummary>(EMPTY_FLEET)
  const [metrics, setMetrics] = useState<MachineLiveMetrics[]>([])
  const [activity, setActivity] = useState<ActivityEvent[]>([])

  useEffect(() => {
    void liveMetricsService.getFleetSummary().then(setFleet)
    void liveMetricsService.getMachineMetrics().then(setMetrics)
    void activityService.getActivity().then(setActivity)
  }, [])

  // Polled fetches: throughput (5 s), alerts (30 s)
  const sparkline = useLivePolling<ThroughputPoint[]>(
    () => liveMetricsService.getThroughputSeries(new Date()), 5_000, [],
  )
  const alerts = useLivePolling<Alert[]>(alertService.getAlerts, 30_000, [])

  const peak = useMemo(() => sparkline.data.reduce((m, p) => Math.max(m, p.actual), 0), [sparkline.data])
  const avg = useMemo(() => {
    if (sparkline.data.length === 0) return 0
    return sparkline.data.reduce((s, p) => s + p.actual, 0) / sparkline.data.length
  }, [sparkline.data])
  const nowVal = sparkline.data[sparkline.data.length - 1]?.actual ?? 0

  if (!user) return null

  const fleetTiles = metrics.slice(0, 8)
  const tilesTone = (m: MachineLiveMetrics) => {
    if (m.tons_per_hour === null && m.uptime_percent === 0) return 'offline' as const
    if (m.tons_per_hour === null && m.progress_percent < 50) return 'down' as const
    if (m.tons_per_hour === null) return 'idle' as const
    return 'running' as const
  }

  return (
    <div className="space-y-4">
      {/* Stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard accent="blue"  label="TOTAL MACHINES" icon={'\u2699'} value={fleet.total_machines} sub="Across 4 sites" />
        <StatCard accent="green" label="RUNNING" dot="green" icon={'\u25B6'} value={fleet.running} valueColor="#4ade80"
          trend={fleet.trend_running_vs_yesterday >= 0 ? { direction: 'up', value: `${fleet.trend_running_vs_yesterday}` } : { direction: 'down', value: `${Math.abs(fleet.trend_running_vs_yesterday)}` }}
          sub="from yesterday" />
        <StatCard accent="green" label="IN PRODUCTION" dot="green" icon={'\u2638'} value={fleet.in_production} valueColor="#4ade80" sub="Live TDMS sessions" />
        <StatCard accent="red"   label="OPEN TICKETS" dot="red" icon={'\u2691'} value={fleet.open_tickets.total} valueColor="#ef4444"
          sub={`${fleet.open_tickets.p1} P1 Critical \u00B7 ${fleet.open_tickets.total - fleet.open_tickets.p1} open`} />
        <StatCard accent="cyan"  label="TODAY THROUGHPUT" icon={'\u2696'}
          value={<>{fleet.today_throughput_tons}<span className="text-sm text-fg-4"> t</span></>}
          valueColor="#22d3ee"
          trend={{ direction: fleet.trend_throughput_pct >= 0 ? 'up' : 'down', value: `${Math.abs(fleet.trend_throughput_pct)}%` }}
          sub="vs avg" />
      </div>

      {/* Fleet + Throughput row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SectionCard title="Machine Fleet" link={{ label: 'View all \u2192', onClick: () => navigate('/machines') }}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {fleetTiles.map((m) => (
                <MachineTile
                  key={m.machine_id}
                  tone={tilesTone(m)}
                  name={`M-${String(m.machine_id).padStart(3, '0')}`}
                  badge={<span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-bg-surface3 text-fg-3">{tilesTone(m).toUpperCase()}</span>}
                  value={m.tons_per_hour ?? '--'}
                  valueColor={m.tons_per_hour === null ? '#64748b' : undefined}
                  unit={m.tons_per_hour !== null && m.current_fruit ? `t/hr \u00B7 ${m.current_fruit}` : (m.current_fruit ?? 'Offline')}
                  progressPercent={tilesTone(m) === 'offline' ? undefined : m.progress_percent}
                  progressTone={tilesTone(m) === 'down' ? 'red' : tilesTone(m) === 'idle' ? 'amber' : 'green'}
                  onClick={() => navigate(`/machines/${m.machine_id}`)}
                />
              ))}
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Live Throughput" meta="LAST 30 MIN">
          <Sparkline points={sparkline.data} />
          <div className="flex gap-5 mt-2 pt-2 border-t border-line text-xs">
            <div><div className="text-[10px] text-fg-4">PEAK</div><div className="font-extrabold text-brand-cyan">{peak.toFixed(1)} t/hr</div></div>
            <div><div className="text-[10px] text-fg-4">AVG</div><div className="font-extrabold text-fg-3">{avg.toFixed(1)} t/hr</div></div>
            <div><div className="text-[10px] text-fg-4">NOW</div><div className="font-extrabold text-brand-green">{nowVal.toFixed(1)} t/hr</div></div>
          </div>
        </SectionCard>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard title="Fleet Breakdown">
          <DonutChart
            centerLabel="machines"
            segments={[
              { label: 'Running', value: fleet.running, color: '#4ade80' },
              { label: 'Idle',    value: fleet.idle,    color: '#fbbf24' },
              { label: 'Down',    value: fleet.down,    color: '#ef4444' },
              { label: 'Offline', value: fleet.offline, color: '#64748b' },
            ]}
          />
          <div className="mt-3 pt-3 border-t border-line">
            <div className="text-xs font-semibold tracking-wider text-fg-3 uppercase mb-2">Tickets by Severity</div>
            <SeverityBar p1={fleet.open_tickets.p1} p2={fleet.open_tickets.p2} p3={fleet.open_tickets.p3} p4={fleet.open_tickets.p4} />
          </div>
        </SectionCard>

        <SectionCard title="Recent Activity" link={{ label: 'View timeline \u2192', onClick: () => { /* future */ } }}>
          <div>
            {activity.slice(0, 5).map((e) => (
              <TimelineItem key={e.id} event={e} timeAgo={formatRelative(e.created_at)} />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Live Alerts" link={{ label: 'View all \u2192', onClick: () => navigate('/tickets') }}>
          <div className="space-y-2">
            {alerts.data.slice(0, 5).map((a) => (
              <AlertRow key={a.id} alert={a} timeAgo={formatRelative(a.created_at)} />
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
