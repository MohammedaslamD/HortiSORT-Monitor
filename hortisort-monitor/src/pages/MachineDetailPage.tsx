import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMachineById } from '../services/machineService';
import { getDailyLogsByMachineId } from '../services/dailyLogService';
import { getTicketsByMachineId } from '../services/ticketService';
import { getSiteVisitsByMachineId } from '../services/siteVisitService';
import { getHistoryByMachineId } from '../services/machineHistoryService';
import { getUserName } from '../utils/userLookup';
import { formatRelativeTime, getStatusBadgeColor, getSeverityBadgeColor } from '../utils/formatters';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import type { Machine, DailyLog, Ticket, SiteVisit, MachineHistory } from '../types';

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

const DAILY_LOG_STATUS_LABEL: Record<string, string> = {
  running: 'Running',
  not_running: 'Not Running',
  maintenance: 'Maintenance',
};

const VISIT_PURPOSE_LABEL: Record<string, string> = {
  routine: 'Routine',
  ticket: 'Ticket',
  installation: 'Installation',
  training: 'Training',
};

const CHANGE_TYPE_LABEL: Record<string, string> = {
  location_change: 'Location Change',
  status_change: 'Status Change',
  engineer_change: 'Engineer Change',
  software_update: 'Software Update',
};

/**
 * Detailed view for a single machine.
 * Shows machine info header, today's production, and tabbed content.
 * Handles invalid machine ID with an error state.
 */
export function MachineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [machine, setMachine] = useState<Machine | null>(null);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>([]);
  const [history, setHistory] = useState<MachineHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('production');

  useEffect(() => {
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

      if (cancelled) return;

      // Production history: sorted by date descending
      setDailyLogs([...logs].sort((a, b) => b.date.localeCompare(a.date)));
      setTickets(tkts);
      setSiteVisits(visits);
      setHistory(hist);
      setIsLoading(false);
    }

    void fetchAll();
    return () => { cancelled = true; };
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500 text-sm">Loading machine...</p>
      </div>
    );
  }

  if (notFound || !machine) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-gray-700 font-medium">Machine not found.</p>
        <p className="text-gray-400 text-sm">The machine ID "{id}" does not exist.</p>
        <Button variant="secondary" size="sm" onClick={() => navigate('/machines')}>
          Back to Machines
        </Button>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayLog = dailyLogs.find((l) => l.date === today);
  const isEngineerOrAdmin = user?.role === 'engineer' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Back link */}
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        ← Back
      </button>

      {/* Machine info header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <p className="text-xs font-mono text-gray-400 mb-0.5">{machine.machine_code}</p>
            <h2 className="text-xl font-bold text-gray-900">{machine.machine_name}</h2>
            <p className="text-sm text-gray-500">{machine.model} &bull; SN: {machine.serial_number}</p>
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
            <p className="font-medium text-gray-900">{machine.city}, {machine.state}</p>
          </div>
          <div>
            <span className="text-gray-500">Address</span>
            <p className="font-medium text-gray-900 text-xs leading-tight">{machine.location}</p>
          </div>
          <div>
            <span className="text-gray-500">Software</span>
            <p className="font-medium text-gray-900">{machine.software_version}</p>
          </div>
          <div>
            <span className="text-gray-500">Installed</span>
            <p className="font-medium text-gray-900">{machine.installation_date}</p>
          </div>
          <div>
            <span className="text-gray-500">Lanes</span>
            <p className="font-medium text-gray-900">{machine.num_lanes}</p>
          </div>
          <div>
            <span className="text-gray-500">Features</span>
            <p className="font-medium text-gray-900">{machine.grading_features}</p>
          </div>
          <div>
            <span className="text-gray-500">Last Updated</span>
            <p className="font-medium text-gray-900">{formatRelativeTime(machine.last_updated)}</p>
          </div>
        </div>
      </div>

      {/* Today's production */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Today's Production</h3>
        {todayLog ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Status</span>
              <p className="font-medium text-gray-900">{DAILY_LOG_STATUS_LABEL[todayLog.status] ?? todayLog.status}</p>
            </div>
            <div>
              <span className="text-gray-500">Fruit Type</span>
              <p className="font-medium text-gray-900">{todayLog.fruit_type}</p>
            </div>
            <div>
              <span className="text-gray-500">Tons Processed</span>
              <p className="font-medium text-gray-900">{todayLog.tons_processed} t</p>
            </div>
            <div>
              <span className="text-gray-500">Shift</span>
              <p className="font-medium text-gray-900">{todayLog.shift_start} – {todayLog.shift_end}</p>
            </div>
            {todayLog.notes && (
              <div className="col-span-2 sm:col-span-4">
                <span className="text-gray-500">Notes</span>
                <p className="text-gray-700">{todayLog.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No production log for today.</p>
        )}
      </div>

      {/* Tab navigation */}
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
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-4">
          {/* Production History tab */}
          {activeTab === 'production' && (
            <div>
              {dailyLogs.length === 0 ? (
                <p className="text-gray-400 text-sm py-8 text-center">No production history.</p>
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
                        <th className="pb-2 font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyLogs.map((log) => (
                        <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 pr-4 text-gray-900">{log.date}</td>
                          <td className="py-2 pr-4">
                            <Badge
                              color={log.status === 'running' ? 'green' : log.status === 'maintenance' ? 'yellow' : 'red'}
                              size="sm"
                            >
                              {DAILY_LOG_STATUS_LABEL[log.status] ?? log.status}
                            </Badge>
                          </td>
                          <td className="py-2 pr-4 text-gray-700">{log.fruit_type || '—'}</td>
                          <td className="py-2 pr-4 text-gray-700">{log.tons_processed > 0 ? `${log.tons_processed} t` : '—'}</td>
                          <td className="py-2 pr-4 text-gray-500 text-xs">{log.shift_start} – {log.shift_end}</td>
                          <td className="py-2 text-gray-500 text-xs max-w-xs truncate">{log.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tickets tab */}
          {activeTab === 'tickets' && (
            <div className="space-y-3">
              {tickets.length === 0 ? (
                <p className="text-gray-400 text-sm py-8 text-center">No tickets for this machine.</p>
              ) : (
                tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="bg-white rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-gray-400">{ticket.ticket_number}</span>
                        <Badge color={getSeverityBadgeColor(ticket.severity)} size="sm">
                          {ticket.severity.replace('_', ' ')}
                        </Badge>
                        <Badge
                          color={
                            ticket.status === 'open' || ticket.status === 'reopened' ? 'red'
                            : ticket.status === 'in_progress' ? 'yellow'
                            : 'gray'
                          }
                          size="sm"
                        >
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">{ticket.title}</p>
                    <p className="text-xs text-gray-500">{ticket.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Raised {formatRelativeTime(ticket.created_at)} by {getUserName(ticket.raised_by)}
                      {ticket.resolved_at && ` · Resolved ${formatRelativeTime(ticket.resolved_at)}`}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Site Visits tab */}
          {activeTab === 'visits' && (
            <div className="space-y-3">
              {siteVisits.length === 0 ? (
                <p className="text-gray-400 text-sm py-8 text-center">No site visits recorded.</p>
              ) : (
                siteVisits.map((visit) => (
                  <div key={visit.id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-900">{visit.visit_date}</span>
                      <Badge color="blue" size="sm">
                        {VISIT_PURPOSE_LABEL[visit.visit_purpose] ?? visit.visit_purpose}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">
                      Engineer: {getUserName(visit.engineer_id)}
                    </p>
                    <p className="text-sm text-gray-700 mb-1">
                      <span className="font-medium">Findings: </span>{visit.findings}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Actions: </span>{visit.actions_taken}
                    </p>
                    {visit.parts_replaced && (
                      <p className="text-xs text-gray-500 mt-1">
                        Parts replaced: {visit.parts_replaced}
                      </p>
                    )}
                    {visit.next_visit_due && (
                      <p className="text-xs text-gray-400 mt-1">
                        Next visit due: {visit.next_visit_due}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Machine History tab */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {history.length === 0 ? (
                <p className="text-gray-400 text-sm py-8 text-center">No history entries.</p>
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
                          <Badge color="gray" size="sm">
                            {CHANGE_TYPE_LABEL[entry.change_type] ?? entry.change_type}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {formatRelativeTime(entry.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">
                          <span className="line-through text-gray-400 mr-1">{entry.old_value}</span>
                          → <span className="font-medium">{entry.new_value}</span>
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

      {/* Role-based action buttons */}
      {isEngineerOrAdmin && (
        <div className="flex flex-wrap gap-3 pb-4">
          <Button
            variant="primary"
            onClick={() => navigate(`/machines/${machine.id}/update-status`)}
          >
            Update Status
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate(`/tickets/new?machine=${machine.id}`)}
          >
            Raise Ticket
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate(`/visits/new?machine=${machine.id}`)}
          >
            Log Visit
          </Button>
          {isAdmin && (
            <Button
              variant="ghost"
              onClick={() => navigate(`/admin/machines/${machine.id}/edit`)}
            >
              Edit Machine
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
