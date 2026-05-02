import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

import type {
  Machine,
  DailyLog,
  Ticket,
  SiteVisit,
  MachineHistory,
  DailyLogStatus,
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
import { formatRelativeTime } from '../utils/formatters';
import { Button } from '../components/common';
import { ProductionLotTable } from '../components/production';
import { StatBadge, statusToBadgeVariant, severityToBadgeVariant, ticketStatusToBadgeVariant } from '../components/dark';
import type { StatBadgeVariant } from '../components/dark';

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
// Badge-variant helpers (Phase B dark tokens)
// -----------------------------------------------------------------------------

/** Map DailyLogStatus to dark StatBadge variant. */
const DAILY_LOG_STATUS_VARIANT: Record<DailyLogStatus, StatBadgeVariant> = {
  running: 'running',
  not_running: 'notrun',
  maintenance: 'maintenance',
};

/** Map VisitPurpose to dark StatBadge variant. */
const VISIT_PURPOSE_VARIANT: Record<VisitPurpose, StatBadgeVariant> = {
  routine: 'routine',
  ticket: 'medium',
  installation: 'install',
  training: 'engineer',
};

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
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-line-strong border-t-brand-cyan" />
          <p className="mt-3 text-sm text-fg-4">Loading machine details...</p>
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
        <div className="rounded-full bg-red-500/15 border border-brand-red p-4">
          <svg className="h-8 w-8 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-fg-1">Machine not found</h2>
        <p className="text-sm text-fg-3">
          The machine you're looking for doesn't exist or you don't have access to it.
        </p>
        <Link
          to="/"
          className="text-sm font-medium text-brand-cyan hover:text-brand-cyan/80 underline"
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
        className="text-sm text-brand-cyan hover:text-brand-cyan/80 flex items-center gap-1"
      >
        &larr; Back
      </button>

      {/* Step 1: Machine info header */}
      <div className="bg-bg-surface2 border border-line-strong rounded-xl shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <p className="text-xs font-mono text-fg-4 mb-0.5">{machine.machine_code}</p>
            <h2 className="text-xl font-bold text-fg-1">{machine.machine_name}</h2>
            <p className="text-sm text-fg-3">
              {machine.model} &bull; SN: {machine.serial_number}
            </p>
          </div>
          <StatBadge variant={statusToBadgeVariant(machine.status)}>
            {machine.status.charAt(0).toUpperCase() + machine.status.slice(1)}
          </StatBadge>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
          <div>
            <span className="text-fg-4">Customer</span>
            <p className="font-medium text-fg-1">{getUserName(machine.customer_id)}</p>
          </div>
          <div>
            <span className="text-fg-4">Engineer</span>
            <p className="font-medium text-fg-1">{getUserName(machine.engineer_id)}</p>
          </div>
          <div>
            <span className="text-fg-4">Location</span>
            <p className="font-medium text-fg-1 text-xs leading-tight">{machine.location}</p>
          </div>
          <div>
            <span className="text-fg-4">City / State</span>
            <p className="font-medium text-fg-1">{machine.city}, {machine.state}</p>
          </div>
          <div>
            <span className="text-fg-4">Installed</span>
            <p className="font-medium text-fg-1">{formatDate(machine.installation_date)}</p>
          </div>
          <div>
            <span className="text-fg-4">Last Updated</span>
            <p className="font-medium text-fg-1">{formatRelativeTime(machine.last_updated)}</p>
          </div>
          <div>
            <span className="text-fg-4">Updated By</span>
            <p className="font-medium text-fg-1">{getUserName(machine.last_updated_by)}</p>
          </div>
        </div>
      </div>

      {/* Step 2: Today's production */}
      <div className="bg-bg-surface2 border border-line-strong rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-fg-2">Today's Production</h3>
          {sessions.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs text-brand-green">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
              Live
            </span>
          )}
        </div>
        {todayLog ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
            <div>
              <span className="text-fg-4">Fruit Type</span>
              <p className="font-medium text-fg-1">{todayLog.fruit_type}</p>
            </div>
            <div>
              <span className="text-fg-4">Tons Processed</span>
              <p className="font-medium text-fg-1">{todayLog.tons_processed} t</p>
            </div>
            <div>
              <span className="text-fg-4">Status</span>
              <p className="mt-0.5">
                <StatBadge variant={DAILY_LOG_STATUS_VARIANT[todayLog.status]}>
                  {DAILY_LOG_STATUS_LABEL[todayLog.status]}
                </StatBadge>
              </p>
            </div>
            <div>
              <span className="text-fg-4">Shift Start</span>
              <p className="font-medium text-fg-1">{todayLog.shift_start}</p>
            </div>
            <div>
              <span className="text-fg-4">Shift End</span>
              <p className="font-medium text-fg-1">{todayLog.shift_end}</p>
            </div>
            {todayLog.notes && (
              <div className="col-span-2 sm:col-span-3">
                <span className="text-fg-4">Notes</span>
                <p className="text-fg-2">{todayLog.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-fg-4 text-sm">No production data for today.</p>
        )}

        {/* TDMS live session lots */}
        {sessions.length > 0 && (
          <div className="mt-5 border-t border-line-strong pt-4">
            <h4 className="text-xs font-semibold text-fg-4 uppercase tracking-wider mb-3">
              Live Production Lots (TDMS)
            </h4>
            <ProductionLotTable sessions={sessions} />
          </div>
        )}
      </div>

      {/* Step 3: Tab navigation */}
      <div>
        <div className="border-b border-line-strong flex overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                ${activeTab === tab.key
                  ? 'border-brand-cyan text-brand-cyan'
                  : 'border-transparent text-fg-4 hover:text-fg-1 hover:border-line-strong'}
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
                <div className="overflow-x-auto bg-bg-surface2 border border-line-strong rounded-xl">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-fg-4 border-b border-line-strong">
                        <th className="pb-2 pr-4 pl-4 pt-3 font-medium">Date</th>
                        <th className="pb-2 pr-4 font-medium">Status</th>
                        <th className="pb-2 pr-4 font-medium">Fruit</th>
                        <th className="pb-2 pr-4 font-medium">Tons</th>
                        <th className="pb-2 pr-4 font-medium">Shift</th>
                        <th className="pb-2 pr-4 font-medium">Notes</th>
                        <th className="pb-2 pr-4 font-medium">Updated By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyLogs.map((log) => (
                        <tr key={log.id} className="border-b border-line/50 hover:bg-bg-surface3">
                          <td className="py-2 pr-4 pl-4 text-fg-1 whitespace-nowrap">
                            {formatDate(log.date)}
                          </td>
                          <td className="py-2 pr-4">
                            <StatBadge variant={DAILY_LOG_STATUS_VARIANT[log.status]}>
                              {DAILY_LOG_STATUS_LABEL[log.status]}
                            </StatBadge>
                          </td>
                          <td className="py-2 pr-4 text-fg-2">{log.fruit_type || '—'}</td>
                          <td className="py-2 pr-4 text-fg-2">
                            {log.tons_processed > 0 ? `${log.tons_processed} t` : '—'}
                          </td>
                          <td className="py-2 pr-4 text-fg-4 text-xs whitespace-nowrap">
                            {log.shift_start} – {log.shift_end}
                          </td>
                          <td className="py-2 pr-4 text-fg-4 text-xs max-w-xs truncate">
                            {log.notes || '—'}
                          </td>
                          <td className="py-2 pr-4 text-fg-2 whitespace-nowrap">
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
                    className="bg-bg-surface2 rounded-xl border border-line-strong p-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <StatBadge variant={severityToBadgeVariant(ticket.severity)}>
                            {ticket.severity.replace('_', ' ')}
                          </StatBadge>
                          <StatBadge variant={ticketStatusToBadgeVariant(ticket.status)}>
                            {ticket.status.replace('_', ' ')}
                          </StatBadge>
                          <span className="text-xs text-fg-4 font-mono">
                            {ticket.ticket_number}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-fg-1">{ticket.title}</h4>
                        <p className="text-xs text-fg-3 mt-0.5 line-clamp-2">
                          {ticket.description}
                        </p>
                      </div>
                      <div className="text-xs text-fg-4 sm:text-right space-y-0.5 whitespace-nowrap">
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
                  <div key={visit.id} className="bg-bg-surface2 rounded-xl border border-line-strong p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-fg-1">
                          {formatDate(visit.visit_date)}
                        </span>
                        <StatBadge variant={VISIT_PURPOSE_VARIANT[visit.visit_purpose]}>
                          {VISIT_PURPOSE_LABEL[visit.visit_purpose]}
                        </StatBadge>
                      </div>
                      <span className="text-xs text-fg-4">
                        Engineer: {getUserName(visit.engineer_id)}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm">
                      <p className="text-fg-2">
                        <span className="font-medium text-fg-1">Findings: </span>{visit.findings}
                      </p>
                      <p className="text-fg-2">
                        <span className="font-medium text-fg-1">Actions: </span>{visit.actions_taken}
                      </p>
                      {visit.parts_replaced && (
                        <p className="text-xs text-fg-4 mt-1">
                          Parts replaced: {visit.parts_replaced}
                        </p>
                      )}
                      {visit.next_visit_due && (
                        <p className="text-xs text-fg-4 mt-1">
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
                  <div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-line-strong" />
                  {history.map((entry) => (
                    <div key={entry.id} className="relative mb-4">
                      {/* Timeline dot */}
                      <div className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full bg-fg-4 border-2 border-bg" />
                      <div className="bg-bg-surface2 rounded-xl border border-line-strong p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <StatBadge variant="medium">
                            {CHANGE_TYPE_LABEL[entry.change_type]}
                          </StatBadge>
                          <span className="text-xs text-fg-4">
                            {formatDate(entry.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-fg-2">
                          <span className="line-through text-fg-4 mr-1">{entry.old_value}</span>
                          &rarr; <span className="font-medium text-fg-1">{entry.new_value}</span>
                        </p>
                        {entry.notes && (
                          <p className="text-xs text-fg-4 mt-1">{entry.notes}</p>
                        )}
                        <p className="text-xs text-fg-4 mt-1">
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
    <div className="flex items-center justify-center py-12 rounded-xl border-2 border-dashed border-line-strong bg-bg-surface2">
      <p className="text-fg-4 text-sm">{message}</p>
    </div>
  );
}
