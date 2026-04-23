import { useState, useEffect, useCallback } from 'react'

import type { User, Machine, ActivityLog } from '../types'
import { useAuth } from '../context/AuthContext'
import { getUsers, toggleUserActive } from '../services/userService'
import { getMachines } from '../services/machineService'
import { getOpenTicketCount } from '../services/ticketService'
import { getAllSiteVisits } from '../services/siteVisitService'
import { getRecentActivity } from '../services/activityLogService'
import { AdminStatsCards, ActivityFeed, UserTable, CreateUserModal, EditUserModal, DeleteUserModal } from '../components/admin'
import { Toast } from '../components/common'

/**
 * Admin dashboard page with summary stats, recent activity feed, and user management.
 *
 * - Fetches all users, machines, open ticket count, site visits, and recent activity on mount.
 * - Stats section: 4 cards (users, machines, tickets, visits).
 * - Activity feed: 10 most recent activity log entries.
 * - User table: full user list with active/inactive toggle.
 * - Admin cannot deactivate themselves (button disabled).
 * - Optimistic toggle with success/error toast.
 */
export function AdminPage() {
  const { user } = useAuth()

  // Data state
  const [users, setUsers] = useState<User[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [openTickets, setOpenTickets] = useState(0)
  const [totalVisits, setTotalVisits] = useState(0)
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Toast state
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [showToast, setShowToast] = useState(false)

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)

  // Fetch all data on mount
  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      setIsLoading(true)
      setError(null)

      try {
        const [
          fetchedUsers,
          fetchedMachines,
          fetchedOpenTickets,
          fetchedVisits,
          fetchedActivities,
        ] = await Promise.all([
          getUsers(),
          getMachines(),
          getOpenTicketCount(),
          getAllSiteVisits(),
          getRecentActivity(10),
        ])

        if (cancelled) return

        setUsers(fetchedUsers)
        setMachines(fetchedMachines)
        setOpenTickets(fetchedOpenTickets)
        setTotalVisits(fetchedVisits.length)
        setActivities(fetchedActivities)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load admin data.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [])

  // Derived stats
  const activeUsers = users.filter((u) => u.is_active).length
  const runningMachines = machines.filter((m) => m.status === 'running').length

  // Toggle user active status — optimistic update
  const handleToggleActive = useCallback(async (userId: number) => {
    const targetUser = users.find((u) => u.id === userId)
    if (!targetUser) return

    const wasActive = targetUser.is_active
    const actionWord = wasActive ? 'deactivated' : 'activated'

    // Optimistic update
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, is_active: !u.is_active } : u,
      ),
    )

    try {
      await toggleUserActive(userId)
      setToastMessage(`User ${targetUser.name} ${actionWord}`)
      setToastType('success')
      setShowToast(true)
    } catch {
      // Revert on error
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_active: wasActive } : u,
        ),
      )
      setToastMessage('Failed to update user')
      setToastType('error')
      setShowToast(true)
    }
  }, [users])

  function handleUserCreated(newUser: User) {
    setUsers(prev => [newUser, ...prev])
    setIsCreateModalOpen(false)
    setToastMessage(`User ${newUser.name} created`)
    setToastType('success')
    setShowToast(true)
  }

  function handleUserUpdated(updatedUser: User) {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u))
    setEditingUser(null)
    setToastMessage(`User ${updatedUser.name} updated`)
    setToastType('success')
    setShowToast(true)
  }

  function handleUserDeleted(userId: number) {
    setUsers(prev => prev.filter(u => u.id !== userId))
    setDeletingUser(null)
    setToastMessage('User deleted')
    setToastType('success')
    setShowToast(true)
  }

  if (!user) return null

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Admin Dashboard</h2>

      {/* Error banner */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm">Loading...</p>
        </div>
      ) : (
        <>
          {/* Section 1: Summary Stats */}
          <AdminStatsCards
            totalUsers={users.length}
            activeUsers={activeUsers}
            totalMachines={machines.length}
            runningMachines={runningMachines}
            openTickets={openTickets}
            totalVisits={totalVisits}
          />

          {/* Section 2: Recent Activity */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Recent Activity</h3>
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4">
              <ActivityFeed activities={activities} />
            </div>
          </div>

          {/* Section 3: User Management */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">User Management</h3>
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
              <UserTable
                users={users}
                currentUserId={user?.id}
                onToggleActive={handleToggleActive}
                onAddUser={() => setIsCreateModalOpen(true)}
                onEdit={u => setEditingUser(u)}
                onDelete={u => setDeletingUser(u)}
              />
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleUserCreated}
      />
      <EditUserModal
        isOpen={editingUser !== null}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onUpdated={handleUserUpdated}
      />
      <DeleteUserModal
        isOpen={deletingUser !== null}
        user={deletingUser}
        onClose={() => setDeletingUser(null)}
        onDeleted={handleUserDeleted}
      />

      {/* Toast notification */}
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  )
}
