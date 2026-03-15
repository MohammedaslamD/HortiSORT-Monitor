import { Badge } from '../common/Badge';
import type { MachineStats } from '../../types';

interface StatsCardsProps {
  stats: MachineStats;
  openTickets: number;
}

interface StatCardProps {
  label: string;
  value: number;
  badgeColor: 'green' | 'yellow' | 'red' | 'gray' | 'blue';
}

/**
 * A single stat count card for the dashboard overview row.
 */
function StatCard({ label, value, badgeColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-4 flex flex-col gap-2">
      <Badge color={badgeColor} size="sm">{label}</Badge>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

/**
 * Dashboard stats row: Total, Running, Idle, Down, Offline, Open Tickets.
 * Badge colors: green=running, yellow=idle, red=down, gray=offline, blue=total/tickets.
 */
export function StatsCards({ stats, openTickets }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      <StatCard label="Total" value={stats.total} badgeColor="blue" />
      <StatCard label="Running" value={stats.running} badgeColor="green" />
      <StatCard label="Idle" value={stats.idle} badgeColor="yellow" />
      <StatCard label="Down" value={stats.down} badgeColor="red" />
      <StatCard label="Offline" value={stats.offline} badgeColor="gray" />
      <StatCard label="Open Tickets" value={openTickets} badgeColor="blue" />
    </div>
  );
}
