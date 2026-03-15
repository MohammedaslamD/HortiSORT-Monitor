import type { MachineStats } from '../../types';

interface StatsCardsProps {
  stats: MachineStats;
  openTicketCount: number;
}

interface StatCardItem {
  label: string;
  value: number;
  dotColor: string;
}

/**
 * Dashboard overview row showing machine status counts and open ticket count.
 * Responsive grid: 2 columns on mobile, 3 on tablet, 6 on desktop.
 */
export function StatsCards({ stats, openTicketCount }: StatsCardsProps) {
  const cards: StatCardItem[] = [
    { label: 'Total Machines', value: stats.total, dotColor: 'bg-blue-600' },
    { label: 'Running', value: stats.running, dotColor: 'bg-green-600' },
    { label: 'Idle', value: stats.idle, dotColor: 'bg-yellow-500' },
    { label: 'Down', value: stats.down, dotColor: 'bg-red-600' },
    { label: 'Offline', value: stats.offline, dotColor: 'bg-gray-500' },
    { label: 'Open Tickets', value: openTicketCount, dotColor: 'bg-purple-600' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`w-3 h-3 rounded-full ${card.dotColor}`}
              aria-hidden="true"
            />
            <span className="text-sm text-gray-500">{card.label}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
