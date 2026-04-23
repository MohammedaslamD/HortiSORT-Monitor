import type { Machine, DailyLog, UserRole } from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { getUserName } from '../../utils/userLookup';
import { formatRelativeTime, getStatusBadgeColor } from '../../utils/formatters';

interface MachineCardProps {
  machine: Machine;
  /** Today's production data, if available. */
  todayLog?: DailyLog;
  /** Number of open tickets for this machine. */
  openTicketCount: number;
  userRole: UserRole;
  onNavigate: (machineId: number) => void;
  onUpdateStatus?: (machineId: number) => void;
  onRaiseTicket?: (machineId: number) => void;
}

/**
 * Card displaying a single machine's summary in the dashboard or machine list.
 *
 * Shows status, location, today's production, last update, ticket count, and
 * role-based action buttons (engineers and admins get Update Status + Raise Ticket).
 * The entire card is clickable and calls `onNavigate`.
 */
export function MachineCard({
  machine,
  todayLog,
  openTicketCount,
  userRole,
  onNavigate,
  onUpdateStatus,
  onRaiseTicket,
}: MachineCardProps) {
  const showActions =
    (userRole === 'engineer' || userRole === 'admin') &&
    (onUpdateStatus || onRaiseTicket);

  return (
    <Card
      onClick={() => onNavigate(machine.id)}
      className="flex flex-col"
    >
      <Card.Body className="flex flex-col gap-2">
        {/* Top row: machine code + status badge */}
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-900 dark:text-gray-100">{machine.machine_code}</span>
          <Badge color={getStatusBadgeColor(machine.status)} size="sm">
            {machine.status}
          </Badge>
        </div>

        {/* Second row: model + location */}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {machine.model} &bull; {machine.city}, {machine.state}
        </p>

        {/* Third row: today's production (conditional) */}
        {todayLog && (
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Today: {todayLog.fruit_type} &mdash; {todayLog.tons_processed}t
          </p>
        )}

        {/* Fourth row: last updated */}
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Last updated: {formatRelativeTime(machine.last_updated)} by{' '}
          {getUserName(machine.last_updated_by)}
        </p>

        {/* Ticket indicator */}
        {openTicketCount > 0 && (
          <div>
            <Badge color="red" size="sm">
              {openTicketCount} {openTicketCount === 1 ? 'ticket' : 'tickets'}
            </Badge>
          </div>
        )}

        {/* Action buttons (role-based) */}
        {showActions && (
          <div className="flex items-center gap-2 pt-2">
            {onUpdateStatus && (
              <Button
                variant="primary"
                size="sm"
                className="min-h-[44px]"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateStatus(machine.id);
                }}
              >
                Update Status
              </Button>
            )}
            {onRaiseTicket && (
              <Button
                variant="secondary"
                size="sm"
                className="min-h-[44px]"
                onClick={(e) => {
                  e.stopPropagation();
                  onRaiseTicket(machine.id);
                }}
              >
                Raise Ticket
              </Button>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
