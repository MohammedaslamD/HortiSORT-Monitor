import { useState, useEffect } from 'react'

import type { DailyLog, Machine, DailyLogStatus } from '../types'
import { useAuth } from '../context/AuthContext'
import { getAllDailyLogs } from '../services/dailyLogService'
import { getMachinesByRole } from '../services/machineService'
import { getUserName } from '../utils/userLookup'
import { DailyLogCard } from '../components/logs'
import { Select, Input } from '../components/common'

// -----------------------------------------------------------------------------
// Filter options
// -----------------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'running', label: 'Running' },
  { value: 'not_running', label: 'Not Running' },
  { value: 'maintenance', label: 'Maintenance' },
]

/**
 * Daily logs page with role-scoped data and machine/date/status filters.
 *
 * - admin: sees all logs
 * - engineer: sees logs where updated_by === user.id
 * - customer: sees logs for their machines (via getMachinesByRole)
 *
 * No create button — log creation happens through UpdateStatusPage.
 */
export function DailyLogsPage() {
  const { user } = useAuth()

  // Data state
  const [allLogs, setAllLogs] = useState<DailyLog[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [machineFilter, setMachineFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<DailyLogStatus | ''>('')

  // Fetch data on mount, scoped by role
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

        let scopedLogs: DailyLog[]
        if (user!.role === 'admin') {
          scopedLogs = fetchedLogs
        } else if (user!.role === 'engineer') {
          /* Engineer sees logs they recorded */
          scopedLogs = fetchedLogs.filter((l) => l.updated_by === user!.id)
        } else {
          /* Customer sees logs for their machines */
          scopedLogs = fetchedLogs.filter((l) => machineIdSet.has(l.machine_id))
        }

        setAllLogs(scopedLogs)
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

  // Lookup maps
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

  // Client-side filtering
  const filteredLogs = allLogs.filter((l) => {
    if (machineFilter && l.machine_id !== Number(machineFilter)) return false
    if (dateFilter && l.date !== dateFilter) return false
    if (statusFilter && l.status !== statusFilter) return false
    return true
  })

  if (!user) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <h2 className="text-xl font-semibold text-gray-900">Daily Logs</h2>

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
            <div className="w-full sm:w-44">
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                placeholder="Filter by date"
              />
            </div>
            <div className="w-full sm:w-40">
              <Select
                options={STATUS_OPTIONS}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as DailyLogStatus | '')}
              />
            </div>
          </div>

          {/* Results or empty state */}
          {filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center py-12 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
              <p className="text-gray-500 text-sm">No logs found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <DailyLogCard
                  key={log.id}
                  log={log}
                  machineName={machineNameMap[log.machine_id] ?? 'Unknown'}
                  machineCode={machineCodeMap[log.machine_id] ?? '—'}
                  recordedByName={getUserName(log.updated_by)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
