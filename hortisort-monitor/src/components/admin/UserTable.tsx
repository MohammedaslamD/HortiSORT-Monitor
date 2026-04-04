import type { User, UserRole } from '../../types'
import { Badge } from '../common/Badge'
import { Button } from '../common/Button'

interface UserTableProps {
  users: User[]
  currentUserId?: number
  onToggleActive: (userId: number) => void
  onEdit?: (user: User) => void
  onDelete?: (user: User) => void
  onAddUser?: () => void
}

/** Maps user role to Badge color. */
const ROLE_COLOR_MAP: Record<UserRole, 'purple' | 'blue' | 'green'> = {
  admin: 'purple',
  engineer: 'blue',
  customer: 'green',
}

/**
 * User management table for the admin dashboard.
 * Displays name, email, role badge, status badge, created date, and toggle action.
 * Email and created columns are hidden on mobile.
 * The currently logged-in admin's deactivate button is disabled.
 */
export function UserTable({ users, currentUserId, onToggleActive, onEdit, onDelete, onAddUser }: UserTableProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Users</h2>
        {onAddUser && (
          <Button variant="primary" size="sm" onClick={onAddUser}>
            + Add User
          </Button>
        )}
      </div>
      <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => {
            const isSelf = user.id === currentUserId
            return (
              <tr key={user.id}>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {user.name}
                </td>
                <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {user.email}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge color={ROLE_COLOR_MAP[user.role]} size="sm">
                    {user.role}
                  </Badge>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge color={user.is_active ? 'green' : 'red'} size="sm">
                    {user.is_active ? 'active' : 'inactive'}
                  </Badge>
                </td>
                <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {onEdit && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onEdit(user)}
                      >
                        Edit
                      </Button>
                    )}
                    <Button
                      variant={user.is_active ? 'danger' : 'primary'}
                      size="sm"
                      onClick={() => onToggleActive(user.id)}
                      disabled={isSelf}
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    {onDelete && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onDelete(user)}
                        disabled={isSelf}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
    </div>
  )
}
