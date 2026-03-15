# Phase 3: Tickets, Daily Logs & Site Visits — Design Spec

**Date:** 2026-03-15
**Author:** OpenCode
**Status:** Approved

---

## Goal

Implement three fully functional pages to complete the HortiSort Monitor's core operational workflows:

1. **Tickets** — list, detail, raise, comment, status update
2. **Daily Logs** — read-only filtered list across all machines
3. **Site Visits** — list and log new visits (engineer + admin)

All pages follow the same patterns established in Phase 2: service-first, role-scoped, mobile-first Tailwind UI, existing common components only.

---

## Architecture

### Approach

Domain-first, service layer first (Option A):

1. Extend service files with all new functions
2. Build Tickets (list → detail → raise form)
3. Build Daily Logs (list + filters)
4. Build Site Visits (list → log form)
5. Add `task.md` at repo root, updated after each task

### File Map

```
hortisort-monitor/src/
  services/
    ticketService.ts          ← extend (9 new functions)
    dailyLogService.ts        ← extend (1 new function)
    siteVisitService.ts       ← extend (2 new functions)

  components/
    tickets/
      TicketCard.tsx          ← card for list page
      index.ts
    logs/
      DailyLogCard.tsx        ← card for list page
      index.ts
    visits/
      SiteVisitCard.tsx       ← card for list page
      index.ts

  pages/
    TicketsPage.tsx           ← replace placeholder
    TicketDetailPage.tsx      ← new
    RaiseTicketPage.tsx       ← new
    DailyLogsPage.tsx         ← replace placeholder
    SiteVisitsPage.tsx        ← replace placeholder
    LogVisitPage.tsx          ← new

  routes/
    AppRoutes.tsx             ← add /tickets/:id, /tickets/new, /visits/new

task.md                       ← new at repo root
```

---

## Section 1: Service Layer

### `ticketService.ts` — New Functions

| Function | Signature | Notes |
|---|---|---|
| `getTicketsByStatus` | `(status: TicketStatus) => Promise<Ticket[]>` | Filter by lifecycle status |
| `getTicketsBySeverity` | `(severity: TicketSeverity) => Promise<Ticket[]>` | Filter by P1–P4 |
| `getTicketsByAssignedTo` | `(userId: number) => Promise<Ticket[]>` | Engineer's assigned tickets |
| `getTicketsByRaisedBy` | `(userId: number) => Promise<Ticket[]>` | Customer's raised tickets |
| `getTicketComments` | `(ticketId: number) => Promise<TicketComment[]>` | Comments for a ticket, sorted by created_at asc |
| `addTicketComment` | `(data: Omit<TicketComment, 'id' \| 'created_at'>) => Promise<TicketComment>` | Push to MOCK_TICKET_COMMENTS; `id` and `created_at` auto-generated internally |
| `updateTicketStatus` | `(id: number, status: TicketStatus, resolution?: ResolutionData) => Promise<Ticket>` | Mutates MOCK_TICKETS: always sets `status`, `updated_at`; on resolve sets `resolved_at`, `resolution_time_mins`, `root_cause`, `solution`, `parts_used`; on reopen increments `reopen_count`, sets `reopened_at` |
| `createTicket` | `(data: NewTicketData) => Promise<Ticket>` | Push to MOCK_TICKETS, auto-generate ticket_number |
| `getTicketById` | `(id: number) => Promise<Ticket \| null>` | Single ticket lookup |
| `getTicketsByMachineIds` | `(ids: number[]) => Promise<Ticket[]>` | Customer role scoping — tickets for a set of machine ids |

**`ResolutionData` type** (add to `src/types/index.ts` — shared across service + detail page):
```ts
interface ResolutionData {
  root_cause: string
  solution: string
  parts_used?: string
}
```

**`NewTicketData` type** (add to `src/types/index.ts`):
```ts
interface NewTicketData {
  machine_id: number
  raised_by: number
  assigned_to: number
  severity: TicketSeverity
  category: TicketCategory
  title: string
  description: string
}
```

SLA hours are derived from severity: P1=4, P2=8, P3=24, P4=72. `createTicket` computes `sla_hours` internally from the submitted severity before pushing to `MOCK_TICKETS` — it is never a caller-supplied field.

### `dailyLogService.ts` — New Function

| Function | Signature | Notes |
|---|---|---|
| `getAllDailyLogs` | `(filters?: DailyLogFilters) => Promise<DailyLog[]>` | AND-combined filters |

**`DailyLogFilters` type:**
```ts
interface DailyLogFilters {
  machineId?: number
  date?: string        // YYYY-MM-DD exact match
  status?: DailyLogStatus
}
```

### `siteVisitService.ts` — New Functions

| Function | Signature | Notes |
|---|---|---|
| `getAllSiteVisits` | `(filters?: SiteVisitFilters) => Promise<SiteVisit[]>` | AND-combined filters |
| `logSiteVisit` | `(data: NewSiteVisitData) => Promise<SiteVisit>` | Push to MOCK_SITE_VISITS |

**`SiteVisitFilters` type:**
```ts
interface SiteVisitFilters {
  engineerId?: number
  machineId?: number
  purpose?: VisitPurpose
}
```

**`NewSiteVisitData` type:**
```ts
interface NewSiteVisitData {
  machine_id: number
  engineer_id: number
  visit_date: string
  visit_purpose: VisitPurpose
  ticket_id?: number
  findings: string
  actions_taken: string
  parts_replaced?: string
  next_visit_due?: string
}
```

---

## Section 2: Tickets

### `/tickets` — TicketsPage

**Role scoping:**
- `customer` → `getMachinesByRole(user)` to get their machine ids, then `getTicketsByMachineIds(ids)`
- `engineer` → call both `getTicketsByAssignedTo(user.id)` and `getTicketsByRaisedBy(user.id)` in parallel, then deduplicate by `id` before rendering
- `admin` → all tickets

**UI:**
- Page header: "Tickets" + "Raise Ticket" button (engineer + admin only, links to `/tickets/new`)
- Filters row: text search (matches title or ticket_number), status select, severity select, category select
- Results: `TicketCard` component list, sorted created_at descending
- Empty state: "No tickets found."
- Loading skeleton (same spinner pattern as Phase 2)

**`TicketCard` props:**
```ts
interface TicketCardProps {
  ticket: Ticket
  machineName: string
  assignedToName: string
  onClick: () => void
}
```

Card shows: ticket_number (mono font), title, severity badge, status badge, machineName, assignedToName, created date. SLA breach indicator: if status is open/in_progress/reopened and `(Date.now() - created_at) > sla_hours * 3600000`, show a red "SLA Breached" badge.

### `/tickets/:id` — TicketDetailPage

**Sections:**
1. Back link + header (ticket_number, title, severity badge, status badge)
2. Info grid: machine code/name, category, raised by, assigned to, created at, SLA hours
3. Resolution section (visible only if `resolved_at !== null`): resolved at, resolution time, root cause, solution, parts used, customer rating (★ stars), customer feedback
4. Comment thread: sorted asc, each comment shows user name, timestamp, message
5. Add comment form (all roles): textarea + submit button
6. Status update panel (engineer + admin only):
   - Status dropdown (all TicketStatus values)
   - If new status is `resolved`: show root_cause textarea, solution textarea, parts_used input
   - Submit button: "Update Status"

**Data fetching:** `getMachineById`, `getTicketById`, `getTicketComments` — all in parallel via `Promise.all`. `getUserName` from existing `userLookup` utility.

### `/tickets/new` — RaiseTicketPage (engineer + admin)

**Form fields:**
- Machine picker: `Select` component, options role-scoped via `getMachinesByRole`
- Severity: radio buttons (P1 Critical / P2 High / P3 Medium / P4 Low) with SLA hint text
- Category: `Select` (hardware / software / sensor / electrical / other)
- Title: `Input`
- Description: `TextArea`

**On submit:**
- `createTicket()` with `assigned_to` defaulting to the first available admin (id:5) — engineer assigns to admin who will re-assign
- Show success `Toast`
- Redirect to `/tickets/:id` of the new ticket

**Validation:** title required, description required, machine required, severity required, category required.

---

## Section 3: Daily Logs

### `/logs` — DailyLogsPage

**Role scoping:**
- `customer` → logs for their machines (via `getMachinesByRole`, extract ids, filter)
- `engineer` → logs where `updated_by === user.id`
- `admin` → all logs

**UI:**
- Page header: "Daily Logs"
- Filters row: machine select (role-scoped options), date input (`type="date"`), status select
- Results: `DailyLogCard` component list, sorted date descending
- Empty state: "No logs found."

**`DailyLogCard` props:**
```ts
interface DailyLogCardProps {
  log: DailyLog
  machineName: string
  machineCode: string
  recordedByName: string
}
```

Card shows: date, machineCode (mono), machineName, status badge, fruit type, tons processed, shift start–end, notes (truncated at 80 chars), recorded by name.

No create/edit in this page — that is `UpdateStatusPage`.

---

## Section 4: Site Visits

### `/visits` — SiteVisitsPage (engineer + admin)

**Role scoping:**
- `engineer` → visits where `engineer_id === user.id`
- `admin` → all visits

**UI:**
- Page header: "Site Visits" + "Log Visit" button → `/visits/new`
- Filters row: machine select, purpose select, engineer select (admin only — all engineers from `MOCK_USERS`)
- Results: `SiteVisitCard` component list, sorted visit_date descending
- Empty state: "No site visits found."

**`SiteVisitCard` props:**
```ts
interface SiteVisitCardProps {
  visit: SiteVisit
  machineName: string
  machineCode: string
  engineerName: string
}
```

Card shows: visit_date, machineCode + machineName, purpose badge (routine=green, ticket=yellow, installation=blue, training=purple), engineerName, findings (truncated), actions taken (truncated), parts replaced (if present), next visit due (if present).

### `/visits/new` — LogVisitPage (engineer + admin)

**Form fields:**
- Machine picker: `Select`, role-scoped
- Visit date: `Input type="date"`, default today
- Purpose: `Select` (routine / ticket / installation / training)
- Linked ticket: `Select`, optional — populated with open tickets for the selected machine (updates when machine changes)
- Findings: `TextArea`, required
- Actions taken: `TextArea`, required
- Parts replaced: `Input`, optional
- Next visit due: `Input type="date"`, optional

**On submit:**
- `logSiteVisit()` with `engineer_id = user.id`
- Success `Toast`
- Redirect to `/visits`

**Validation:** machine required, visit date required, purpose required, findings required, actions taken required.

---

## Section 5: Routing

New routes added to `AppRoutes.tsx`:

```
/tickets/new              → RaiseTicketPage    (engineer + admin)   ← MUST be declared before /tickets/:id
/tickets/:id              → TicketDetailPage   (all authenticated)
/visits/new               → LogVisitPage       (engineer + admin)
```

> Route order matters: `/tickets/new` must come before `/tickets/:id` in the route list or React Router will match "new" as an id param.

---

## Section 6: `task.md`

Created at repo root (`/mnt/d/Hackathon web app/task.md`).

Format: one line per task, updated after each commit.

```markdown
# HortiSort Monitor — Task Log

| Date       | Phase | Task                                      | Status   |
|------------|-------|-------------------------------------------|----------|
| 2026-03-15 | P2    | Service layer                             | done     |
| 2026-03-15 | P2    | StatsCards + MachineCard components       | done     |
| 2026-03-15 | P2    | DashboardPage                             | done     |
| 2026-03-15 | P2    | MachineDetailPage                         | done     |
| 2026-03-15 | P2    | UpdateStatusPage                          | done     |
| 2026-03-15 | P3    | Phase 3 design spec                       | done     |
```

Each Phase 3 task appends a new row when committed.

---

## Section 7: Error Handling & Edge Cases

- Invalid ticket/visit ID in URL → "not found" state (same pattern as MachineDetailPage)
- Empty filter results → empty state message, never a blank page
- Service mutations (`createTicket`, `addTicketComment`, `updateTicketStatus`, `logSiteVisit`) wrapped in try-catch; errors shown via inline `error: string | null` state
- `getUserName` falls back to `"Unknown"` for missing user ids (already implemented in userLookup)
- SLA breach: calculated client-side from `created_at` + `sla_hours`; no server clock dependency

---

## Section 8: Testing

All new service functions get unit tests in `__tests__/` alongside their service files.
Component tests (`.test.tsx`) are written for all new page components using the custom `render` from `src/test/utils.tsx`.

Pattern follows Phase 2 exactly — TDD (Red → Green → Refactor), one assert per test initially.

Note: Vitest hangs in this WSL environment. Tests are written and committed; verification deferred to a non-WSL run.

---

## Non-Goals (Phase 3)

- No ticket attachment uploads
- No pagination (mock data is small enough)
- No real-time updates / websockets
- No Admin page (deferred to Phase 4)
- No email/WhatsApp notifications
- No edit/delete for existing tickets, logs, or visits
