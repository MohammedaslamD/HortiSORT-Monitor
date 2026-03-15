interface AdminStatsCardsProps {
  totalUsers: number
  activeUsers: number
  totalMachines: number
  runningMachines: number
  openTickets: number
  totalVisits: number
}

interface StatCardItem {
  label: string
  value: number
  subText?: string
  dotColor: string
}

/**
 * Admin dashboard stat cards — 4 cards showing users, machines, tickets, visits.
 * Same visual pattern as the dashboard StatsCards but with different data.
 */
export function AdminStatsCards({
  totalUsers,
  activeUsers,
  totalMachines,
  runningMachines,
  openTickets,
  totalVisits,
}: AdminStatsCardsProps) {
  const cards: StatCardItem[] = [
    { label: 'Total Users', value: totalUsers, subText: `${activeUsers} active`, dotColor: 'bg-blue-600' },
    { label: 'Total Machines', value: totalMachines, subText: `${runningMachines} running`, dotColor: 'bg-green-600' },
    { label: 'Open Tickets', value: openTickets, dotColor: 'bg-yellow-500' },
    { label: 'Site Visits', value: totalVisits, dotColor: 'bg-purple-600' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          {card.subText && (
            <p className="text-xs text-gray-400 mt-1">{card.subText}</p>
          )}
        </div>
      ))}
    </div>
  )
}
