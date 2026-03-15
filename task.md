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

### Status: COMPLETE

| Date       | Task                                      | Status      |
|------------|-------------------------------------------|-------------|
| 2026-03-15 | Phase 4 design spec                       | done        |
| 2026-03-15 | Phase 4 implementation plan               | done        |
| 2026-03-15 | userService (3 functions + tests)         | done        |
| 2026-03-15 | activityLogService (1 function + tests)   | done        |
| 2026-03-15 | MachinesPage (filters + MachineCard grid) | done        |
| 2026-03-15 | Admin components (3 components + barrel) | done        |
| 2026-03-15 | AdminPage (stats + activity + users)      | done        |
| 2026-03-15 | Phase 4 complete                          | done        |

---

## Phase 5: Backend & Database

### Status: IN PROGRESS — Chunk 3 complete

| Date       | Task                                                        | Status      |
|------------|-------------------------------------------------------------|-------------|
| 2026-03-15 | Phase 5 design spec                                         | done        |
| 2026-03-15 | Phase 5 implementation plan (41 tasks)                      | done        |
| 2026-03-15 | T1: docker-compose.yml + init-test-db.sql + .gitignore      | done        |
| 2026-03-15 | T2: server/package.json + tsconfig + .env.example           | done        |
| 2026-03-15 | T3: server/prisma/schema.prisma (9 enums, 8 models)         | done        |
| 2026-03-15 | T4: server/prisma/seed.ts (all mock data → Prisma inserts)  | done        |
| 2026-03-15 | T5: prisma singleton + AppError + env config (Zod)          | done        |
| 2026-03-15 | T6: JWT utilities (sign/verify access + refresh tokens)     | done        |
| 2026-03-15 | T7: Express app + auth/validate/errorHandler middleware      | done        |
| 2026-03-15 | T8: Zod schemas for auth endpoints                          | done        |
| 2026-03-15 | T9: server authService (login, getUserById, refreshToken)   | done        |
| 2026-03-15 | T10: auth routes (login, logout, me, refresh)               | done        |
| 2026-03-15 | T11: server vitest config + .env.test + auth integration tests | done     |
| 2026-03-15 | T12: frontend apiClient.ts (JWT token store + fetch wrapper) | done       |
| 2026-03-15 | T13: Vite proxy /api → localhost:4000                       | done        |
| 2026-03-15 | T14: frontend authService.ts → real API (login/logout/restoreSession) | done |
| 2026-03-15 | T15: AuthContext → async restoreSession on mount, isLoading:true default | done |
| 2026-03-15 | T16: ProtectedRoute + PublicRoute → loading spinner, async-safe guards | done |
| 2026-03-15 | T18: server/src/schemas/machines.ts (machineQuerySchema, updateMachineStatusSchema) | done |
| 2026-03-15 | T19: server/src/services/machineService.ts (getMachines, getMachineById, getMachineStats, updateMachineStatus) | done |
| 2026-03-15 | T20: server/src/routes/machines.ts (4 routes) + mounted in app.ts | done |
| 2026-03-15 | T21: server/src/schemas/dailyLogs.ts (dailyLogQuerySchema, createDailyLogSchema) | done |
| 2026-03-15 | T22: server/src/services/dailyLogService.ts (getDailyLogs, createDailyLog) | done |
| 2026-03-15 | T23: server/src/routes/dailyLogs.ts (GET + POST) + mounted in app.ts | done |
| 2026-03-15 | T24: server integration tests — machines (11) + dailyLogs (6) | done |
| 2026-03-15 | T25: frontend machineService.ts → real API; tests rewritten (mock apiClient) | done |
| 2026-03-15 | T26: frontend dailyLogService.ts → real API; tests rewritten (mock apiClient) | done |
| 2026-03-15 | T28: server/src/schemas/tickets.ts (5 Zod schemas)          | done        |
| 2026-03-15 | T29: server/src/services/ticketService.ts (7 functions, role-scoped) | done |
| 2026-03-15 | T30: server/src/routes/tickets.ts (6 routes) + ticketComments.ts + mounted in app.ts | done |
| 2026-03-15 | T31: server integration tests — tickets (11 tests)          | done        |
| 2026-03-15 | T32: frontend ticketService.ts → real API; tests rewritten (mock apiClient) | done |

**Deferred (run from Windows Terminal when Docker is ready):**
- `docker compose up -d`
- `cd server && npx prisma generate`
- `cd server && npx prisma migrate dev --name init`
- `cd server && npx prisma db seed`
- `cd server && npm run test:run`

**Plan:** `docs/superpowers/plans/2026-03-15-phase5-backend-database-plan.md`
**Spec:** `docs/superpowers/specs/2026-03-15-phase5-backend-database-design.md`

### What Phase 5 builds

Replaces all in-memory mock data with a real Express.js + Prisma + PostgreSQL backend.

| Chunk | Tasks | Scope |
|-------|-------|-------|
| 1 | 1–17  | Docker, server scaffold, Prisma schema + seed, JWT, Express app + middleware, auth routes + tests, frontend apiClient + Vite proxy + authService/AuthContext/route guards |
| 2 | 18–27 | Machines + daily logs — server services, routes, tests, frontend service swaps |
| 3 | 28–33 | Tickets + comments — server services, routes (tickets.ts + ticketComments.ts), tests, frontend service swap |
| 4 | 34–41 | Site visits, machine history, activity log, users — server services, routes, tests, frontend service swaps + E2E verification |

---

### File Structure Summary

#### server/ (Phase 5 — Chunk 1 complete)

```
server/
├── package.json                     -- Express/Prisma/JWT deps, tsx dev, vitest tests
├── tsconfig.json                    -- ES2022, NodeNext, strict
├── .env.example                     -- DATABASE_URL, JWT_SECRET, PORT, NODE_ENV
├── .env.test                        -- points to hortisort_test DB, JWT_SECRET min 8 chars
├── vitest.config.ts                 -- globals, node env, forks pool, --env-file .env.test
├── prisma/
│   ├── schema.prisma                -- 9 enums + 8 models (@@map snake_case) + all relations
│   └── seed.ts                      -- createMany from mockData in FK order, resets sequences
└── src/
    ├── app.ts                       -- Express app: CORS, JSON, cookieParser, routes, errorHandler
    ├── index.ts                     -- listens on env.PORT
    ├── config/env.ts                -- Zod-validated env (DATABASE_URL, JWT_SECRET, PORT, NODE_ENV)
    ├── middleware/
    │   ├── auth.ts                  -- authenticate (Bearer JWT) + requireRole(...roles)
    │   ├── errorHandler.ts          -- AppError / ZodError / PrismaKnownError / unknown → JSON
    │   └── validate.ts              -- Zod validation factory (body/query/params)
    ├── routes/
    │   └── auth.ts                  -- POST login, POST logout, GET me, POST refresh
    ├── schemas/
    │   └── auth.ts                  -- loginSchema (email + password)
    ├── services/
    │   └── authService.ts           -- login (bcrypt), getUserById, refreshAccessToken
    ├── utils/
    │   ├── AppError.ts              -- operational error with statusCode
    │   ├── jwt.ts                   -- signAccessToken(15m) / signRefreshToken(7d) / verify both
    │   └── prisma.ts                -- PrismaClient singleton
    └── __tests__/
        ├── setup.ts                 -- globalSetup: loads .env.test, runs prisma migrate deploy
        ├── helpers.ts               -- truncateAll() + prisma export
        └── auth.test.ts             -- 7 integration tests (supertest)
```

#### hortisort-monitor/src/ (Phases 1–5 Chunk 1)

```
hortisort-monitor/src/
├── App.tsx                          -- AuthProvider + Router + PageLayout
├── main.tsx                         -- entry point
├── index.css                        -- Tailwind + slide-in animation
├── types/index.ts                   -- 8 table interfaces + 5 Phase 3 interfaces + 9 union types
├── data/mockData.ts                 -- reference seed data (still used by server/prisma/seed.ts)
├── utils/
│   ├── formatters.ts                -- formatRelativeTime, getStatusBadgeColor, getSeverityBadgeColor
│   └── userLookup.ts                -- getUserById, getUserName
├── services/
│   ├── apiClient.ts                 -- JWT token store + fetch wrapper + 401→refresh→retry interceptor
│   ├── authService.ts               -- login/logout/restoreSession/getCurrentUser/isAuthenticated (→ real API)
│   ├── machineService.ts            -- getMachines, getMachineById, getMachineStats, getMachinesByRole (mock)
│   ├── dailyLogService.ts           -- getDailyLogs, byMachineId, getRecent, getAllDailyLogs, addDailyLog (mock)
│   ├── ticketService.ts             -- 14 functions: CRUD, queries, status updates, comments (mock)
│   ├── siteVisitService.ts          -- getSiteVisitsByMachineId, getAllSiteVisits, logSiteVisit (mock)
│   ├── machineHistoryService.ts     -- getHistoryByMachineId (mock)
│   ├── userService.ts               -- getUsers, getUserById, toggleUserActive (mock)
│   ├── activityLogService.ts        -- getRecentActivity (mock)
│   └── __tests__/
│       ├── authService.test.ts      -- 15 tests (mock apiClient)
│       ├── machineService.test.ts   -- 15 tests
│       ├── dailyLogService.test.ts  -- 5+ tests
│       ├── ticketService.test.ts    -- 21 tests
│       ├── siteVisitService.test.ts -- 4+ tests
│       └── machineHistoryService.test.ts -- 4 tests
├── context/
│   ├── AuthContext.tsx               -- async restoreSession on mount, isLoading:true default
│   └── __tests__/AuthContext.test.tsx -- 6 tests (mock authService)
├── components/
│   ├── common/    Button, Badge, Card, Input, Select, TextArea, Modal, Toast + barrel
│   ├── dashboard/ StatsCards
│   ├── machines/  MachineCard
│   ├── tickets/   TicketCard
│   ├── logs/      DailyLogCard
│   ├── visits/    SiteVisitCard
│   └── layout/    Navbar, Sidebar, BottomNav, PageLayout + barrel
├── pages/
│   ├── LoginPage.tsx, DashboardPage.tsx, MachineDetailPage.tsx, UpdateStatusPage.tsx
│   ├── MachinesPage.tsx, TicketsPage.tsx, TicketDetailPage.tsx, RaiseTicketPage.tsx
│   ├── DailyLogsPage.tsx, SiteVisitsPage.tsx, LogVisitPage.tsx, AdminPage.tsx
│   └── __tests__/LoginPage.test.tsx -- 7 tests (mock authService)
├── routes/
│   ├── AppRoutes.tsx                -- all routes
│   ├── ProtectedRoute.tsx           -- spinner while isLoading, redirect after restore
│   ├── PublicRoute.tsx              -- spinner while isLoading, redirect if authenticated
│   └── __tests__/ProtectedRoute.test.tsx -- 7 tests (mock authService)
└── test/
    ├── setup.ts
    └── utils.tsx
```
