# Phase 4: MachinesPage + AdminPage — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the two remaining placeholder pages — MachinesPage (enhanced machine list with model/city filters) and AdminPage (admin dashboard with stats, activity feed, and user management table with active-status toggle).

**Architecture:** Create two new services (userService, activityLogService) first, then replace the MachinesPage placeholder with a filter-heavy machine list reusing MachineCard, then build three admin sub-components (AdminStatsCards, ActivityFeed, UserTable) before assembling them in AdminPage. Each chunk produces working, testable software.

**Tech Stack:** React 19, TypeScript 5.9, Vitest 4, Tailwind CSS v3, react-router-dom v7

**Spec:** `docs/superpowers/specs/2026-03-15-phase4-machines-admin-design.md`

**Environment note:** Vitest and `tsc` hang in this WSL environment. Tests are written but verification is deferred to a non-WSL run. Do not wait for test/build commands — move on after 10s timeout.

**Semicolons:** OMIT in all new files. Do NOT add semicolons.

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/services/userService.ts` | CRUD for users — `getUsers`, `getUserById`, `toggleUserActive` |
| Create | `src/services/activityLogService.ts` | Read-only activity log — `getRecentActivity` |
| Create | `src/services/__tests__/userService.test.ts` | Unit tests for userService |
| Create | `src/services/__tests__/activityLogService.test.ts` | Unit tests for activityLogService |
| Modify | `src/pages/MachinesPage.tsx` | Replace placeholder with full machine list + 4 filters |
| Create | `src/components/admin/AdminStatsCards.tsx` | 4 stat cards for admin dashboard |
| Create | `src/components/admin/ActivityFeed.tsx` | Timeline list of recent activity log entries |
| Create | `src/components/admin/UserTable.tsx` | User management table with active toggle |
| Create | `src/components/admin/index.ts` | Barrel export for admin components |
| Modify | `src/pages/AdminPage.tsx` | Replace placeholder with full admin dashboard |
| Modify | `task.md` | Append Phase 4 progress rows |

All paths are relative to `hortisort-monitor/`.

---

## Chunk 1: Service Layer + Tests

### Task 1: Create `userService.ts`

**Files:**
- Create: `hortisort-monitor/src/services/userService.ts`
- Test: `hortisort-monitor/src/services/__tests__/userService.test.ts`

- [ ] **Step 1: Write failing tests for all three functions**

Create `hortisort-monitor/src/services/__tests__/userService.test.ts`:

```ts
import { getUsers, getUserById, toggleUserActive } from '../userService'
import { MOCK_USERS } from '../../data/mockData'

/** Snapshot of original is_active values — restored after each test to prevent state leaking. */
let originalActiveStates: Map<number, boolean>

describe('userService', () => {
  beforeEach(() => {
    originalActiveStates = new Map(MOCK_USERS.map((u) => [u.id, u.is_active]))
  })

  afterEach(() => {
    for (const user of MOCK_USERS) {
      user.is_active = originalActiveStates.get(user.id) ?? true
    }
  })

  describe('getUsers', () => {
    it('returns all 6 mock users', async () => {
      const users = await getUsers()
      expect(users).toHaveLength(6)
    })

    it('returns users with expected properties', async () => {
      const users = await getUsers()
      const first = users[0]
      expect(first).toHaveProperty('id')
      expect(first).toHaveProperty('name')
      expect(first).toHaveProperty('email')
      expect(first).toHaveProperty('role')
      expect(first).toHaveProperty('is_active')
    })
  })

  describe('getUserById', () => {
    it('returns the correct user for a valid ID', async () => {
      const user = await getUserById(1)
      expect(user).not.toBeNull()
      expect(user!.name).toBe('Rajesh Patel')
      expect(user!.role).toBe('customer')
    })

    it('returns null for a non-existent ID', async () => {
      const user = await getUserById(999)
      expect(user).toBeNull()
    })
  })

  describe('toggleUserActive', () => {
    it('deactivates an active user', async () => {
      const user = await toggleUserActive(1)
      expect(user.is_active).toBe(false)
    })

    it('activates an inactive user', async () => {
      // Explicitly deactivate first so this test is self-contained
      await toggleUserActive(1)
      const user = await toggleUserActive(1)
      expect(user.is_active).toBe(true)
    })

    it('throws for a non-existent user ID', async () => {
      await expect(toggleUserActive(999)).rejects.toThrow('User 999 not found')
    })

    it('updates the updated_at timestamp', async () => {
      const before = new Date().toISOString()
      const user = await toggleUserActive(2)
      expect(user.updated_at >= before).toBe(true)
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/services/__tests__/userService.test.ts` (10s timeout — move on)
Expected: FAIL — module `../userService` does not exist

- [ ] **Step 3: Implement userService.ts**

Create `hortisort-monitor/src/services/userService.ts`:

```ts
import type { User } from '../types'
import { MOCK_USERS } from '../data/mockData'

/** Returns all users. */
export async function getUsers(): Promise<User[]> {
  return [...MOCK_USERS]
}

/** Returns a single user by ID, or null if not found. */
export async function getUserById(id: number): Promise<User | null> {
  return MOCK_USERS.find((u) => u.id === id) ?? null
}

/** Toggles a user's is_active flag. Returns the updated user. Throws if not found. */
export async function toggleUserActive(id: number): Promise<User> {
  const user = MOCK_USERS.find((u) => u.id === id)
  if (!user) throw new Error(`User ${id} not found`)

  user.is_active = !user.is_active
  user.updated_at = new Date().toISOString()
  return user
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/services/__tests__/userService.test.ts` (10s timeout — move on)
Expected: PASS — all 7 tests green

- [ ] **Step 5: Commit**

```bash
git add hortisort-monitor/src/services/userService.ts hortisort-monitor/src/services/__tests__/userService.test.ts
git commit -m "feat: add userService with getUsers, getUserById, toggleUserActive"
```

---

### Task 2: Create `activityLogService.ts`

**Files:**
- Create: `hortisort-monitor/src/services/activityLogService.ts`
- Test: `hortisort-monitor/src/services/__tests__/activityLogService.test.ts`

- [ ] **Step 1: Write failing tests**

Create `hortisort-monitor/src/services/__tests__/activityLogService.test.ts`:

```ts
import { getRecentActivity } from '../activityLogService'

describe('activityLogService', () => {
  describe('getRecentActivity', () => {
    it('returns entries sorted by created_at descending', async () => {
      const activities = await getRecentActivity(10)
      for (let i = 1; i < activities.length; i++) {
        expect(activities[i - 1].created_at >= activities[i].created_at).toBe(true)
      }
    })

    it('respects the limit parameter', async () => {
      const activities = await getRecentActivity(3)
      expect(activities).toHaveLength(3)
    })

    it('returns all entries when limit exceeds total count', async () => {
      const activities = await getRecentActivity(100)
      expect(activities).toHaveLength(10)
    })

    it('returns entries with expected properties', async () => {
      const activities = await getRecentActivity(1)
      const entry = activities[0]
      expect(entry).toHaveProperty('id')
      expect(entry).toHaveProperty('user_id')
      expect(entry).toHaveProperty('action')
      expect(entry).toHaveProperty('entity_type')
      expect(entry).toHaveProperty('entity_id')
      expect(entry).toHaveProperty('details')
      expect(entry).toHaveProperty('created_at')
    })

    it('returns the most recent entry first', async () => {
      const all = await getRecentActivity(100)
      const activities = await getRecentActivity(1)
      // First entry should have the latest created_at of any entry
      const maxTimestamp = all.reduce(
        (max, a) => (a.created_at > max ? a.created_at : max),
        '',
      )
      expect(activities[0].created_at).toBe(maxTimestamp)
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/services/__tests__/activityLogService.test.ts` (10s timeout — move on)
Expected: FAIL — module `../activityLogService` does not exist

- [ ] **Step 3: Implement activityLogService.ts**

Create `hortisort-monitor/src/services/activityLogService.ts`:

```ts
import type { ActivityLog } from '../types'
import { MOCK_ACTIVITY_LOG } from '../data/mockData'

/** Returns the most recent activity log entries, sorted by created_at descending. */
export async function getRecentActivity(limit: number): Promise<ActivityLog[]> {
  return [...MOCK_ACTIVITY_LOG]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/services/__tests__/activityLogService.test.ts` (10s timeout — move on)
Expected: PASS — all 5 tests green

- [ ] **Step 5: Commit**

```bash
git add hortisort-monitor/src/services/activityLogService.ts hortisort-monitor/src/services/__tests__/activityLogService.test.ts
git commit -m "feat: add activityLogService with getRecentActivity"
```

---

### Task 3: Update task.md with service layer progress

**Files:**
- Modify: `task.md`

- [ ] **Step 1: Append Phase 4 header and service rows to task.md**

Add after the Phase 3 section:

```markdown
---

## Phase 4: MachinesPage + AdminPage

### Status: IN PROGRESS

| Date       | Task                                      | Status      |
|------------|-------------------------------------------|-------------|
| 2026-03-15 | Phase 4 design spec                       | done        |
| 2026-03-15 | Phase 4 implementation plan               | done        |
| 2026-03-15 | userService (3 functions + tests)         | done        |
| 2026-03-15 | activityLogService (1 function + tests)   | done        |
```

- [ ] **Step 2: Commit**

```bash
git add task.md
git commit -m "chore: update task.md with Phase 4 service layer progress"
```

---

## Chunk 2: MachinesPage

### Task 4: Replace MachinesPage placeholder with full implementation

**Files:**
- Modify: `hortisort-monitor/src/pages/MachinesPage.tsx` (replace placeholder)

- [ ] **Step 1: Implement MachinesPage.tsx**

Replace the entire contents of `hortisort-monitor/src/pages/MachinesPage.tsx` with:

```tsx
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import type { Machine, MachineStatus } from '../types'
import { useAuth } from '../context/AuthContext'
import { getMachinesByRole } from '../services/machineService'
import { MachineCard } from '../components/machines/MachineCard'
import { Input, Select } from '../components/common'

/** Status filter options for the dropdown. */
const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'running', label: 'Running' },
  { value: 'idle', label: 'Idle' },
  { value: 'down', label: 'Down' },
  { value: 'offline', label: 'Offline' },
]

/**
 * Enhanced machine list page with search, status, model, and city filters.
 *
 * - Fetches machines scoped to the current user's role via getMachinesByRole.
 * - Model and city options are computed dynamically from fetched data.
 * - Reuses MachineCard with todayLog=undefined and openTicketCount=0.
 * - Role-based action buttons for engineer/admin.
 */
export function MachinesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Data state
  const [machines, setMachines] = useState<Machine[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<MachineStatus | ''>('')
  const [modelFilter, setModelFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')

  // Fetch machines on mount
  useEffect(() => {
    if (!user) return

    let cancelled = false

    async function fetchData() {
      setIsLoading(true)
      setError(null)

      try {
        const fetchedMachines = await getMachinesByRole(user!.role, user!.id)
        if (cancelled) return
        setMachines(fetchedMachines)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load machines.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [user])

  // Dynamic model options — derived from fetched machines
  const modelOptions = useMemo(() => {
    const models = [...new Set(machines.map((m) => m.model))].sort()
    return [
      { value: '', label: 'All Models' },
      ...models.map((model) => ({ value: model, label: model })),
    ]
  }, [machines])

  // Dynamic city options — derived from fetched machines
  const cityOptions = useMemo(() => {
    const cities = [...new Set(machines.map((m) => m.city))].sort()
    return [
      { value: '', label: 'All Cities' },
      ...cities.map((city) => ({ value: city, label: city })),
    ]
  }, [machines])

  // Client-side filtering — all filters AND-combined
  const filteredMachines = useMemo(() => {
    return machines.filter((m) => {
      if (statusFilter && m.status !== statusFilter) return false
      if (modelFilter && m.model !== modelFilter) return false
      if (cityFilter && m.city !== cityFilter) return false

      if (search) {
        const term = search.toLowerCase()
        const matchesSearch =
          m.machine_code.toLowerCase().includes(term) ||
          m.machine_name.toLowerCase().includes(term) ||
          m.city.toLowerCase().includes(term) ||
          m.state.toLowerCase().includes(term)
        if (!matchesSearch) return false
      }

      return true
    })
  }, [machines, statusFilter, modelFilter, cityFilter, search])

  // Navigation handlers
  const handleNavigate = useCallback(
    (machineId: number) => navigate(`/machines/${machineId}`),
    [navigate],
  )

  const handleUpdateStatus = useCallback(
    (machineId: number) => navigate(`/machines/${machineId}/update-status`),
    [navigate],
  )

  const handleRaiseTicket = useCallback(
    (machineId: number) => navigate(`/tickets/new?machine=${machineId}`),
    [navigate],
  )

  if (!user) return null

  const userRole = user.role

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Machines</h2>
        <span className="text-sm text-gray-500">
          {filteredMachines.length} {filteredMachines.length === 1 ? 'machine' : 'machines'}
        </span>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      ) : (
        <>
          {/* Filter row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search machines, cities, states..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="search"
              />
            </div>
            <div className="w-full sm:w-44">
              <Select
                options={STATUS_OPTIONS}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as MachineStatus | '')}
              />
            </div>
            <div className="w-full sm:w-44">
              <Select
                options={modelOptions}
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-44">
              <Select
                options={cityOptions}
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              />
            </div>
          </div>

          {/* Machine grid or empty state */}
          {filteredMachines.length === 0 ? (
            <div className="flex items-center justify-center py-12 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
              <p className="text-gray-500 text-sm">No machines found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMachines.map((machine) => (
                <MachineCard
                  key={machine.id}
                  machine={machine}
                  todayLog={undefined}
                  openTicketCount={0}
                  userRole={userRole}
                  onNavigate={handleNavigate}
                  onUpdateStatus={
                    userRole !== 'customer' ? handleUpdateStatus : undefined
                  }
                  onRaiseTicket={
                    userRole !== 'customer' ? handleRaiseTicket : undefined
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
```

Key implementation notes:
- Model/city select options are computed dynamically from the fetched machines via `useMemo`, so a customer only sees models/cities relevant to their machines.
- `todayLog={undefined}` and `openTicketCount={0}` — this page doesn't fetch ticket/log data. MachineCard hides the ticket badge when count is 0, which is intentional.
- Filter row is `flex-col sm:flex-row` for mobile stacking.
- Grid is `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` per spec.
- Same `handleNavigate`, `handleUpdateStatus`, `handleRaiseTicket` pattern as DashboardPage.
- Same role-based action button pattern: non-customer roles get Update Status and Raise Ticket buttons.

- [ ] **Step 2: Verify type-checking**

Run: `npx tsc -b --noEmit` (10s timeout — move on)
Expected: No type errors from MachinesPage.tsx

- [ ] **Step 3: Commit**

```bash
git add hortisort-monitor/src/pages/MachinesPage.tsx
git commit -m "feat: build MachinesPage with search, status, model, and city filters"
```

- [ ] **Step 4: Update task.md** — append row:

```markdown
| 2026-03-15 | MachinesPage (filters + MachineCard grid) | done        |
```

- [ ] **Step 5: Commit task.md**

```bash
git add task.md
git commit -m "chore: update task.md — MachinesPage done"
```

---

## Chunk 3: Admin Components + AdminPage + Final

### Task 5: Create `AdminStatsCards` component

**Files:**
- Create: `hortisort-monitor/src/components/admin/AdminStatsCards.tsx`

- [ ] **Step 1: Implement AdminStatsCards.tsx**

```tsx
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
```

- [ ] **Step 2: Commit (batched with other admin components in Task 7, Step 3)**

---

### Task 6: Create `ActivityFeed` component

**Files:**
- Create: `hortisort-monitor/src/components/admin/ActivityFeed.tsx`

- [ ] **Step 1: Implement ActivityFeed.tsx**

```tsx
import type { ActivityLog, EntityType } from '../../types'
import { Badge } from '../common/Badge'
import { formatRelativeTime } from '../../utils/formatters'
import { getUserName } from '../../utils/userLookup'

interface ActivityFeedProps {
  activities: ActivityLog[]
}

/** Maps entity_type to Badge color. */
const ENTITY_COLOR_MAP: Record<EntityType, 'blue' | 'yellow' | 'purple'> = {
  machine: 'blue',
  ticket: 'yellow',
  user: 'purple',
}

/** Formats a snake_case action string for display — replaces underscores with spaces and capitalizes first letter. */
function formatAction(action: string): string {
  const spaced = action.replaceAll('_', ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

/**
 * Vertical timeline of recent activity log entries.
 * Each entry shows: relative time, user name, formatted action, entity type badge.
 */
export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
        <p className="text-gray-500 text-sm">No recent activity.</p>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {activities.map((entry, index) => (
        <div
          key={entry.id}
          className={`flex items-start gap-3 py-3 ${
            index < activities.length - 1 ? 'border-b border-gray-100' : ''
          }`}
        >
          {/* Timeline dot */}
          <div className="mt-1.5 w-2 h-2 rounded-full bg-gray-400 flex-shrink-0" />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-900">
                {getUserName(entry.user_id)}
              </span>
              <Badge color={ENTITY_COLOR_MAP[entry.entity_type]} size="sm">
                {entry.entity_type}
              </Badge>
            </div>
            <p className="text-sm text-gray-700 mt-0.5">
              {formatAction(entry.action)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {formatRelativeTime(entry.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit (batched with other admin components in Task 7, Step 3)**

---

### Task 7: Create `UserTable` component

**Files:**
- Create: `hortisort-monitor/src/components/admin/UserTable.tsx`

- [ ] **Step 1: Implement UserTable.tsx**

```tsx
import type { User, UserRole } from '../../types'
import { Badge } from '../common/Badge'
import { Button } from '../common/Button'

interface UserTableProps {
  users: User[]
  currentUserId: number
  onToggleActive: (userId: number) => void
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
export function UserTable({ users, currentUserId, onToggleActive }: UserTableProps) {
  return (
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
                  <Button
                    variant={user.is_active ? 'danger' : 'primary'}
                    size="sm"
                    onClick={() => onToggleActive(user.id)}
                    disabled={isSelf}
                  >
                    {user.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Create barrel export `index.ts`**

Create `hortisort-monitor/src/components/admin/index.ts`:

```ts
export { AdminStatsCards } from './AdminStatsCards'
export { ActivityFeed } from './ActivityFeed'
export { UserTable } from './UserTable'
```

- [ ] **Step 3: Commit all admin components together**

```bash
git add hortisort-monitor/src/components/admin/
git commit -m "feat: add admin components — AdminStatsCards, ActivityFeed, UserTable"
```

- [ ] **Step 4: Update task.md** — append row:

```markdown
| 2026-03-15 | Admin components (3 components + barrel) | done        |
```

---

### Task 8: Replace AdminPage placeholder with full implementation

**Files:**
- Modify: `hortisort-monitor/src/pages/AdminPage.tsx` (replace placeholder)

- [ ] **Step 1: Implement AdminPage.tsx**

Replace the entire contents of `hortisort-monitor/src/pages/AdminPage.tsx` with:

```tsx
import { useState, useEffect, useCallback } from 'react'

import type { User, Machine, ActivityLog } from '../types'
import { useAuth } from '../context/AuthContext'
import { getUsers, toggleUserActive } from '../services/userService'
import { getMachines } from '../services/machineService'
import { getOpenTicketCount } from '../services/ticketService'
import { getAllSiteVisits } from '../services/siteVisitService'
import { getRecentActivity } from '../services/activityLogService'
import { AdminStatsCards, ActivityFeed, UserTable } from '../components/admin'
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

  if (!user) return null

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <h2 className="text-xl font-semibold text-gray-900">Admin Dashboard</h2>

      {/* Error banner */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500 text-sm">Loading...</p>
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
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <ActivityFeed activities={activities} />
            </div>
          </div>

          {/* Section 3: User Management */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Management</h3>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <UserTable
                users={users}
                currentUserId={user.id}
                onToggleActive={handleToggleActive}
              />
            </div>
          </div>
        </>
      )}

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
```

Key implementation notes:
- All 5 data sources fetched in parallel with `Promise.all` on mount.
- `handleToggleActive` does optimistic update: mutates `users` state immediately, then calls `toggleUserActive`. On error, reverts to the original `is_active` value.
- Admin can't deactivate themselves — `UserTable` handles this by disabling the button when `user.id === currentUserId`.
- The `catch` block uses bare `catch` (no parameter) since we don't use the error object — this avoids `noUnusedParameters`.
- `Toast` component is reused for success/error feedback.

- [ ] **Step 2: Verify type-checking**

Run: `npx tsc -b --noEmit` (10s timeout — move on)
Expected: No type errors from AdminPage.tsx or admin components

- [ ] **Step 3: Commit**

```bash
git add hortisort-monitor/src/pages/AdminPage.tsx
git commit -m "feat: build AdminPage with stats, activity feed, and user management table"
```

- [ ] **Step 4: Update task.md** — append rows:

```markdown
| 2026-03-15 | AdminPage (stats + activity + users)    | done        |
| 2026-03-15 | Phase 4 complete                          | done        |
```

Also change `### Status: IN PROGRESS` to `### Status: COMPLETE`.

- [ ] **Step 5: Final commit**

```bash
git add task.md
git commit -m "chore: Phase 4 complete — MachinesPage + AdminPage fully implemented"
```
