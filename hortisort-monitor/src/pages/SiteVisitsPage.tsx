import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import type { SiteVisit, Machine, VisitPurpose } from '../types'
import { useAuth } from '../context/AuthContext'
import { getAllSiteVisits } from '../services/siteVisitService'
import { getMachinesByRole } from '../services/machineService'
import { getUserName } from '../utils/userLookup'
import { SiteVisitCard } from '../components/visits'
import { Button, Select } from '../components/common'
import { MOCK_USERS } from '../data/mockData'

// -----------------------------------------------------------------------------
// Filter options
// -----------------------------------------------------------------------------

const PURPOSE_OPTIONS = [
  { value: '', label: 'All Purposes' },
  { value: 'routine', label: 'Routine' },
  { value: 'ticket', label: 'Ticket' },
  { value: 'installation', label: 'Installation' },
  { value: 'training', label: 'Training' },
]

/**
 * Site visits page with role-scoped data and machine/purpose/engineer filters.
 *
 * - admin: sees all visits, gets an engineer filter dropdown
 * - engineer: sees own visits only
 *
 * "Log Visit" button links to /visits/new.
 */
export function SiteVisitsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Data state
  const [allVisits, setAllVisits] = useState<SiteVisit[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [machineFilter, setMachineFilter] = useState('')
  const [purposeFilter, setPurposeFilter] = useState<VisitPurpose | ''>('')
  const [engineerFilter, setEngineerFilter] = useState('')

  // Fetch data on mount, scoped by role
  useEffect(() => {
    if (!user) return

    let cancelled = false

    async function fetchData() {
      setIsLoading(true)
      setError(null)

      try {
        /* Engineer sees own visits; admin sees all */
        const filters = user!.role === 'engineer'
          ? { engineerId: user!.id }
          : undefined

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

  // Lookup maps for card props
  const machineNameMap: Record<number, string> = {}
  const machineCodeMap: Record<number, string> = {}
  for (const m of machines) {
    machineNameMap[m.id] = m.machine_name
    machineCodeMap[m.id] = m.machine_code
  }

  // Machine filter options
  const machineFilterOptions = [
    { value: '', label: 'All Machines' },
    ...machines.map((m) => ({
      value: String(m.id),
      label: `${m.machine_code} — ${m.machine_name}`,
    })),
  ]

  // Engineer filter options — admin only, list all engineers from MOCK_USERS
  const engineerFilterOptions = [
    { value: '', label: 'All Engineers' },
    ...MOCK_USERS
      .filter((u) => u.role === 'engineer')
      .map((u) => ({
        value: String(u.id),
        label: u.name,
      })),
  ]

  // Client-side filtering
  const filteredVisits = allVisits.filter((v) => {
    if (machineFilter && v.machine_id !== Number(machineFilter)) return false
    if (purposeFilter && v.visit_purpose !== purposeFilter) return false
    if (engineerFilter && v.engineer_id !== Number(engineerFilter)) return false
    return true
  })

  if (!user) return null

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Site Visits</h2>
        <Button variant="primary" onClick={() => navigate('/visits/new')}>
          Log Visit
        </Button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      ) : (
        <>
          {/* Filters row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="w-full sm:w-56">
              <Select
                options={machineFilterOptions}
                value={machineFilter}
                onChange={(e) => setMachineFilter(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-40">
              <Select
                options={PURPOSE_OPTIONS}
                value={purposeFilter}
                onChange={(e) => setPurposeFilter(e.target.value as VisitPurpose | '')}
              />
            </div>
            {/* Engineer filter — admin only */}
            {user.role === 'admin' && (
              <div className="w-full sm:w-48">
                <Select
                  options={engineerFilterOptions}
                  value={engineerFilter}
                  onChange={(e) => setEngineerFilter(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Results or empty state */}
          {filteredVisits.length === 0 ? (
            <div className="flex items-center justify-center py-12 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
              <p className="text-gray-500 text-sm">No site visits found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVisits.map((visit) => (
                <SiteVisitCard
                  key={visit.id}
                  visit={visit}
                  machineName={machineNameMap[visit.machine_id] ?? 'Unknown'}
                  machineCode={machineCodeMap[visit.machine_id] ?? '—'}
                  engineerName={getUserName(visit.engineer_id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
