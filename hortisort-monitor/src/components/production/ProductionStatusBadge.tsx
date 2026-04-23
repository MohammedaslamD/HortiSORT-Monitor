import { Badge } from '../common/Badge'
import type { ProductionStatus } from '../../types'

interface ProductionStatusBadgeProps {
  status: ProductionStatus
}

const statusConfig: Record<ProductionStatus, { label: string; color: 'green' | 'gray' | 'red' }> = {
  running: { label: 'Running', color: 'green' },
  completed: { label: 'Completed', color: 'gray' },
  error: { label: 'Error', color: 'red' },
}

/**
 * Badge showing a production lot's status (Running / Completed / Error).
 */
export function ProductionStatusBadge({ status }: ProductionStatusBadgeProps) {
  const { label, color } = statusConfig[status] ?? { label: status, color: 'gray' }
  return <Badge color={color}>{label}</Badge>
}
