import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import type { Machine, MachineStatus, MachineStats, DailyLog, Ticket } from '../types';
import { useAuth } from '../context/AuthContext';
import { getMachinesByRole } from '../services/machineService';
import { getTickets } from '../services/ticketService';
import { getDailyLogs } from '../services/dailyLogService';
import { StatsCards, MachineStatusChart, TicketSeverityChart, ThroughputChart } from '../components/dashboard'
import { MachineCard } from '../components/machines/MachineCard';
import { Input, Select } from '../components/common';

/** Active ticket statuses used to compute per-machine open ticket counts. */
const ACTIVE_TICKET_STATUSES = ['open', 'in_progress', 'reopened'] as const;

/** Status filter options for the dropdown. */
const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'running', label: 'Running' },
  { value: 'idle', label: 'Idle' },
  { value: 'down', label: 'Down' },
  { value: 'offline', label: 'Offline' },
];

/**
 * Main dashboard page displaying machine stats, filters, and a grid of machine cards.
 *
 * - Fetches machines scoped to the current user's role.
 * - Fetches all tickets and daily logs to compute per-machine metrics.
 * - Supports client-side search and status filtering.
 * - Provides role-appropriate action buttons on each machine card.
 */
export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ---------------------------------------------------------------------------
  // Raw data state (fetched once on mount)
  // ---------------------------------------------------------------------------
  const [machines, setMachines] = useState<Machine[]>([]);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [allDailyLogs, setAllDailyLogs] = useState<DailyLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Filter state
  // ---------------------------------------------------------------------------
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<MachineStatus | ''>('');

  // ---------------------------------------------------------------------------
  // Fetch all data on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        const [fetchedMachines, fetchedTickets, fetchedLogs] = await Promise.all([
          getMachinesByRole(),
          getTickets(),
          getDailyLogs(),
        ]);

        if (cancelled) return;

        setMachines(fetchedMachines);
        setAllTickets(fetchedTickets);
        setAllDailyLogs(fetchedLogs);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [user]);

  // ---------------------------------------------------------------------------
  // Derived: client-side filtering
  // ---------------------------------------------------------------------------
  const filteredMachines = machines.filter((m) => {
    // Status filter
    if (statusFilter && m.status !== statusFilter) return false;

    // Search filter (machine_code, name, city, state)
    if (search) {
      const term = search.toLowerCase();
      const matchesSearch =
        m.machine_code.toLowerCase().includes(term) ||
        m.machine_name.toLowerCase().includes(term) ||
        m.city.toLowerCase().includes(term) ||
        m.state.toLowerCase().includes(term);
      if (!matchesSearch) return false;
    }

    return true;
  });

  // Stats are computed from filtered results so cards + stats stay in sync
  const stats: MachineStats = {
    total: filteredMachines.length,
    running: filteredMachines.filter((m) => m.status === 'running').length,
    idle: filteredMachines.filter((m) => m.status === 'idle').length,
    down: filteredMachines.filter((m) => m.status === 'down').length,
    offline: filteredMachines.filter((m) => m.status === 'offline').length,
  };

  // Global open ticket count (across all user-visible machines, unfiltered)
  const openTicketCount = allTickets.filter((t) =>
    (ACTIVE_TICKET_STATUSES as readonly string[]).includes(t.status) &&
    machines.some((m) => m.id === t.machine_id),
  ).length;

  // Full fleet stats for MachineStatusChart — always unfiltered, unaffected by search/status filter
  const allMachinesStats: MachineStats = {
    total:   machines.length,
    running: machines.filter((m) => m.status === 'running').length,
    idle:    machines.filter((m) => m.status === 'idle').length,
    down:    machines.filter((m) => m.status === 'down').length,
    offline: machines.filter((m) => m.status === 'offline').length,
  }

  // Last 7 days of logs for ThroughputChart
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const last7DaysLogs = allDailyLogs.filter(
    (log) => new Date(log.date) >= sevenDaysAgo,
  )

  // ---------------------------------------------------------------------------
  // Per-machine helpers
  // ---------------------------------------------------------------------------
  const getOpenTicketCountForMachine = useCallback(
    (machineId: number): number =>
      allTickets.filter(
        (t) =>
          t.machine_id === machineId &&
          (ACTIVE_TICKET_STATUSES as readonly string[]).includes(t.status),
      ).length,
    [allTickets],
  );

  const getTodayLogForMachine = useCallback(
    (machineId: number): DailyLog | undefined => {
      const today = new Date().toISOString().split('T')[0]
      return allDailyLogs.find((log) => log.machine_id === machineId && log.date === today)
    },
    [allDailyLogs],
  );

  // ---------------------------------------------------------------------------
  // Navigation handlers
  // ---------------------------------------------------------------------------
  const handleNavigate = useCallback(
    (machineId: number) => navigate(`/machines/${machineId}`),
    [navigate],
  );

  const handleUpdateStatus = useCallback(
    (machineId: number) => navigate(`/machines/${machineId}/update-status`),
    [navigate],
  );

  const handleRaiseTicket = useCallback(
    (machineId: number) => navigate(`/tickets/new?machine=${machineId}`),
    [navigate],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (!user) return null;

  const userRole = user.role;

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>

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
          {/* Stats cards row */}
          <StatsCards stats={stats} openTicketCount={openTicketCount} />

          {/* Charts section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MachineStatusChart stats={allMachinesStats} />
            {user.role !== 'customer' && (
              <TicketSeverityChart tickets={allTickets} />
            )}
          </div>
          <ThroughputChart logs={last7DaysLogs} />

          {/* Filter / search bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search machines, cities, states..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="search"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                options={STATUS_OPTIONS}
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as MachineStatus | '')
                }
              />
            </div>
          </div>

          {/* Machine grid or empty state */}
          {filteredMachines.length === 0 ? (
            <div className="flex items-center justify-center py-12 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
              <p className="text-gray-500 text-sm">No machines found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredMachines.map((machine) => (
                <MachineCard
                  key={machine.id}
                  machine={machine}
                  todayLog={getTodayLogForMachine(machine.id)}
                  openTicketCount={getOpenTicketCountForMachine(machine.id)}
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
  );
}
