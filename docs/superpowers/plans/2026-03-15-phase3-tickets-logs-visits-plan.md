# Phase 3: Tickets, Daily Logs & Site Visits — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Tickets (list + detail + raise form), Daily Logs (read-only filtered list), and Site Visits (list + log form) pages with extended service layer, role-based scoping, and `task.md` tracking.

**Architecture:** Extend existing service files with new query/mutation functions first, then build each page domain in order: Tickets → Daily Logs → Site Visits. Each page uses existing common components (Button, Badge, Card, Input, Select, TextArea, Toast). Role scoping follows Phase 2 patterns via `getMachinesByRole(role, userId)`.

**Tech Stack:** React 19, TypeScript 5.9, Vitest 4, Tailwind CSS v3, react-router-dom v7

**Spec:** `docs/superpowers/specs/2026-03-15-phase3-tickets-logs-visits-design.md`

**Environment note:** Vitest and `tsc` hang in this WSL environment. Tests are written but verification is deferred to a non-WSL run. Do not wait for test/build commands — move on after 10s timeout.

---

## Chunk 1: New Types + Service Layer + task.md

### Task 1: Add new types to `src/types/index.ts`

**Files:**
- Modify: `hortisort-monitor/src/types/index.ts`

- [ ] **Step 1: Add ResolutionData, NewTicketData, DailyLogFilters, SiteVisitFilters, NewSiteVisitData interfaces**

Add these after the existing `MachineStats` interface (around line 74):

```ts
/** Data required when resolving a ticket. */
export interface ResolutionData {
  root_cause: string
  solution: string
  parts_used?: string
}

/** Input data for creating a new ticket (service-layer input). */
export interface NewTicketData {
  machine_id: number
  raised_by: number
  assigned_to: number
  severity: TicketSeverity
  category: TicketCategory
  title: string
  description: string
}

/** Filters for the daily logs list page. All fields optional, AND-combined. */
export interface DailyLogFilters {
  machineId?: number
  date?: string
  status?: DailyLogStatus
}

/** Filters for the site visits list page. All fields optional, AND-combined. */
export interface SiteVisitFilters {
  engineerId?: number
  machineId?: number
  purpose?: VisitPurpose
}

/** Input data for logging a new site visit. */
export interface NewSiteVisitData {
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

- [ ] **Step 2: Commit**

```bash
git add hortisort-monitor/src/types/index.ts
git commit -m "feat: add Phase 3 types — ResolutionData, NewTicketData, filter and input interfaces"
```

---

### Task 2: Extend `ticketService.ts` with 10 new functions

**Files:**
- Modify: `hortisort-monitor/src/services/ticketService.ts`
- Test: `hortisort-monitor/src/services/__tests__/ticketService.test.ts`

- [ ] **Step 1: Write tests for all new functions**

Create/extend `ticketService.test.ts` with tests for: `getTicketById`, `getTicketsByStatus`, `getTicketsBySeverity`, `getTicketsByAssignedTo`, `getTicketsByRaisedBy`, `getTicketsByMachineIds`, `getTicketComments`, `addTicketComment`, `updateTicketStatus`, `createTicket`.

Key test cases:
- `getTicketById(1)` returns TKT-00001; `getTicketById(999)` returns null
- `getTicketsByStatus('open')` returns tickets 1, 5, 9
- `getTicketsBySeverity('P1_critical')` returns tickets 1, 2
- `getTicketsByAssignedTo(5)` returns tickets assigned to admin Aslam (ids 1,2,4,6,8,10)
- `getTicketsByRaisedBy(4)` returns tickets raised by Priya (ids 1,2,4,9,10)
- `getTicketsByMachineIds([3, 8])` returns tickets for machines 3 and 8 (ids 1, 2)
- `getTicketComments(1)` returns 3 comments sorted by created_at asc
- `addTicketComment` adds a comment and auto-generates id and created_at
- `updateTicketStatus` to 'resolved' sets resolved_at, resolution_time_mins, root_cause, solution, parts_used, updated_at
- `updateTicketStatus` to 'reopened' increments reopen_count and sets reopened_at
- `createTicket` auto-generates id, ticket_number, sla_hours from severity, timestamps

- [ ] **Step 2: Implement all 10 new functions in ticketService.ts**

```ts
import type { Ticket, TicketStatus, TicketSeverity, TicketComment, ResolutionData, NewTicketData } from '../types'
import { MOCK_TICKETS, MOCK_TICKET_COMMENTS } from '../data/mockData'

// ... existing functions remain unchanged ...

/** SLA hours by severity. */
const SLA_HOURS: Record<TicketSeverity, number> = {
  P1_critical: 4,
  P2_high: 8,
  P3_medium: 24,
  P4_low: 72,
}

/** Returns a single ticket by ID, or null if not found. */
export async function getTicketById(id: number): Promise<Ticket | null> {
  return MOCK_TICKETS.find((t) => t.id === id) ?? null
}

/** Returns tickets matching a specific status. */
export async function getTicketsByStatus(status: TicketStatus): Promise<Ticket[]> {
  return MOCK_TICKETS.filter((t) => t.status === status)
}

/** Returns tickets matching a specific severity. */
export async function getTicketsBySeverity(severity: TicketSeverity): Promise<Ticket[]> {
  return MOCK_TICKETS.filter((t) => t.severity === severity)
}

/** Returns tickets assigned to a specific user. */
export async function getTicketsByAssignedTo(userId: number): Promise<Ticket[]> {
  return MOCK_TICKETS.filter((t) => t.assigned_to === userId)
}

/** Returns tickets raised by a specific user. */
export async function getTicketsByRaisedBy(userId: number): Promise<Ticket[]> {
  return MOCK_TICKETS.filter((t) => t.raised_by === userId)
}

/** Returns tickets for a set of machine IDs (customer role scoping). */
export async function getTicketsByMachineIds(ids: number[]): Promise<Ticket[]> {
  const idSet = new Set(ids)
  return MOCK_TICKETS.filter((t) => idSet.has(t.machine_id))
}

/** Returns comments for a ticket, sorted by created_at ascending. */
export async function getTicketComments(ticketId: number): Promise<TicketComment[]> {
  return [...MOCK_TICKET_COMMENTS]
    .filter((c) => c.ticket_id === ticketId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
}

/** Adds a comment to a ticket. Auto-generates id and created_at. */
export async function addTicketComment(
  data: Omit<TicketComment, 'id' | 'created_at'>,
): Promise<TicketComment> {
  const now = new Date().toISOString()
  const comment: TicketComment = {
    id: MOCK_TICKET_COMMENTS.length + 1,
    ...data,
    created_at: now,
  }
  MOCK_TICKET_COMMENTS.push(comment)
  return comment
}

/** Updates a ticket's status. On resolve, sets resolution fields. On reopen, increments reopen_count. */
export async function updateTicketStatus(
  id: number,
  status: TicketStatus,
  resolution?: ResolutionData,
): Promise<Ticket> {
  const ticket = MOCK_TICKETS.find((t) => t.id === id)
  if (!ticket) throw new Error(`Ticket ${id} not found`)

  const now = new Date().toISOString()
  ticket.status = status
  ticket.updated_at = now

  if (status === 'resolved' && resolution) {
    ticket.resolved_at = now
    ticket.resolution_time_mins = Math.round(
      (Date.now() - new Date(ticket.created_at).getTime()) / 60000,
    )
    ticket.root_cause = resolution.root_cause
    ticket.solution = resolution.solution
    ticket.parts_used = resolution.parts_used ?? null
  }

  if (status === 'reopened') {
    ticket.reopen_count += 1
    ticket.reopened_at = now
    ticket.resolved_at = null
    ticket.resolution_time_mins = null
  }

  return ticket
}

/** Creates a new ticket. Auto-generates id, ticket_number, sla_hours, timestamps. */
export async function createTicket(data: NewTicketData): Promise<Ticket> {
  const now = new Date().toISOString()
  const id = MOCK_TICKETS.length + 1
  const ticketNumber = `TKT-${String(id).padStart(5, '0')}`

  const ticket: Ticket = {
    id,
    ticket_number: ticketNumber,
    ...data,
    status: 'open',
    sla_hours: SLA_HOURS[data.severity],
    created_at: now,
    resolved_at: null,
    resolution_time_mins: null,
    root_cause: null,
    solution: null,
    parts_used: null,
    reopen_count: 0,
    reopened_at: null,
    customer_rating: null,
    customer_feedback: null,
    updated_at: now,
  }
  MOCK_TICKETS.push(ticket)
  return ticket
}
```

- [ ] **Step 3: Commit**

```bash
git add hortisort-monitor/src/services/ticketService.ts hortisort-monitor/src/services/__tests__/ticketService.test.ts
git commit -m "feat: extend ticketService with getTicketById, filters, comments, create, and status update"
```

---

### Task 3: Extend `dailyLogService.ts` with `getAllDailyLogs`

**Files:**
- Modify: `hortisort-monitor/src/services/dailyLogService.ts`
- Test: `hortisort-monitor/src/services/__tests__/dailyLogService.test.ts`

- [ ] **Step 1: Write tests for getAllDailyLogs**

Test cases:
- No filters → returns all logs sorted by date descending
- `machineId: 1` → returns only logs for machine 1
- `date: '2026-03-15'` → returns only logs from that date
- `status: 'running'` → returns only running logs
- Combined filters: `machineId: 1, status: 'running'` → intersection

- [ ] **Step 2: Implement getAllDailyLogs**

Add to `dailyLogService.ts`:

```ts
import type { DailyLog, DailyLogStatus, DailyLogFilters } from '../types'

/** Returns all daily logs, optionally filtered. Sorted by date descending. */
export async function getAllDailyLogs(filters?: DailyLogFilters): Promise<DailyLog[]> {
  let result = [...MOCK_DAILY_LOGS]

  if (filters?.machineId) {
    result = result.filter((l) => l.machine_id === filters.machineId)
  }

  if (filters?.date) {
    result = result.filter((l) => l.date === filters.date)
  }

  if (filters?.status) {
    result = result.filter((l) => l.status === filters.status)
  }

  return result.sort((a, b) => b.date.localeCompare(a.date))
}
```

- [ ] **Step 3: Commit**

```bash
git add hortisort-monitor/src/services/dailyLogService.ts hortisort-monitor/src/services/__tests__/dailyLogService.test.ts
git commit -m "feat: add getAllDailyLogs with machine/date/status filters"
```

---

### Task 4: Extend `siteVisitService.ts` with `getAllSiteVisits` and `logSiteVisit`

**Files:**
- Modify: `hortisort-monitor/src/services/siteVisitService.ts`
- Test: `hortisort-monitor/src/services/__tests__/siteVisitService.test.ts`

- [ ] **Step 1: Write tests**

Test cases:
- `getAllSiteVisits()` → returns all 6 visits sorted by visit_date descending
- `getAllSiteVisits({ engineerId: 3 })` → returns visits by Amit (ids 2, 5, 6)
- `getAllSiteVisits({ machineId: 3 })` → returns visit for machine 3 (id 1)
- `getAllSiteVisits({ purpose: 'ticket' })` → returns ticket visits (ids 1, 3, 6)
- `logSiteVisit(data)` → adds visit, auto-generates id and created_at, returns new visit

- [ ] **Step 2: Implement both functions**

```ts
import type { SiteVisit, SiteVisitFilters, NewSiteVisitData } from '../types'
import { MOCK_SITE_VISITS } from '../data/mockData'

// ... existing getSiteVisitsByMachineId remains ...

/** Returns all site visits, optionally filtered. Sorted by visit_date descending. */
export async function getAllSiteVisits(filters?: SiteVisitFilters): Promise<SiteVisit[]> {
  let result = [...MOCK_SITE_VISITS]

  if (filters?.engineerId) {
    result = result.filter((v) => v.engineer_id === filters.engineerId)
  }

  if (filters?.machineId) {
    result = result.filter((v) => v.machine_id === filters.machineId)
  }

  if (filters?.purpose) {
    result = result.filter((v) => v.visit_purpose === filters.purpose)
  }

  return result.sort((a, b) => b.visit_date.localeCompare(a.visit_date))
}

/** Logs a new site visit. Auto-generates id and created_at. */
export async function logSiteVisit(data: NewSiteVisitData): Promise<SiteVisit> {
  const now = new Date().toISOString()
  const visit: SiteVisit = {
    id: MOCK_SITE_VISITS.length + 1,
    ...data,
    created_at: now,
  }
  MOCK_SITE_VISITS.push(visit)
  return visit
}
```

- [ ] **Step 3: Commit**

```bash
git add hortisort-monitor/src/services/siteVisitService.ts hortisort-monitor/src/services/__tests__/siteVisitService.test.ts
git commit -m "feat: add getAllSiteVisits with filters and logSiteVisit mutation"
```

---

### Task 5: Create `task.md` at repo root

**Files:**
- Create: `task.md` (repo root: `/mnt/d/Hackathon web app/task.md`)

- [ ] **Step 1: Create task.md with Phase 2 history and Phase 3 start**

```markdown
# HortiSort Monitor — Task Log

| Date       | Phase | Task                                      | Status      |
|------------|-------|-------------------------------------------|-------------|
| 2026-03-15 | P2    | Service layer                             | done        |
| 2026-03-15 | P2    | StatsCards + MachineCard components       | done        |
| 2026-03-15 | P2    | DashboardPage                             | done        |
| 2026-03-15 | P2    | MachineDetailPage                         | done        |
| 2026-03-15 | P2    | UpdateStatusPage                          | done        |
| 2026-03-15 | P3    | Phase 3 design spec                       | done        |
| 2026-03-15 | P3    | Phase 3 new types                         | done        |
| 2026-03-15 | P3    | Extend ticketService (10 functions)       | done        |
| 2026-03-15 | P3    | Extend dailyLogService (getAllDailyLogs)  | done        |
| 2026-03-15 | P3    | Extend siteVisitService (2 functions)     | done        |
```

- [ ] **Step 2: Commit**

```bash
git add task.md
git commit -m "chore: create task.md with Phase 2 history and Phase 3 service layer progress"
```

---

## Chunk 2: Tickets — TicketCard + TicketsPage + TicketDetailPage + RaiseTicketPage

### Task 6: Build `TicketCard` component

**Files:**
- Create: `hortisort-monitor/src/components/tickets/TicketCard.tsx`
- Create: `hortisort-monitor/src/components/tickets/index.ts`

- [ ] **Step 1: Create TicketCard.tsx**

Props:
```ts
interface TicketCardProps {
  ticket: Ticket
  machineName: string
  assignedToName: string
  onClick: () => void
}
```

Card content:
- Top row: `ticket_number` (mono font, gray), severity badge (P1=red, P2=yellow, P3=yellow, P4=gray), status badge (open=red, in_progress=yellow, resolved=green, closed=gray, reopened=red)
- Title: `ticket.title` (semibold, text-sm)
- Info row: machineName, assignedToName, formatted created date
- SLA breach indicator: if status is `open`/`in_progress`/`reopened` and `(Date.now() - new Date(ticket.created_at).getTime()) > ticket.sla_hours * 3600000`, show a red "SLA Breached" badge

Use existing `Badge` component for all badges. Wrap in a `<div>` with `onClick`, `cursor-pointer`, `hover:shadow-md`, border, rounded.

- [ ] **Step 2: Create barrel index.ts**

```ts
export { TicketCard } from './TicketCard'
```

- [ ] **Step 3: Commit**

```bash
git add hortisort-monitor/src/components/tickets/
git commit -m "feat: add TicketCard component with severity, status, and SLA breach badges"
```

- [ ] **Step 4: Update task.md** — append row: `| 2026-03-15 | P3 | TicketCard component | done |`

---

### Task 7: Build `TicketsPage`

**Files:**
- Modify: `hortisort-monitor/src/pages/TicketsPage.tsx` (replace placeholder)

- [ ] **Step 1: Implement TicketsPage**

Structure:
1. `useAuth()` to get user
2. State: `tickets: Ticket[]`, `machines: Machine[]`, `isLoading`, `searchTerm`, `statusFilter`, `severityFilter`, `categoryFilter`
3. `useEffect` data fetch:
   - `admin`: `getTickets()`
   - `engineer`: `Promise.all([getTicketsByAssignedTo(user.id), getTicketsByRaisedBy(user.id)])` → merge and deduplicate by `id`
   - `customer`: `getMachinesByRole(user.role, user.id)` → extract ids → `getTicketsByMachineIds(ids)`
   - Also fetch `getMachinesByRole(user.role, user.id)` for machine name lookup
4. Client-side filtering: search matches `title` or `ticket_number`; status/severity/category dropdowns
5. Header: "Tickets" + `<Button>` "Raise Ticket" linking to `/tickets/new` (visible to engineer + admin only, using `<Link>`)
6. Filters row: `<Input>` for search, `<Select>` for status (all TicketStatus values + "All"), `<Select>` for severity (all TicketSeverity values + "All"), `<Select>` for category (all TicketCategory values + "All")
7. Results: map filtered tickets to `<TicketCard>` list; `onClick` navigates to `/tickets/${ticket.id}`
8. Empty state: "No tickets found."
9. Loading spinner (same pattern as DashboardPage)

Use `getUserName` from `utils/userLookup` for assignedToName. Build a `machineNameMap: Record<number, string>` from the fetched machines array.

- [ ] **Step 2: Commit**

```bash
git add hortisort-monitor/src/pages/TicketsPage.tsx
git commit -m "feat: build TicketsPage with role-scoped list, search, and status/severity/category filters"
```

- [ ] **Step 3: Update task.md** — append row: `| 2026-03-15 | P3 | TicketsPage | done |`

---

### Task 8: Build `TicketDetailPage`

**Files:**
- Create: `hortisort-monitor/src/pages/TicketDetailPage.tsx`
- Modify: `hortisort-monitor/src/routes/AppRoutes.tsx` (add route)

- [ ] **Step 1: Implement TicketDetailPage**

Structure:
1. `useParams<{ id: string }>()` + `useNavigate()` + `useAuth()`
2. State: `ticket`, `machine`, `comments`, `isLoading`, `notFound`, `newComment`, `isSubmittingComment`, `statusUpdateStatus`, `statusUpdateResolution`, `isUpdatingStatus`, `showToast`, `toastMessage`
3. `useEffect` fetch: parse id, `Promise.all([getTicketById(id), ...])`. Once ticket loads, `getMachineById(ticket.machine_id)` and `getTicketComments(ticket.id)`
4. Not-found state (same pattern as MachineDetailPage)
5. Sections:
   - **Header**: Back button, ticket_number (mono), title, severity badge, status badge
   - **Info grid**: machine code/name (link to `/machines/:id`), category badge, raised by name, assigned to name, created date, SLA hours
   - **Resolution section** (only if `resolved_at`): resolved at, resolution time (formatted as hours+mins), root cause, solution, parts used, customer rating (★ repeats), customer feedback
   - **Comment thread**: each comment in a `<div>` card showing user name, relative time, message
   - **Add comment form**: `<TextArea>` + `<Button>` "Add Comment". On submit: `addTicketComment({ ticket_id, user_id: user.id, message })`, re-fetch comments, clear textarea, show toast
   - **Status update panel** (engineer + admin only): `<Select>` for new status (all TicketStatus values). If 'resolved': show `<TextArea>` root_cause, `<TextArea>` solution, `<Input>` parts_used. `<Button>` "Update Status". On submit: `updateTicketStatus(ticket.id, newStatus, resolution?)`, re-fetch ticket, show toast

- [ ] **Step 2: Add route to AppRoutes.tsx**

Add BEFORE the existing `/tickets` route — and `/tickets/new` BEFORE `/tickets/:id`:

```tsx
<Route
  path="/tickets/new"
  element={
    <ProtectedRoute allowedRoles={['engineer', 'admin']}>
      <RaiseTicketPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/tickets/:id"
  element={
    <ProtectedRoute>
      <TicketDetailPage />
    </ProtectedRoute>
  }
/>
```

Import `TicketDetailPage` and `RaiseTicketPage` at the top. `RaiseTicketPage` import can reference the file even though it doesn't exist yet — it will be created in Task 9.

- [ ] **Step 3: Commit**

```bash
git add hortisort-monitor/src/pages/TicketDetailPage.tsx hortisort-monitor/src/routes/AppRoutes.tsx
git commit -m "feat: build TicketDetailPage with comment thread, status update panel, and resolution section"
```

- [ ] **Step 4: Update task.md** — append row: `| 2026-03-15 | P3 | TicketDetailPage | done |`

---

### Task 9: Build `RaiseTicketPage`

**Files:**
- Create: `hortisort-monitor/src/pages/RaiseTicketPage.tsx`

- [ ] **Step 1: Implement RaiseTicketPage**

Structure:
1. `useNavigate()` + `useAuth()`
2. State: `machines: Machine[]`, `isLoading`, `machineId`, `severity`, `category`, `title`, `description`, `errors: Record<string, string>`, `isSubmitting`, `showToast`
3. `useEffect`: `getMachinesByRole(user.role, user.id)` to populate machine dropdown
4. Form:
   - Machine picker: `<Select>` with options from machines array
   - Severity: radio buttons (P1 Critical — 4hr SLA, P2 High — 8hr SLA, P3 Medium — 24hr SLA, P4 Low — 72hr SLA). Same radio pattern as UpdateStatusPage
   - Category: `<Select>` (hardware, software, sensor, electrical, other)
   - Title: `<Input>` required
   - Description: `<TextArea>` required
5. Validation: machine required, severity required (default P3), category required, title required, description required
6. On submit:
   - `createTicket({ machine_id, raised_by: user.id, assigned_to: 5, severity, category, title, description })`
   - Show success `<Toast>`
   - `navigate(\`/tickets/${newTicket.id}\`)` after 1.5s delay
7. Cancel button → `navigate('/tickets')`

- [ ] **Step 2: Commit**

```bash
git add hortisort-monitor/src/pages/RaiseTicketPage.tsx
git commit -m "feat: build RaiseTicketPage with machine picker, severity, category, and validation"
```

- [ ] **Step 3: Update task.md** — append row: `| 2026-03-15 | P3 | RaiseTicketPage | done |`

---

## Chunk 3: Daily Logs + Site Visits + Final Wiring

### Task 10: Build `DailyLogCard` component

**Files:**
- Create: `hortisort-monitor/src/components/logs/DailyLogCard.tsx`
- Create: `hortisort-monitor/src/components/logs/index.ts`

- [ ] **Step 1: Create DailyLogCard.tsx**

Props:
```ts
interface DailyLogCardProps {
  log: DailyLog
  machineName: string
  machineCode: string
  recordedByName: string
}
```

Card content:
- Top row: date (formatted), machineCode (mono, small), status badge (running=green, not_running=red, maintenance=yellow)
- machineName (semibold)
- Info: fruit type, tons processed (`X.X t`), shift times (`06:00 – 14:00`)
- Notes (truncated to 80 chars with `...`)
- Footer: `Recorded by: {recordedByName}`

Use existing `Badge` for status. Wrap in `bg-white rounded-lg border border-gray-200 p-4`.

- [ ] **Step 2: Create barrel index.ts**

```ts
export { DailyLogCard } from './DailyLogCard'
```

- [ ] **Step 3: Commit**

```bash
git add hortisort-monitor/src/components/logs/
git commit -m "feat: add DailyLogCard component"
```

- [ ] **Step 4: Update task.md** — append row: `| 2026-03-15 | P3 | DailyLogCard component | done |`

---

### Task 11: Build `DailyLogsPage`

**Files:**
- Modify: `hortisort-monitor/src/pages/DailyLogsPage.tsx` (replace placeholder)

- [ ] **Step 1: Implement DailyLogsPage**

Structure:
1. `useAuth()` to get user
2. State: `logs: DailyLog[]`, `machines: Machine[]`, `isLoading`, `machineFilter`, `dateFilter`, `statusFilter`
3. `useEffect` data fetch:
   - `getMachinesByRole(user.role, user.id)` for machine list
   - Role scoping for logs:
     - `admin`: `getAllDailyLogs()` (no filter)
     - `customer`: `getAllDailyLogs()` then filter to machine ids from `getMachinesByRole`
     - `engineer`: `getAllDailyLogs()` then filter `updated_by === user.id`
   - Apply machineFilter/dateFilter/statusFilter client-side
4. Header: "Daily Logs" (no create button — creation is UpdateStatusPage)
5. Filters row: machine `<Select>` (options from role-scoped machines + "All"), date `<Input type="date">`, status `<Select>` (running/not_running/maintenance + "All")
6. Results: `<DailyLogCard>` list, already sorted by date descending from service
7. Empty state: "No logs found."
8. Loading spinner

Build `machineNameMap` and `machineCodeMap` from the machines array for card props. Use `getUserName` for recordedByName.

- [ ] **Step 2: Commit**

```bash
git add hortisort-monitor/src/pages/DailyLogsPage.tsx
git commit -m "feat: build DailyLogsPage with machine/date/status filters and role scoping"
```

- [ ] **Step 3: Update task.md** — append row: `| 2026-03-15 | P3 | DailyLogsPage | done |`

---

### Task 12: Build `SiteVisitCard` component

**Files:**
- Create: `hortisort-monitor/src/components/visits/SiteVisitCard.tsx`
- Create: `hortisort-monitor/src/components/visits/index.ts`

- [ ] **Step 1: Create SiteVisitCard.tsx**

Props:
```ts
interface SiteVisitCardProps {
  visit: SiteVisit
  machineName: string
  machineCode: string
  engineerName: string
}
```

Card content:
- Top row: formatted visit_date, purpose badge (routine=green, ticket=yellow, installation=blue, training=purple)
- machineCode (mono) + machineName
- Engineer name (admin view text)
- Findings (truncated 80 chars)
- Actions taken (truncated 80 chars)
- If parts_replaced: "Parts: {parts_replaced}"
- If next_visit_due: "Next visit: {formatted date}"

Use `Badge` for purpose. Wrap in `bg-white rounded-lg border border-gray-200 p-4`.

- [ ] **Step 2: Create barrel index.ts**

```ts
export { SiteVisitCard } from './SiteVisitCard'
```

- [ ] **Step 3: Commit**

```bash
git add hortisort-monitor/src/components/visits/
git commit -m "feat: add SiteVisitCard component"
```

- [ ] **Step 4: Update task.md** — append row: `| 2026-03-15 | P3 | SiteVisitCard component | done |`

---

### Task 13: Build `SiteVisitsPage`

**Files:**
- Modify: `hortisort-monitor/src/pages/SiteVisitsPage.tsx` (replace placeholder)

- [ ] **Step 1: Implement SiteVisitsPage**

Structure:
1. `useAuth()` to get user
2. State: `visits: SiteVisit[]`, `machines: Machine[]`, `isLoading`, `machineFilter`, `purposeFilter`, `engineerFilter` (admin only)
3. `useEffect` data fetch:
   - `getMachinesByRole(user.role, user.id)` for machine dropdown
   - Role scoping:
     - `engineer`: `getAllSiteVisits({ engineerId: user.id })`
     - `admin`: `getAllSiteVisits()` (no filter)
   - Apply machineFilter/purposeFilter/engineerFilter client-side
4. Header: "Site Visits" + `<Button>` "Log Visit" linking to `/visits/new` (using `<Link>`)
5. Filters row: machine `<Select>`, purpose `<Select>` (routine/ticket/installation/training + "All"), engineer `<Select>` (admin only — list all engineers from `MOCK_USERS` where `role === 'engineer'`)
6. Results: `<SiteVisitCard>` list
7. Empty state: "No site visits found."
8. Loading spinner

Use `getUserName` for engineer names. Build machine maps from fetched machines.

- [ ] **Step 2: Commit**

```bash
git add hortisort-monitor/src/pages/SiteVisitsPage.tsx
git commit -m "feat: build SiteVisitsPage with filters and role scoping"
```

- [ ] **Step 3: Update task.md** — append row: `| 2026-03-15 | P3 | SiteVisitsPage | done |`

---

### Task 14: Build `LogVisitPage`

**Files:**
- Create: `hortisort-monitor/src/pages/LogVisitPage.tsx`
- Modify: `hortisort-monitor/src/routes/AppRoutes.tsx` (add route)

- [ ] **Step 1: Implement LogVisitPage**

Structure:
1. `useNavigate()` + `useAuth()`
2. State: `machines: Machine[]`, `openTickets: Ticket[]`, `isLoading`, form fields: `machineId`, `visitDate` (default today), `purpose`, `ticketId`, `findings`, `actionsTaken`, `partsReplaced`, `nextVisitDue`, `errors: Record<string, string>`, `isSubmitting`, `showToast`
3. `useEffect` fetch: `getMachinesByRole(user.role, user.id)` for machine dropdown
4. When `machineId` changes: fetch `getTicketsByMachineId(machineId)` filtered to open/in_progress/reopened for the linked ticket dropdown
5. Form:
   - Machine: `<Select>` required
   - Visit date: `<Input type="date">` required, default `new Date().toISOString().slice(0, 10)`
   - Purpose: `<Select>` (routine, ticket, installation, training) required
   - Linked ticket: `<Select>` optional — only shown when purpose is 'ticket', populated with open tickets for selected machine
   - Findings: `<TextArea>` required
   - Actions taken: `<TextArea>` required
   - Parts replaced: `<Input>` optional
   - Next visit due: `<Input type="date">` optional
6. Validation: machine required, visit date required, purpose required, findings required, actions taken required
7. On submit:
   - `logSiteVisit({ machine_id: machineId, engineer_id: user.id, visit_date: visitDate, visit_purpose: purpose, ticket_id: ticketId || undefined, findings, actions_taken: actionsTaken, parts_replaced: partsReplaced || undefined, next_visit_due: nextVisitDue || undefined })`
   - Show success `<Toast>`
   - `navigate('/visits')` after 1.5s
8. Cancel button → `navigate('/visits')`

- [ ] **Step 2: Add route to AppRoutes.tsx**

```tsx
<Route
  path="/visits/new"
  element={
    <ProtectedRoute allowedRoles={['engineer', 'admin']}>
      <LogVisitPage />
    </ProtectedRoute>
  }
/>
```

Place before the existing `/visits` route. Add import for `LogVisitPage`.

- [ ] **Step 3: Commit**

```bash
git add hortisort-monitor/src/pages/LogVisitPage.tsx hortisort-monitor/src/routes/AppRoutes.tsx
git commit -m "feat: build LogVisitPage with machine picker, ticket linking, and validation"
```

- [ ] **Step 4: Update task.md** — append row: `| 2026-03-15 | P3 | LogVisitPage | done |`

---

### Task 15: Final task.md update

**Files:**
- Modify: `task.md`

- [ ] **Step 1: Append Phase 3 complete row**

```markdown
| 2026-03-15 | P3    | Phase 3 complete                          | done        |
```

- [ ] **Step 2: Commit**

```bash
git add task.md
git commit -m "chore: Phase 3 complete — all Tickets, Daily Logs, and Site Visits pages built"
```
