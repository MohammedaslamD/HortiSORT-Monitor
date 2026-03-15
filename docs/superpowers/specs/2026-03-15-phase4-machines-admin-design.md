# Phase 4: MachinesPage + AdminPage — Design Spec

> **Goal:** Replace the two remaining placeholder pages with full implementations. MachinesPage is an enhanced machine list with model/city filters. AdminPage is an admin-only dashboard with summary stats, activity feed, and user management table with active-status toggle.

---

## 1. MachinesPage

### Route & Access

- Path: `/machines`
- Access: any authenticated user (already wired in `AppRoutes.tsx`)

### Data Fetching

- `getMachinesByRole(user.role, user.id)` — same role scoping as DashboardPage
- No ticket or log data needed — this is a machines-only page
- Standard `useEffect` with `cancelled` flag, `isLoading`, `error` state

### Filters (client-side)

| Filter | Control | Source | Default |
|--------|---------|--------|---------|
| Search | `<Input>` text | Matches `machine_code`, `machine_name`, `city`, `state` (case-insensitive substring) | `''` |
| Status | `<Select>` | `MachineStatus` values + "All Statuses" | `''` |
| Model | `<Select>` | Unique `model` values derived from fetched machines + "All Models" | `''` |
| City | `<Select>` | Unique `city` values derived from fetched machines + "All Cities" | `''` |

All filters are AND-combined. Model and city options are computed dynamically from the machines array so they adapt to role-scoped data (a customer won't see cities where they have no machines).

### Layout

```
┌─────────────────────────────────────────────────┐
│ Machines                            (12 machines)│
├─────────────────────────────────────────────────┤
│ [Search input] [Status ▼] [Model ▼] [City ▼]   │
├─────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│ │MachineCard│ │MachineCard│ │MachineCard│        │
│ └──────────┘ └──────────┘ └──────────┘         │
│ ┌──────────┐ ┌──────────┐ ...                   │
│ └──────────┘ └──────────┘                       │
└─────────────────────────────────────────────────┘
```

- Header: "Machines" + count badge (e.g., "12 machines")
- Filter row: responsive — stacks vertically on mobile (`flex-col sm:flex-row`)
- Grid: reuse `MachineCard` from `components/machines/`. Responsive grid: 1 col on mobile, 2 on sm, 3 on lg
- Empty state: "No machines found." in dashed-border container
- Loading state: centered "Loading..." text

### MachineCard Reuse

`MachineCard` already handles:
- Status badge, machine code/name, model, location
- Today's daily log (optional — not fetched here, pass `undefined`)
- Open ticket count (optional — not fetched here, pass `0`)
- Role-based action buttons (onNavigate, onUpdateStatus, onRaiseTicket)

The MachinesPage will pass `onNavigate` to go to `/machines/:id`. Action buttons `onUpdateStatus` and `onRaiseTicket` will be passed for engineer/admin roles only, same pattern as DashboardPage.

**Note:** Since MachinesPage doesn't fetch tickets or daily logs, MachineCard will show no "today's log" data and `openTicketCount` will be `0`. The card hides its ticket badge when count is 0, which is intentional — the DashboardPage is the go-to for production overview with log/ticket data.

### New Files

- Modify: `src/pages/MachinesPage.tsx` (replace placeholder)

### New Service Code

None. Existing `getMachinesByRole` is sufficient.

### New Types

None.

---

## 2. AdminPage

### Route & Access

- Path: `/admin`
- Access: admin only (already wired with `allowedRoles={['admin']}`)

### Data Fetching

On mount, fetch in parallel:
1. `getUsers()` — all users (new service function)
2. `getMachines()` — all machines (no filters, admin sees all)
3. `getOpenTicketCount()` — open ticket count (existing)
4. `getAllSiteVisits()` — all site visits (existing, for count)
5. `getRecentActivity(10)` — last 10 activity log entries (new service function)

### Section 1: Summary Stats Cards

Four cards in a responsive row (`grid grid-cols-2 lg:grid-cols-4`):

| Card | Value | Sub-text |
|------|-------|----------|
| Total Users | `users.length` | `{activeCount} active` |
| Total Machines | `machines.length` | `{runningCount} running` |
| Open Tickets | `openTicketCount` | — |
| Site Visits | `visits.length` | — |

Each card: white background, rounded border, padding, large number, label below. Same visual pattern as `StatsCards` from the dashboard but different data.

### Section 2: Recent Activity Feed

Timeline-style list of the 10 most recent activity log entries from `MOCK_ACTIVITY_LOG`.

Each entry displays:
- Timestamp (formatted as relative time, e.g., "2 days ago")
- User name (via `getUserName(entry.user_id)`)
- Action description (`entry.action` field — snake_case like `"status_updated"`, display with `action.replaceAll('_', ' ')` and capitalize first letter for readability)
- Entity type badge using `<Badge>`:
  - `machine` → blue
  - `ticket` → yellow
  - `user` → purple

Layout: vertical list with left-aligned timeline dots or simple dividers between entries.

### Section 3: User Management Table

Full-width table listing all users from `MOCK_USERS`.

| Column | Source | Notes |
|--------|--------|-------|
| Name | `user.name` | Left-aligned |
| Email | `user.email` | Truncated on mobile |
| Role | `user.role` | `<Badge>`: admin=purple, engineer=blue, customer=green |
| Status | `user.is_active` | `<Badge>`: active=green, inactive=red |
| Created | `user.created_at` | Formatted date |
| Actions | Toggle button | "Deactivate" (if active) / "Activate" (if inactive) |

**Toggle behavior:**
- Clicking the toggle button calls `toggleUserActive(user.id)`
- Optimistically updates the local state
- Shows a success `<Toast>` ("User {name} deactivated" / "User {name} activated")
- On error, reverts local state and shows error `<Toast>` ("Failed to update user")
- The currently logged-in admin cannot deactivate themselves (button disabled with tooltip or hidden)

**Responsive:** On mobile, hide email and created columns. Use `hidden sm:table-cell` pattern.

### New Service Layer

#### `src/services/userService.ts`

```ts
/** Returns all users. */
async function getUsers(): Promise<User[]>

/** Returns a single user by ID, or null if not found. */
async function getUserById(id: number): Promise<User | null>

/** Toggles a user's is_active flag. Returns the updated user. */
async function toggleUserActive(id: number): Promise<User>
```

All backed by `MOCK_USERS` from mockData.ts.

#### `src/services/activityLogService.ts`

```ts
/** Returns the most recent activity log entries, sorted by created_at descending. */
async function getRecentActivity(limit: number): Promise<ActivityLog[]>
```

Backed by `MOCK_ACTIVITY_LOG` from mockData.ts.

### New Components

#### `src/components/admin/AdminStatsCards.tsx`

Props:
```ts
interface AdminStatsCardsProps {
  totalUsers: number
  activeUsers: number
  totalMachines: number
  runningMachines: number
  openTickets: number
  totalVisits: number
}
```

Renders 4 stat cards in a responsive grid.

#### `src/components/admin/ActivityFeed.tsx`

Props:
```ts
interface ActivityFeedProps {
  activities: ActivityLog[]
}
```

Renders a vertical list of activity entries with entity type badges and relative timestamps.

#### `src/components/admin/UserTable.tsx`

Props:
```ts
interface UserTableProps {
  users: User[]
  currentUserId: number
  onToggleActive: (userId: number) => void
}
```

Renders the user table with responsive column hiding and toggle action buttons.

#### `src/components/admin/index.ts`

Barrel export for all admin components.

### New Files Summary

| Action | File |
|--------|------|
| Create | `src/services/userService.ts` |
| Create | `src/services/activityLogService.ts` |
| Create | `src/components/admin/AdminStatsCards.tsx` |
| Create | `src/components/admin/ActivityFeed.tsx` |
| Create | `src/components/admin/UserTable.tsx` |
| Create | `src/components/admin/index.ts` |
| Modify | `src/pages/MachinesPage.tsx` (replace placeholder) |
| Modify | `src/pages/AdminPage.tsx` (replace placeholder) |

### New Types

None needed. `User`, `ActivityLog`, `Machine` interfaces already exist. Service function signatures use existing types.

### Tests

Following TDD per AGENTS.md (though test runs deferred due to WSL environment):

| Test file | Covers |
|-----------|--------|
| `src/services/__tests__/userService.test.ts` | getUsers, getUserById, toggleUserActive |
| `src/services/__tests__/activityLogService.test.ts` | getRecentActivity |

Component/page tests deferred — consistent with Phase 2/3 approach.

---

## 3. What This Does NOT Include

- No user create/edit forms (out of scope)
- No machine CRUD (admin can't add/edit/delete machines)
- No system settings or configuration page
- No export/download features
- No dashboard-level stats on the MachinesPage (that's what DashboardPage is for)

---

## 4. Dependencies

All dependencies are already installed. No new packages needed.

Existing services/components reused:
- `getMachinesByRole`, `getMachines` from machineService
- `getOpenTicketCount` from ticketService
- `getAllSiteVisits` from siteVisitService
- `getUserName` from utils/userLookup
- `formatRelativeTime` from utils/formatters
- `MachineCard` from components/machines
- `Badge`, `Button`, `Input`, `Select`, `Toast` from components/common
- `StatsCards` pattern (not imported, but visual pattern replicated)
