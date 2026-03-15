# Phase 2 Design: Dashboard + Machine Management

**Date:** 2026-03-15
**Status:** Approved
**Scope:** Read-only Dashboard, Machine List, and Machine Detail pages with supporting service layer.

## Decisions

| Decision | Choice |
|---|---|
| Data scoping | Single view — all roles see all data |
| Machine Detail | Dedicated page at `/machines/:id` |
| Machine List filtering | Filter bar + search (no column sorting) |
| Create/Edit forms | Deferred to later phase |
| Service layer pattern | Plain async functions |

## 1. Service Layer

Three new service modules under `src/services/`. Each exports plain async functions that wrap mock data, returning Promises to simulate API calls. When the real backend is built, only the function bodies change.

### machineService.ts

```typescript
getMachines(filters?: MachineFilters): Promise<Machine[]>
getMachineById(id: number): Promise<Machine | null>
getMachineStats(): Promise<MachineStats>
getMachineHistoryByMachineId(machineId: number): Promise<MachineHistory[]>
```

- `MachineFilters` and `MachineStats` interfaces are defined in `src/types/index.ts` alongside existing types:
  ```typescript
  interface MachineFilters { status?: MachineStatus; model?: string; city?: string; search?: string; }
  interface MachineStats { total: number; running: number; idle: number; down: number; offline: number; }
  ```
- `getMachines` filters by status, model, city, and searches machine_code + machine_name
- All functions are async (return Promises) even though data is local

### ticketService.ts

```typescript
getTickets(): Promise<Ticket[]>
getTicketsByMachineId(machineId: number): Promise<Ticket[]>
getRecentTickets(limit: number): Promise<Ticket[]>
```

- `getRecentTickets` sorts by `created_at` descending, returns first `limit` items

### dailyLogService.ts

```typescript
getDailyLogs(): Promise<DailyLog[]>
getDailyLogsByMachineId(machineId: number): Promise<DailyLog[]>
getRecentDailyLogs(limit: number): Promise<DailyLog[]>
```

- `getRecentDailyLogs` sorts by `date` descending, returns first `limit` items

### Helper: userLookup (`src/utils/userLookup.ts`)

A small utility to resolve user IDs to names from mock data. Used by Machine Detail (customer name, engineer name) and ticket/log displays.

```typescript
getUserById(id: number): User | undefined
getUserName(id: number): string  // returns name or "Unknown"
```

## 2. Dashboard Page

Replaces the placeholder `DashboardPage.tsx`. URL: `/dashboard`.

### Layout

```
Stats Row:  [Total] [Running] [Down] [Idle] [Offline]
            5 cards in a responsive grid (1 col mobile, 2-3 col tablet, 5 col desktop)

Content:    [Recent Tickets (5)]     [Recent Logs (5)]
            2-column grid (stacks on mobile)
```

### Stats Row

5 cards:
- **Total Machines** — count of all machines, blue accent
- **Running** — green accent
- **Down** — red accent
- **Idle** — yellow accent
- **Offline** — gray accent

Each card uses the existing `Card` component and shows a numeric value with a label and colored indicator.

### Recent Tickets Widget

- Shows 5 most recent tickets (from `ticketService.getRecentTickets(5)`)
- Each row: ticket_number, severity Badge, title (truncated), status Badge, machine_code (build a machine ID→code map from `getMachines()` result to avoid N+1 lookups)
- "View All Tickets" link at bottom navigates to `/tickets`

### Recent Logs Widget

- Shows 5 most recent daily logs (from `dailyLogService.getRecentDailyLogs(5)`)
- Each row: date, machine_code (looked up), fruit_type, tons_processed, status
- "View All Logs" link at bottom navigates to `/logs`

### Components

| File | Purpose |
|---|---|
| `src/components/dashboard/StatsCard.tsx` | Single stat card (label, value, color) |
| `src/components/dashboard/RecentTickets.tsx` | Recent tickets list widget |
| `src/components/dashboard/RecentLogs.tsx` | Recent daily logs list widget |
| `src/pages/DashboardPage.tsx` | Page: fetches stats/tickets/logs, wires widgets |

## 3. Machine List Page

Replaces the placeholder `MachinesPage.tsx`. URL: `/machines`.

### Layout

```
Header:     "Machines" title
Filters:    [Search input]  [Status dropdown]  [Model dropdown]  [City dropdown]
Table:      machine_code | machine_name | model | status | city | engineer
            (each row clickable → /machines/:id)
Mobile:     Card list instead of table
```

### Filter Bar

- **Search:** Text input filtering on `machine_code` and `machine_name` (case-insensitive contains)
- **Status:** Select dropdown with options: All, Running, Idle, Down, Offline
- **Model:** Select dropdown populated from unique model values in mock data
- **City:** Select dropdown populated from unique city values in mock data
- Filters are AND-combined (all must match)
- Uses existing `Input` and `Select` common components

### Table

- Columns: Code, Name, Model, Status (Badge), City, Engineer (user lookup)
- Row click navigates to `/machines/:id` using `useNavigate`
- Responsive: on screens below Tailwind `md:` breakpoint (768px), renders as stacked cards instead of a table

### Components

| File | Purpose |
|---|---|
| `src/components/machines/MachineFilters.tsx` | Search + filter dropdowns |
| `src/components/machines/MachineTable.tsx` | Table (desktop) / card list (mobile) |
| `src/pages/MachinesPage.tsx` | Page: manages filter state, calls machineService, wires components |

## 4. Machine Detail Page

New page at `/machines/:id`. Shows comprehensive info for one machine across 4 tabs.

### Layout

```
Header:     ← Back to Machines | machine_code | machine_name | status Badge
Tabs:       [Overview] [Daily Logs] [Tickets] [History]
Content:    Tab-specific content below
```

### Header

- Back link (navigates to `/machines`)
- Machine code + name as title
- Status Badge (color-coded)

### Error State (invalid or non-existent machine ID)

If `getMachineById` returns `null` (invalid ID like `/machines/999` or non-numeric ID), the page shows:
- "Machine not found" message centered on the page
- A "Back to Machines" link to navigate back to `/machines`
- No tabs or content rendered

### Tabs (client-side, local state)

**Overview Tab:**
Two cards side by side (stack on mobile):
- **Machine Info:** model, serial_number, num_lanes, grading_features, software_version
- **Assignment:** customer name (user lookup), engineer name (user lookup), location, city, state, installation_date, last_updated

**Daily Logs Tab:**
- Table of all logs for this machine (from `dailyLogService.getDailyLogsByMachineId`)
- Columns: date, status, fruit_type, tons_processed, shift times, notes
- DailyLogStatus badge colors: `running` = green, `not_running` = red, `maintenance` = yellow
- Empty state if no logs

**Tickets Tab:**
- Table of all tickets for this machine (from `ticketService.getTicketsByMachineId`)
- Columns: ticket_number, severity Badge, title, status Badge, created_at
- Empty state if no tickets

**History Tab:**
- Timeline/list of machine_history entries for this machine
- Each entry: date, change_type Badge, old_value → new_value, changed_by (user lookup), notes
- Sorted by created_at descending (newest first)
- Empty state if no history

### Route

Add to `AppRoutes.tsx`:
```tsx
<Route path="/machines/:id" element={<ProtectedRoute><MachineDetailPage /></ProtectedRoute>} />
```

### Components

| File | Purpose |
|---|---|
| `src/components/machines/MachineHeader.tsx` | Back link + name + status badge |
| `src/components/machines/MachineOverview.tsx` | Specs + assignment info cards |
| `src/components/machines/MachineLogs.tsx` | Daily logs table for one machine |
| `src/components/machines/MachineTickets.tsx` | Tickets table for one machine |
| `src/components/machines/MachineHistory.tsx` | History timeline for one machine |
| `src/pages/MachineDetailPage.tsx` | Page: reads :id param, fetches data, tab state, wires components |

## 5. Testing Strategy

Following AGENTS.md TDD rules. Tests are required for:

### Service layer (TDD — full Red-Green-Refactor)
- `machineService.test.ts` — getMachines (with/without filters), getMachineById, getMachineStats, getMachineHistoryByMachineId
- `ticketService.test.ts` — getTickets, getTicketsByMachineId, getRecentTickets
- `dailyLogService.test.ts` — getDailyLogs, getDailyLogsByMachineId, getRecentDailyLogs

### Pages (TDD — full Red-Green-Refactor)
- `DashboardPage.test.tsx` — renders stats, recent tickets, recent logs
- `MachinesPage.test.tsx` — renders machine list, filters work, row click navigates
- `MachineDetailPage.test.tsx` — renders machine info, tabs switch content, handles invalid ID

### UI sub-components (no TDD — built directly)
- StatsCard, MachineFilters, MachineTable, MachineHeader, MachineOverview, MachineLogs, MachineTickets, MachineHistory
- These are small presentational components; per project rules, TDD is not required for them.

## 6. File Summary

### New files
```
src/services/machineService.ts
src/services/ticketService.ts
src/services/dailyLogService.ts
src/services/__tests__/machineService.test.ts
src/services/__tests__/ticketService.test.ts
src/services/__tests__/dailyLogService.test.ts
src/components/dashboard/StatsCard.tsx
src/components/dashboard/RecentTickets.tsx
src/components/dashboard/RecentLogs.tsx
src/components/dashboard/index.ts
src/components/machines/MachineFilters.tsx
src/components/machines/MachineTable.tsx
src/components/machines/MachineHeader.tsx
src/components/machines/MachineOverview.tsx
src/components/machines/MachineLogs.tsx
src/components/machines/MachineTickets.tsx
src/components/machines/MachineHistory.tsx
src/components/machines/index.ts
src/pages/MachineDetailPage.tsx
src/pages/__tests__/DashboardPage.test.tsx
src/pages/__tests__/MachinesPage.test.tsx
src/pages/__tests__/MachineDetailPage.test.tsx
src/utils/userLookup.ts
```

### Modified files
```
src/types/index.ts               — add MachineFilters and MachineStats interfaces
src/pages/DashboardPage.tsx          — replace placeholder
src/pages/MachinesPage.tsx           — replace placeholder
src/routes/AppRoutes.tsx             — add /machines/:id route
```

## 7. Dependencies

No new npm packages. Everything uses existing: React, react-router-dom, Tailwind CSS, and the common components from Phase 1.
