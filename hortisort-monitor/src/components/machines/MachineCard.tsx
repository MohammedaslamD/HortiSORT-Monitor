import { useNavigate } from 'react-router-dom';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import type { Machine, MachineStatus, UserRole } from '../../types';

interface MachineCardProps {
  machine: Machine;
  todayTons?: number | null;
  openTickets?: number;
  currentUserRole: UserRole;
}

const statusBadgeColor: Record<MachineStatus, 'green' | 'yellow' | 'red' | 'gray'> = {
  running: 'green',
  idle: 'yellow',
  down: 'red',
  offline: 'gray',
};

const statusLabel: Record<MachineStatus, string> = {
  running: 'Running',
  idle: 'Idle',
  down: 'Down',
  offline: 'Offline',
};

/** Formats an ISO timestamp to a short relative description. */
function formatLastUpdated(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Card showing key machine info + role-based action buttons.
 * Clicking the card body navigates to /machines/:id.
 */
export function MachineCard({
  machine,
  todayTons,
  openTickets = 0,
  currentUserRole,
}: MachineCardProps) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/machines/${machine.id}`);
  };

  const handleUpdateStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/machines/${machine.id}/update-status`);
  };

  const handleRaiseTicket = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/tickets/new?machineId=${machine.id}`);
  };

  const isEngineerOrAdmin = currentUserRole === 'engineer' || currentUserRole === 'admin';

  return (
    <Card onClick={handleCardClick} className="flex flex-col">
      <Card.Body className="flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="text-xs font-mono text-gray-500">{machine.machine_code}</p>
            <h3 className="text-sm font-semibold text-gray-900 truncate">{machine.machine_name}</h3>
          </div>
          <Badge color={statusBadgeColor[machine.status]} size="sm">
            {statusLabel[machine.status]}
          </Badge>
        </div>

        {/* Location & model */}
        <p className="text-xs text-gray-500 mb-1">
          {machine.model} &middot; {machine.city}, {machine.state}
        </p>

        {/* Today's production */}
        <p className="text-xs text-gray-600 mb-1">
          Today:{' '}
          {todayTons != null ? (
            <span className="font-medium text-gray-800">{todayTons} t</span>
          ) : (
            <span className="text-gray-400">no log</span>
          )}
        </p>

        {/* Open tickets indicator */}
        {openTickets > 0 && (
          <div className="mb-1">
            <Badge color="red" size="sm">{openTickets} open {openTickets === 1 ? 'ticket' : 'tickets'}</Badge>
          </div>
        )}

        {/* Last updated */}
        <p className="text-xs text-gray-400">
          Updated {formatLastUpdated(machine.last_updated)}
        </p>
      </Card.Body>

      {/* Role-based action buttons */}
      {isEngineerOrAdmin && (
        <Card.Footer className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleUpdateStatus}
            className="flex-1"
          >
            Update Status
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRaiseTicket}
            className="flex-1"
          >
            Raise Ticket
          </Button>
        </Card.Footer>
      )}
    </Card>
  );
}
