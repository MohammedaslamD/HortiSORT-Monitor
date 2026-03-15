# task.md — Task Progress Log

## Phase 1: Frontend Foundation

### Status: COMPLETE

All Phase 1 tasks are done. The app has:
- Full auth flow (login/logout with mock data)
- Role-based routing (customer, engineer, admin)
- Responsive layout (sidebar + bottom nav)
- 8 reusable UI components
- 32 passing tests across 4 test suites
- Clean TypeScript compilation
- Production build passing

---

## Phase 2: Dashboard + Machine Management

### Status: COMPLETE

All Phase 2 tasks are done. The app now has:
- Full service layer: 6 services (machine, ticket, dailyLog, siteVisit, machineHistory, auth) with 47 passing tests
- Dashboard page with stats cards, search/filter bar, and responsive machine card grid
- Machine detail page with info header, today's production, 4 tabbed sections, and role-based actions
- Update status form with radio buttons, dropdown, time inputs, validation, and mock submit
- Role-based data filtering (customer sees own, engineer sees assigned, admin sees all)
- Role-based route guards (update-status restricted to engineer + admin)
- Clean TypeScript compilation (zero errors)
- All 47 service tests passing

### Completed Tasks

#### 2a. AGENTS.md rewrite
- Rewrote AGENTS.md from 222 to 173 lines
- Added project identity, exact versions, full src/ structure
- Added observed code patterns, TypeScript/Vitest/ESLint config details

#### 2b. Service layer (complete)
- `machineService.ts` — `getMachines(filters)`, `getMachineById(id)`, `getMachineStats(machines)`, `getMachinesByRole(role, userId)` with status/model/city/search filters (15 tests)
- `ticketService.ts` — `getTickets()`, `getTicketsByMachineId(id)`, `getOpenTicketCount()`, `getRecentTickets(limit)` (6 tests)
- `dailyLogService.ts` — `getDailyLogs()`, `getDailyLogsByMachineId(id)`, `getRecentDailyLogs(limit)` (5 tests)
- `siteVisitService.ts` — `getSiteVisitsByMachineId(id)` (4 tests)
- `machineHistoryService.ts` — `getHistoryByMachineId(id)` (4 tests)
- `authService.ts` — login/logout/getCurrentUser/isAuthenticated (13 tests)

#### 2c. Utility layer
- `formatters.ts` — `formatRelativeTime()`, `getStatusBadgeColor()`, `getSeverityBadgeColor()`
- `userLookup.ts` — `getUserById()`, `getUserName()`

#### 2d. Dashboard components
- `StatsCards.tsx` — 6 stat cards (Total, Running, Idle, Down, Offline, Open Tickets) in responsive grid
- `MachineCard.tsx` — Machine summary card with status badge, today's log, ticket count, role-based action buttons

#### 2e. DashboardPage (full implementation)
- StatsCards row + search bar + status filter dropdown + MachineCard grid
- Fetches machines via `getMachinesByRole`, tickets, daily logs
- Client-side search (machine code, name, city, state) and status filtering
- Loading, error, and empty states

#### 2f. MachineDetailPage (full implementation)
- Machine info header: code, name, model, serial, status badge, customer/engineer names, location, installation date, last updated
- Today's Production section with daily log data or empty state
- 4 tabbed sections: Production History (table), Tickets (cards with severity/status badges), Site Visits (cards), Machine History (timeline)
- Role-based "Update Status" button for engineer/admin
- Invalid machine ID error state with "Back to Dashboard" link
- Loading spinner

#### 2g. UpdateStatusPage (full implementation)
- Form with DailyLogStatus radio buttons, fruit type dropdown (12 options), tons processed, shift start/end time inputs, notes textarea
- Machine info header with current status badge
- Full validation: required fields, tons >= 0, shift end > start
- Mock submit with loading state, success toast, redirect to machine detail
- Cancel button, error state for invalid machine ID

#### 2h. Route updates
- `/machines/:id` — any authenticated user
- `/machines/:id/update-status` — engineer + admin only (role guard)

---

## Phase 3: Tickets, Daily Logs & Site Visits

### Status: COMPLETE

| Date       | Task                                      | Status      |
|------------|-------------------------------------------|-------------|
| 2026-03-15 | Phase 3 design spec                       | done        |
| 2026-03-15 | Phase 3 new types                         | done        |
| 2026-03-15 | Extend ticketService (10 functions)       | done        |
| 2026-03-15 | Extend dailyLogService (getAllDailyLogs)  | done        |
| 2026-03-15 | Extend siteVisitService (2 functions)     | done        |
| 2026-03-15 | TicketCard component                      | done        |
| 2026-03-15 | TicketsPage                               | done        |
| 2026-03-15 | TicketDetailPage                          | done        |
| 2026-03-15 | RaiseTicketPage                           | done        |
| 2026-03-15 | DailyLogCard component                    | done        |
| 2026-03-15 | DailyLogsPage                             | done        |
| 2026-03-15 | SiteVisitCard component                   | done        |
| 2026-03-15 | SiteVisitsPage                            | done        |
| 2026-03-15 | LogVisitPage                              | done        |
| 2026-03-15 | Phase 3 complete                          | done        |

---

## Phase 4: MachinesPage + AdminPage

### Status: IN PROGRESS

| Date       | Task                                      | Status      |
|------------|-------------------------------------------|-------------|
| 2026-03-15 | Phase 4 design spec                       | done        |
| 2026-03-15 | Phase 4 implementation plan               | done        |
| 2026-03-15 | userService (3 functions + tests)         | done        |
| 2026-03-15 | activityLogService (1 function + tests)   | done        |

---

### File Structure Summary

```
hortisort-monitor/src/
├── App.tsx                          -- Wired with AuthProvider + Router + PageLayout
├── main.tsx                         -- Entry point
├── index.css                        -- Tailwind + slide-in animation
├── types/index.ts                   -- 8 table interfaces + 5 Phase 3 interfaces + 9 union types + MachineFilters + MachineStats
├── data/mockData.ts                 -- 12 machines, 6 users, 15 logs, 10 tickets, 15 comments, 6 visits, 10 history, 10 activity
├── utils/
│   ├── formatters.ts                -- formatRelativeTime, getStatusBadgeColor, getSeverityBadgeColor
│   └── userLookup.ts                -- getUserById, getUserName
├── services/
│   ├── authService.ts               -- login/logout/getCurrentUser/isAuthenticated
│   ├── machineService.ts            -- getMachines, getMachineById, getMachineStats, getMachinesByRole
│   ├── dailyLogService.ts           -- getDailyLogs, byMachineId, getRecent, getAllDailyLogs, addDailyLog
│   ├── ticketService.ts             -- 14 functions (CRUD, queries, status updates, comments)
│   ├── siteVisitService.ts          -- getSiteVisitsByMachineId, getAllSiteVisits, logSiteVisit
│   ├── machineHistoryService.ts     -- getHistoryByMachineId
│   └── __tests__/
│       ├── authService.test.ts      -- 13 tests
│       ├── machineService.test.ts   -- 15 tests
│       ├── dailyLogService.test.ts  -- 5+ tests
│       ├── ticketService.test.ts    -- 6+ tests
│       ├── siteVisitService.test.ts -- 4+ tests
│       └── machineHistoryService.test.ts -- 4 tests
├── context/
│   ├── AuthContext.tsx               -- AuthProvider + useAuth
│   └── __tests__/AuthContext.test.tsx -- 6 tests
├── components/
│   ├── common/
│   │   ├── index.ts                 -- Barrel export (8 components)
│   │   ├── Button.tsx, Badge.tsx, Card.tsx, Input.tsx, Select.tsx, TextArea.tsx, Modal.tsx, Toast.tsx
│   │   └── __tests__/              -- Component tests
│   ├── dashboard/
│   │   ├── index.ts                 -- Barrel export
│   │   └── StatsCards.tsx           -- 6 stat cards in responsive grid
│   ├── machines/
│   │   ├── index.ts                 -- Barrel export
│   │   └── MachineCard.tsx          -- Machine summary card with role-based actions
│   ├── tickets/
│   │   ├── index.ts                 -- Barrel export
│   │   └── TicketCard.tsx           -- Ticket summary card (Phase 3)
│   ├── logs/
│   │   ├── index.ts                 -- Barrel export
│   │   └── DailyLogCard.tsx         -- Daily log card (Phase 3)
│   ├── visits/
│   │   ├── index.ts                 -- Barrel export
│   │   └── SiteVisitCard.tsx        -- Site visit card (Phase 3)
│   └── layout/
│       ├── index.ts, Navbar.tsx, Sidebar.tsx, BottomNav.tsx, PageLayout.tsx
├── pages/
│   ├── LoginPage.tsx                -- Complete auth form
│   ├── DashboardPage.tsx            -- Stats + filters + machine grid (Phase 2)
│   ├── MachineDetailPage.tsx        -- Full detail with tabs (Phase 2)
│   ├── UpdateStatusPage.tsx         -- Daily log form (Phase 2)
│   ├── MachinesPage.tsx             -- Placeholder (Phase 4+)
│   ├── TicketsPage.tsx              -- Ticket list with filters + role scoping (Phase 3)
│   ├── TicketDetailPage.tsx         -- Ticket detail + comments + status actions (Phase 3)
│   ├── RaiseTicketPage.tsx          -- Raise ticket form (Phase 3)
│   ├── DailyLogsPage.tsx            -- Daily log list with filters + role scoping (Phase 3)
│   ├── SiteVisitsPage.tsx           -- Site visit list with filters + role scoping (Phase 3)
│   ├── LogVisitPage.tsx             -- Log site visit form (Phase 3)
│   ├── AdminPage.tsx                -- Placeholder (Phase 4)
│   └── __tests__/LoginPage.test.tsx -- 7 tests
├── routes/
│   ├── AppRoutes.tsx                -- All routes including /visits/new, /tickets/new, /tickets/:id
│   ├── ProtectedRoute.tsx           -- Role-based route guard
│   └── __tests__/ProtectedRoute.test.tsx -- 6 tests
└── test/
    ├── setup.ts
    └── utils.tsx
```
