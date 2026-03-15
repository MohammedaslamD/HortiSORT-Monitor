import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import type { Machine, MachineStatus } from '../types'
import { useAuth } from '../context/AuthContext'
import { getMachinesByRole } from '../services/machineService'
import { MachineCard } from '../components/machines/MachineCard'
import { Input, Select } from '../components/common'

/** Status filter options for the dropdown. */
const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'running', label: 'Running' },
  { value: 'idle', label: 'Idle' },
  { value: 'down', label: 'Down' },
  { value: 'offline', label: 'Offline' },
]

/**
 * Enhanced machine list page with search, status, model, and city filters.
 *
 * - Fetches machines scoped to the current user's role via getMachinesByRole.
 * - Model and city options are computed dynamically from fetched data.
 * - Reuses MachineCard with todayLog=undefined and openTicketCount=0.
 * - Role-based action buttons for engineer/admin.
 */
export function MachinesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Data state
  const [machines, setMachines] = useState<Machine[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<MachineStatus | ''>('')
  const [modelFilter, setModelFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')

  // Fetch machines on mount
  useEffect(() => {
    if (!user) return

    let cancelled = false

    async function fetchData() {
      setIsLoading(true)
      setError(null)

      try {
        const fetchedMachines = await getMachinesByRole()
        if (cancelled) return
        setMachines(fetchedMachines)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load machines.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [user])

  // Dynamic model options — derived from fetched machines
  const modelOptions = useMemo(() => {
    const models = [...new Set(machines.map((m) => m.model))].sort()
    return [
      { value: '', label: 'All Models' },
      ...models.map((model) => ({ value: model, label: model })),
    ]
  }, [machines])

  // Dynamic city options — derived from fetched machines
  const cityOptions = useMemo(() => {
    const cities = [...new Set(machines.map((m) => m.city))].sort()
    return [
      { value: '', label: 'All Cities' },
      ...cities.map((city) => ({ value: city, label: city })),
    ]
  }, [machines])

  // Client-side filtering — all filters AND-combined
  const filteredMachines = useMemo(() => {
    return machines.filter((m) => {
      if (statusFilter && m.status !== statusFilter) return false
      if (modelFilter && m.model !== modelFilter) return false
      if (cityFilter && m.city !== cityFilter) return false

      if (search) {
        const term = search.toLowerCase()
        const matchesSearch =
          m.machine_code.toLowerCase().includes(term) ||
          m.machine_name.toLowerCase().includes(term) ||
          m.city.toLowerCase().includes(term) ||
          m.state.toLowerCase().includes(term)
        if (!matchesSearch) return false
      }

      return true
    })
  }, [machines, statusFilter, modelFilter, cityFilter, search])

  // Navigation handlers
  const handleNavigate = useCallback(
    (machineId: number) => navigate(`/machines/${machineId}`),
    [navigate],
  )

  const handleUpdateStatus = useCallback(
    (machineId: number) => navigate(`/machines/${machineId}/update-status`),
    [navigate],
  )

  const handleRaiseTicket = useCallback(
    (machineId: number) => navigate(`/tickets/new?machine=${machineId}`),
    [navigate],
  )

  if (!user) return null

  const userRole = user.role

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Machines</h2>
        <span className="text-sm text-gray-500">
          {filteredMachines.length} {filteredMachines.length === 1 ? 'machine' : 'machines'}
        </span>
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
          {/* Filter row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search machines, cities, states..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="search"
              />
            </div>
            <div className="w-full sm:w-44">
              <Select
                options={STATUS_OPTIONS}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as MachineStatus | '')}
              />
            </div>
            <div className="w-full sm:w-44">
              <Select
                options={modelOptions}
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-44">
              <Select
                options={cityOptions}
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              />
            </div>
          </div>

          {/* Machine grid or empty state */}
          {filteredMachines.length === 0 ? (
            <div className="flex items-center justify-center py-12 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
              <p className="text-gray-500 text-sm">No machines found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMachines.map((machine) => (
                <MachineCard
                  key={machine.id}
                  machine={machine}
                  todayLog={undefined}
                  openTicketCount={0}
                  userRole={userRole}
                  onNavigate={handleNavigate}
                  onUpdateStatus={
                    userRole !== 'customer' ? handleUpdateStatus : undefined
                  }
                  onRaiseTicket={
                    userRole !== 'customer' ? handleRaiseTicket : undefined
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
