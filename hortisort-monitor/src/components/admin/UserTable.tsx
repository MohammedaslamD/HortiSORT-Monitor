import type { User, UserRole } from '../../types'
import { DataTable, StatBadge, type StatBadgeVariant } from '../dark'

interface UserTableProps {
  users: User[]
  currentUserId?: number
  onToggleActive: (userId: number) => void
  onEdit?: (user: User) => void
  onDelete?: (user: User) => void
  onAddUser?: () => void
}

const ROLE_BADGE: Record<UserRole, { variant: StatBadgeVariant; label: string }> = {
  admin:    { variant: 'admin',    label: 'Admin' },
  engineer: { variant: 'engineer', label: 'Engineer' },
  customer: { variant: 'customer', label: 'Customer' },
}

const COLUMNS = [
  { key: 'name',    label: 'Name' },
  { key: 'email',   label: 'Email' },
  { key: 'role',    label: 'Role' },
  { key: 'site',    label: 'Site' },
  { key: 'status',  label: 'Status' },
  { key: 'login',   label: 'Last Login' },
  { key: 'actions', label: 'Actions' },
]

const DAY_MS = 24 * 60 * 60 * 1000

/** Inline relative-time formatter used for the Last Login column. */
function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return '—'
  const diff = now.getTime() - t
  if (diff < 60_000) return 'Now'
  if (diff < 4 * 60 * 60_000) {
    return `Today ${String(new Date(iso).getHours()).padStart(2, '0')}:${String(new Date(iso).getMinutes()).padStart(2, '0')}`
  }
  const days = Math.floor(diff / DAY_MS)
  if (days === 0) {
    return `Today ${String(new Date(iso).getHours()).padStart(2, '0')}:${String(new Date(iso).getMinutes()).padStart(2, '0')}`
  }
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

/**
 * Phase B Users management table — dense dark `DataTable` with
 * role/status `StatBadge` pills and ghost action buttons. Mockup
 * reference: `dark-ui-v2.html` lines 706-720.
 *
 * Notes:
 * - The `User` type lacks `site` and `last_login_at` fields today;
 *   we render `'—'` for Site and use `updated_at` as a proxy for
 *   Last Login. TODO(phase-c): add the real fields and swap.
 * - Currently-logged-in admin's Deactivate / Delete buttons remain
 *   disabled to prevent self-lockout.
 */
export function UserTable({
  users,
  currentUserId,
  onToggleActive,
  onEdit,
  onDelete,
  onAddUser,
}: UserTableProps) {
  const rows = users.map((u) => {
    const isSelf = u.id === currentUserId
    const role = ROLE_BADGE[u.role]
    return {
      id: u.id,
      cells: [
        u.name,
        <span key="e" className="text-fg-4 text-xs">{u.email}</span>,
        <StatBadge key="r" variant={role.variant}>{role.label}</StatBadge>,
        // TODO(phase-c): replace with u.site when User type adds the field.
        <span key="s" className="text-fg-5">—</span>,
        <StatBadge key="st" variant={u.is_active ? 'running' : 'idle'}>
          {u.is_active ? 'Active' : 'Idle'}
        </StatBadge>,
        // TODO(phase-c): replace updated_at proxy with last_login_at.
        <span key="l" className="text-fg-4 text-xs">{formatRelativeTime(u.updated_at)}</span>,
        <div key="a" className="flex items-center gap-1.5">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(u)}
              className="text-[10px] px-2 py-1 rounded border border-line text-fg-2 hover:bg-bg-surface3"
            >
              Edit
            </button>
          )}
          <button
            type="button"
            onClick={() => onToggleActive(u.id)}
            disabled={isSelf}
            className={
              u.is_active
                ? 'text-[10px] px-2 py-1 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed'
                : 'text-[10px] px-2 py-1 rounded border border-green-500/30 text-green-400 hover:bg-green-500/10 disabled:opacity-40 disabled:cursor-not-allowed'
            }
          >
            {u.is_active ? 'Deactivate' : 'Activate'}
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(u)}
              disabled={isSelf}
              className="text-[10px] px-2 py-1 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Delete
            </button>
          )}
        </div>,
      ],
    }
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-fg-1">Users</h2>
        {onAddUser && (
          <button
            type="button"
            onClick={onAddUser}
            className="bg-brand-cyan text-bg font-semibold text-xs rounded px-3 py-1.5 hover:opacity-90"
          >
            + Add User
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <DataTable columns={COLUMNS} rows={rows} />
      </div>
    </div>
  )
}
