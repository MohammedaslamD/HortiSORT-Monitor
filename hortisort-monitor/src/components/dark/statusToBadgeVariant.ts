import type { MachineStatusTone } from '../../types'
import type { StatBadgeVariant } from './StatBadge'

/** 1:1 mapping today; abstracted so future status values can be remapped. */
export function statusToBadgeVariant(status: MachineStatusTone): StatBadgeVariant {
  return status
}
