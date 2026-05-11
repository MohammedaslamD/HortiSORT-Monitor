import { ProductionStatusBadge } from './ProductionStatusBadge'
import type { ProductionSession } from '../../types'

interface ProductionLotTableProps {
  sessions: ProductionSession[]
}

/**
 * Table displaying today's production lots for a machine or fleet.
 */
export function ProductionLotTable({ sessions }: ProductionLotTableProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No production data for today yet.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {/* Table headers */}
            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Lot #</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Fruit Type</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Qty (kg)</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Stop Time</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {sessions.map((session) => (
            <tr key={session.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">{session.lot_number}</td>
              <td className="px-4 py-3">
                <ProductionStatusBadge status={session.status} />
              </td>
              <td className="px-4 py-3 text-gray-700">{session.fruit_type ?? '—'}</td>
              <td className="px-4 py-3 text-gray-700">
                {session.quantity_kg ? parseFloat(session.quantity_kg).toLocaleString() : '—'}
              </td>
              <td className="px-4 py-3 text-gray-500">
                {new Date(session.start_time).toLocaleTimeString()}
              </td>
              <td className="px-4 py-3 text-gray-500">
                {session.stop_time ? new Date(session.stop_time).toLocaleTimeString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
