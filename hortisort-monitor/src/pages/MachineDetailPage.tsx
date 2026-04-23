import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

import type {
  Machine,
  DailyLog,
  Ticket,
  SiteVisit,
  MachineHistory,
  DailyLogStatus,
  TicketStatus,
  VisitPurpose,
  ChangeType,
  ProductionSession,
} from '../types';
import { useAuth } from '../context/AuthContext';
import { getMachineById } from '../services/machineService';
import { getDailyLogsByMachineId } from '../services/dailyLogService';
import { getTicketsByMachineId } from '../services/ticketService';
import { getSiteVisitsByMachineId } from '../services/siteVisitService';
import { getHistoryByMachineId } from '../services/machineHistoryService';
import { getTodaySessions } from '../services/productionSessionService';
import { useProductionSocket } from '../hooks/useProductionSocket';
import { getUserName } from '../utils/userLookup';
import { formatRelativeTime, getStatusBadgeColor, getSeverityBadgeColor } from '../utils/formatters';
import { Badge, Button } from '../components/common';
import { ProductionLotTable } from '../components/production';

// -----------------------------------------------------------------------------
// Tab types
// -----------------------------------------------------------------------------

/** Available tabs on the machine detail page. */
type TabKey = 'production' | 'tickets' | 'visits' | 'history';

interface TabDef {
  key: TabKey;
  label: string;
}

const TABS: TabDef[] = [
  { key: 'production', label: 'Production History' },
  { key: 'tickets', label: 'Tickets' },
  { key: 'visits', label: 'Site Visits' },
  { key: 'history', label: 'Machine History' },
];

// -----------------------------------------------------------------------------
// Display-label maps
// -----------------------------------------------------------------------------

const DAILY_LOG_STATUS_LABEL: Record<DailyLogStatus, string> = {
  running: 'Running',
  not_running: 'Not Running',
  maintenance: 'Maintenance',
};

const VISIT_PURPOSE_LABEL: Record<VisitPurpose, string> = {
  routine: 'Routine',
  ticket: 'Ticket',
  installation: 'Installation',
  training: 'Training',
};

const CHANGE_TYPE_LABEL: Record<ChangeType, string> = {
  location_change: 'Location Change',
  status_change: 'Status Change',
  engineer_change: 'Engineer Change',
  software_update: 'Software Update',
};

// -----------------------------------------------------------------------------
// Badge-color helpers
// -----------------------------------------------------------------------------

/** Map DailyLogStatus to Badge color. */
function getDailyLogStatusColor(status: DailyLogStatus): 'green' | 'yellow' | 'red' {
  const map: Record<DailyLogStatus, 'green' | 'yellow' | 'red'> = {
    running: 'green',
    not_running: 'red',
    maintenance: 'yellow',
  };
  return map[status];
}

/** Map TicketStatus to Badge color. */
function getTicketStatusColor(status: TicketStatus): 'green' | 'yellow' | 'red' | 'gray' {
  const map: Record<TicketStatus, 'green' | 'yellow' | 'red' | 'gray'> = {
    open: 'red',
    in_progress: 'yellow',
    resolved: 'green',
    closed: 'gray',
    reopened: 'red',
  };
  return map[status];
}

/** Map VisitPurpose to Badge color. */
function getVisitPurposeColor(purpose: VisitPurpose): 'green' | 'yellow' | 'blue' | 'purple' {
  const map: Record<VisitPurpose, 'green' | 'yellow' | 'blue' | 'purple'> = {
    routine: 'green',
    ticket: 'yellow',
    installation: 'blue',
    training: 'purple',
  };
  return map[purpose];
}

/** Format an ISO date string to a readable date. */
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// =============================================================================
// Main component
// =============================================================================

/**
 * Detailed view for a single machine.
 *
 * Shows machine info header, today's production, and tabbed sections for
 * production history, tickets, site visits, and machine history.
 * Includes role-based action buttons for engineers and admins.
 * Handles invalid machine IDs with a "not found" state.
 */
export function MachineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [machine, setMachine] = useState<Machine | null>(null);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>([]);
  const [history, setHistory] = useState<MachineHistory[]>([]);
  const [sessions, setSessions] = useState<ProductionSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('production');

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!user || !id) return;

    const machineId = Number(id);
    if (Number.isNaN(machineId)) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchAll() {
      setIsLoading(true);
      setNotFound(false);

      try {
        const found = await getMachineById(machineId);

        if (cancelled) return;

        if (!found) {
          setNotFound(true);
          setIsLoading(false);
          return;
        }

        setMachine(found);

        const [logs, tkts, visits, hist] = await Promise.all([
          getDailyLogsByMachineId(machineId),
          getTicketsByMachineId(machineId),
          getSiteVisitsByMachineId(machineId),
          getHistoryByMachineId(machineId),
        ]);

        // Fetch today's TDMS sessions (non-critical — don't fail whole page if this errors)
        const today = new Date().toISOString().slice(0, 10);
        const todaySessions = await getTodaySessions(machineId, today).catch(() => []);

        if (cancelled) return;

        // Production history: sorted by date descending
        setDailyLogs([...logs].sort((a, b) => b.date.localeCompare(a.date)));
        // Tickets: sorted by created_at descending
        setTickets([...tkts].sort((a, b) => b.created_at.localeCompare(a.created_at)));
        setSiteVisits(visits);
        setHistory(hist);
        setSessions(todaySessions);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetchAll();
    return () => { cancelled = true; };
  }, [user, id]);

  // ---------------------------------------------------------------------------
  // Derived: today's log
  // ---------------------------------------------------------------------------
  const today = new Date().toISOString().slice(0, 10);
  const todayLog = dailyLogs.find((l) => l.date === today);

  // ---------------------------------------------------------------------------
  // Live TDMS session updates via Socket.io
  // ---------------------------------------------------------------------------
  const machineId = id ? Number(id) : undefined;
  const { lastSession } = useProductionSocket({ machineId: machineId && !Number.isNaN(machineId) ? machineId : undefined });
  useEffect(() => {
    if (!lastSession) return;
    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.lot_number === lastSession.lot_number);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = lastSession;
        return updated;
      }
      return [lastSession, ...prev];
    });
  }, [lastSession]);

  // ---------------------------------------------------------------------------
  // Loading state (Step 10)
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary-600" />
          <p className="mt-3 text-sm text-gray-500">Loading machine details...</p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Not-found state (Step 9)
  // ---------------------------------------------------------------------------
  if (notFound || !machine) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="rounded-full bg-red-100 p-4">
          <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Machine not found</h2>
        <p className="text-sm text-gray-500">
          The machine you're looking for doesn't exist or you don't have access to it.
        </p>
        <Link
          to="/"
          className="text-sm font-medium text-primary-600 hover:text-primary-700 underline"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const isEngineerOrAdmin = user?.role === 'engineer' || user?.role === 'admin';

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Back link */}
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        &larr; Back
      </button>

      {/* Step 1: Machine info header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <p className="text-xs font-mono text-gray-400 mb-0.5">{machine.machine_code}</p>
            <h2 className="text-xl font-bold text-gray-900">{machine.machine_name}</h2>
            <p className="text-sm text-gray-500">
              {machine.model} &bull; SN: {machine.serial_number}
            </p>
          </div>
          <Badge color={getStatusBadgeColor(machine.status)} size="md">
            {machine.status.charAt(0).toUpperCase() + machine.status.slice(1)}
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
          <div>
            <span className="text-gray-500">Customer</span>
            <p className="font-medium text-gray-900">{getUserName(machine.customer_id)}</p>
          </div>
          <div>
            <span className="text-gray-500">Engineer</span>
            <p className="font-medium text-gray-900">{getUserName(machine.engineer_id)}</p>
          </div>
          <div>
            <span className="text-gray-500">Location</span>
            <p className="font-medium text-gray-900 text-xs leading-tight">{machine.location}</p>
          </div>
          <div>
            <span className="text-gray-500">City / State</span>
            <p className="font-medium text-gray-900">{machine.city}, {machine.state}</p>
          </div>
          <div>
            <span className="text-gray-500">Installed</span>
            <p className="font-medium text-gray-900">{formatDate(machine.installation_date)}</p>
          </div>
          <div>
            <span className="text-gray-500">Last Updated</span>
            <p className="font-medium text-gray-900">{formatRelativeTime(machine.last_updated)}</p>
          </div>
          <div>
            <span className="text-gray-500">Updated By</span>
            <p className="font-medium text-gray-900">{getUserName(machine.last_updated_by)}</p>
          </div>
        </div>
      </div>

      {/* Step 2: Today's production */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Today's Production</h3>
          {sessions.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs text-green-600">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
          )}
        </div>
        {todayLog ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
            <div>
              <span className="text-gray-500">Fruit Type</span>
              <p className="font-medium text-gray-900">{todayLog.fruit_type}</p>
            </div>
            <div>
              <span className="text-gray-500">Tons Processed</span>
              <p className="font-medium text-gray-900">{todayLog.tons_processed} t</p>
            </div>
            <div>
              <span className="text-gray-500">Status</span>
              <p className="mt-0.5">
                <Badge color={getDailyLogStatusColor(todayLog.status)} size="sm">
                  {DAILY_LOG_STATUS_LABEL[todayLog.status]}
                </Badge>
              </p>
            </div>
            <div>
              <span className="text-gray-500">Shift Start</span>
              <p className="font-medium text-gray-900">{todayLog.shift_start}</p>
            </div>
            <div>
              <span className="text-gray-500">Shift End</span>
              <p className="font-medium text-gray-900">{todayLog.shift_end}</p>
            </div>
            {todayLog.notes && (
              <div className="col-span-2 sm:col-span-3">
                <span className="text-gray-500">Notes</span>
                <p className="text-gray-700">{todayLog.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No production data for today.</p>
        )}

        {/* TDMS live session lots */}
        {sessions.length > 0 && (
          <div className="mt-5 border-t border-gray-100 pt-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Live Production Lots (TDMS)
            </h4>
            <ProductionLotTable sessions={sessions} />
          </div>
        )}
      </div>

      {/* Step 3: Tab navigation */}
      <div>
        <div className="border-b border-gray-200 flex overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                ${activeTab === tab.key
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `.trim()}
              aria-current={activeTab === tab.key ? 'page' : undefined}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-4">
          {/* Step 4: Production History tab */}
          {activeTab === 'production' && (
            <div>
              {dailyLogs.length === 0 ? (
                <EmptyState message="No production history." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-gray-200">
                        <th className="pb-2 pr-4 font-medium">Date</th>
                        <th className="pb-2 pr-4 font-medium">Status</th>
                        <th className="pb-2 pr-4 font-medium">Fruit</th>
                        <th className="pb-2 pr-4 font-medium">Tons</th>
                        <th className="pb-2 pr-4 font-medium">Shift</th>
                        <th className="pb-2 pr-4 font-medium">Notes</th>
                        <th className="pb-2 font-medium">Updated By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyLogs.map((log) => (
                        <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 pr-4 text-gray-900 whitespace-nowrap">
                            {formatDate(log.date)}
                          </td>
                          <td className="py-2 pr-4">
                            <Badge color={getDailyLogStatusColor(log.status)} size="sm">
                              {DAILY_LOG_STATUS_LABEL[log.status]}
                            </Badge>
                          </td>
                          <td className="py-2 pr-4 text-gray-700">{log.fruit_type || '—'}</td>
                          <td className="py-2 pr-4 text-gray-700">
                            {log.tons_processed > 0 ? `${log.tons_processed} t` : '—'}
                          </td>
                          <td className="py-2 pr-4 text-gray-500 text-xs whitespace-nowrap">
                            {log.shift_start} – {log.shift_end}
                          </td>
                          <td className="py-2 pr-4 text-gray-500 text-xs max-w-xs truncate">
                            {log.notes || '—'}
                          </td>
                          <td className="py-2 text-gray-700 whitespace-nowrap">
                            {getUserName(log.updated_by)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Tickets tab */}
          {activeTab === 'tickets' && (
            <div className="space-y-3">
              {tickets.length === 0 ? (
                <EmptyState message="No tickets for this machine." />
              ) : (
                tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="bg-white rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge color={getSeverityBadgeColor(ticket.severity)} size="sm">
                            {ticket.severity.replace('_', ' ')}
                          </Badge>
                          <Badge color={getTicketStatusColor(ticket.status)} size="sm">
                            {ticket.status.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-gray-400 font-mono">
                            {ticket.ticket_number}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-gray-900">{ticket.title}</h4>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {ticket.description}
                        </p>
                      </div>
                      <div className="text-xs text-gray-500 sm:text-right space-y-0.5 whitespace-nowrap">
                        <p>Raised by: {getUserName(ticket.raised_by)}</p>
                        <p>Assigned to: {getUserName(ticket.assigned_to)}</p>
                        <p>{formatDate(ticket.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Step 6: Site Visits tab */}
          {activeTab === 'visits' && (
            <div className="space-y-3">
              {siteVisits.length === 0 ? (
                <EmptyState message="No site visits recorded." />
              ) : (
                siteVisits.map((visit) => (
                  <div key={visit.id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(visit.visit_date)}
                        </span>
                        <Badge color={getVisitPurposeColor(visit.visit_purpose)} size="sm">
                          {VISIT_PURPOSE_LABEL[visit.visit_purpose]}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">
                        Engineer: {getUserName(visit.engineer_id)}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm">
                      <p className="text-gray-700">
                        <span className="font-medium">Findings: </span>{visit.findings}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-medium">Actions: </span>{visit.actions_taken}
                      </p>
                      {visit.parts_replaced && (
                        <p className="text-xs text-gray-500 mt-1">
                          Parts replaced: {visit.parts_replaced}
                        </p>
                      )}
                      {visit.next_visit_due && (
                        <p className="text-xs text-gray-500 mt-1">
                          Next visit due: {formatDate(visit.next_visit_due)}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Step 7: Machine History tab */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {history.length === 0 ? (
                <EmptyState message="No history entries." />
              ) : (
                <div className="relative pl-5">
                  {/* Timeline line */}
                  <div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-gray-200" />
                  {history.map((entry) => (
                    <div key={entry.id} className="relative mb-4">
                      {/* Timeline dot */}
                      <div className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full bg-gray-400 border-2 border-white" />
                      <div className="bg-white rounded-lg border border-gray-200 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge color="blue" size="sm">
                            {CHANGE_TYPE_LABEL[entry.change_type]}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {formatDate(entry.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">
                          <span className="line-through text-gray-400 mr-1">{entry.old_value}</span>
                          &rarr; <span className="font-medium">{entry.new_value}</span>
                        </p>
                        {entry.notes && (
                          <p className="text-xs text-gray-500 mt-1">{entry.notes}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          by {getUserName(entry.changed_by)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Step 8: Role-based action buttons */}
      {isEngineerOrAdmin && (
        <div className="flex gap-3 pb-4">
          <Button
            variant="primary"
            onClick={() => navigate(`/machines/${machine.id}/update-status`)}
          >
            Update Status
          </Button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Shared sub-component
// =============================================================================

interface EmptyStateProps {
  message: string;
}

/** Centered empty-state message for tabs with no data. */
function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center py-12 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}
