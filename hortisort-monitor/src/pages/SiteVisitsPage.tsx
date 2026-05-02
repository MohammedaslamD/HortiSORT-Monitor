import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import type { SiteVisit, Machine, VisitPurpose } from '../types'
import { useAuth } from '../context/AuthContext'
import { getAllSiteVisits } from '../services/siteVisitService'
import { getMachinesByRole } from '../services/machineService'
import { getUserName } from '../utils/userLookup'
import { computeSiteVisitStats } from '../utils/siteVisitStats'
import {
  StatCard,
  SectionCard,
  StatBadge,
  VisitCard,
  type StatBadgeVariant,
} from '../components/dark'

const PURPOSE_BADGE: Record<VisitPurpose, { variant: StatBadgeVariant; label: string }> = {
  routine:      { variant: 'routine',   label: 'Routine' },
  ticket:       { variant: 'emergency', label: 'Emergency' },
  installation: { variant: 'install',   label: 'Installation' },
  training:     { variant: 'engineer',  label: 'Training' },
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatVisitDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/**
 * Phase B Site Visits page — 4 derived stat cards + dense `VisitCard`
 * list per `dark-ui-v2.html` lines 636-703. Filters from the legacy
 * page are dropped per spec §7 row 6.
 *
 * Role scoping is preserved verbatim from the prior implementation:
 * - admin sees all visits
 * - engineer sees only their own visits (engineerId filter)
 * - customer is gated out by routing (page is admin/engineer only)
 */
export function SiteVisitsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [allVisits, setAllVisits] = useState<SiteVisit[]>([])
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
        const filters = user!.role === 'engineer' ? { engineerId: user!.id } : undefined
        const [fetchedVisits, fetchedMachines] = await Promise.all([
          getAllSiteVisits(filters),
          getMachinesByRole(),
        ])
        if (cancelled) return
        setAllVisits(fetchedVisits)
        setMachines(fetchedMachines)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load site visits.')
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

  const stats = computeSiteVisitStats(allVisits)

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-fg-1">Site Visits</h1>
          <p className="text-sm text-fg-4">Engineer on-site visit records</p>
        </div>
        {user.role !== 'customer' && (
          <button
            type="button"
            onClick={() => navigate('/visits/new')}
            className="bg-brand-cyan text-bg font-semibold text-xs rounded px-3 py-1.5 hover:opacity-90"
          >
            + Log Visit
          </button>
        )}
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          accent="blue"
          label="Visits This Month"
          value={stats.visits_this_month}
          icon={<>{'\u2691'}</>}
        />
        <StatCard
          accent="red"
          label="Emergency"
          value={stats.emergency_count}
          valueColor="#ef4444"
          icon={<>{'\u26A0'}</>}
        />
        <StatCard
          accent="green"
          label="Routine"
          value={stats.routine_count}
          valueColor="#4ade80"
          icon={<>{'\u2699'}</>}
        />
        <StatCard
          accent="purple"
          label="Due This Week"
          value={stats.due_this_week}
          valueColor="#a78bfa"
          icon={<>{'\u23F0'}</>}
        />
      </div>

      <SectionCard title="Recent Site Visits">
        {isLoading ? (
          <p className="text-sm text-fg-6 py-8 text-center">Loading…</p>
        ) : allVisits.length === 0 ? (
          <p className="text-sm text-fg-6 py-8 text-center">No site visits found.</p>
        ) : (
          <div>
            {allVisits.map((v) => {
              const badge = PURPOSE_BADGE[v.visit_purpose]
              const machineLabel = `${machineCodeMap[v.machine_id] ?? '#' + v.machine_id} ${machineNameMap[v.machine_id] ?? ''}`.trim()
              const ticketLink = v.ticket_id ? ` · Linked to TK-${String(v.ticket_id).padStart(4, '0')}` : ''
              return (
                <VisitCard
                  key={v.id}
                  title={`${machineLabel} — ${badge.label}`}
                  meta={`${getUserName(v.engineer_id)} · ${formatVisitDate(v.visit_date)}${ticketLink}`}
                  purposeBadge={<StatBadge variant={badge.variant}>{badge.label}</StatBadge>}
                  findings={v.findings}
                  actions={v.actions_taken}
                  partsReplaced={v.parts_replaced || 'None'}
                  nextVisitDue={v.next_visit_due ? formatVisitDate(v.next_visit_due) : '—'}
                />
              )
            })}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
