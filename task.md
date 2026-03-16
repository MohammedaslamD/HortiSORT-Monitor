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

### Status: COMPLETE — all 4 chunks done

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
| 2026-03-15 | T33: commit Chunk 3                                         | done        |
| 2026-03-15 | T34: server/src/schemas/siteVisits.ts + users.ts            | done        |
| 2026-03-15 | T35: server siteVisitService.ts + routes/siteVisits.ts + mounted | done   |
| 2026-03-15 | T36: server machineHistoryService.ts + routes/machineHistory.ts + mounted | done |
| 2026-03-15 | T37: server activityLogService.ts + routes/activityLog.ts + mounted | done |
| 2026-03-15 | T38: server userService.ts + routes/users.ts + mounted      | done        |
| 2026-03-15 | T39: server integration tests — siteVisits (6) + machineHistory (3) + activityLog (4) + users (7) | done |
| 2026-03-15 | T40: frontend siteVisitService, machineHistoryService, activityLogService, userService → real API; all tests rewritten | done |
| 2026-03-15 | T41: task.md final update + Chunk 4 commit                  | done        |

**Plan:** `docs/superpowers/plans/2026-03-15-phase5-backend-database-plan.md`
**Spec:** `docs/superpowers/specs/2026-03-15-phase5-backend-database-design.md`

---

## Phase 5 Post-Implementation: Environment & Test Fixes

### Status: IN PROGRESS — server tests still failing

| Date       | Task                                                                 | Status      |
|------------|----------------------------------------------------------------------|-------------|
| 2026-03-16 | PostgreSQL local install: user `hortisort`, DB `hortisort_dev` created | done      |
| 2026-03-16 | `ALTER USER hortisort CREATEDB` (required for Prisma shadow DB)      | done        |
| 2026-03-16 | Migration `20260316043641_init` run successfully on `hortisort_dev`  | done        |
| 2026-03-16 | `prisma db seed` run successfully on `hortisort_dev`                 | done        |
| 2026-03-16 | `hortisort_test` DB created; `prisma migrate deploy` run against it  | done        |
| 2026-03-16 | `vitest.config.ts` — added `envFile: '.env.test'`, `pool: 'forks'`  | done        |
| 2026-03-16 | `server/package.json` `test:run` — removed `--env-file` flag        | done        |
| 2026-03-16 | `vite.config.ts` (frontend) — added `pool: 'forks'`, `singleFork: true` | done   |
| 2026-03-16 | Frontend bug fix: `authService.logout` swallowed error in `try/finally` | done    |
| 2026-03-16 | Frontend bug fix: `dailyLogService.getRecentDailyLogs` unencoded `:` in URL sort param | done |
| 2026-03-16 | Frontend tests: 92/92 passing ✅                                     | done        |
| 2026-03-16 | Root cause identified: PrismaClient singleton reads `DATABASE_URL` before `.env.test` loads in test worker forks | done |
| 2026-03-16 | Fix: `src/__tests__/envSetup.ts` — new `setupFiles` entry that calls `dotenv.config(.env.test, override:true)` before any import | done |
| 2026-03-16 | Fix: `vitest.config.ts` — added `setupFiles: ['./src/__tests__/envSetup.ts']` | done |
| 2026-03-16 | Fix: `src/utils/prisma.ts` — pass `datasources: { db: { url: process.env.DATABASE_URL } }` to PrismaClient constructor | done |
| 2026-03-16 | Fix: `src/__tests__/helpers.ts` — same `datasourceUrl` fix for test prisma client | done |
| 2026-03-16 | Verify server tests pass (awaiting Windows Terminal run)             | **PENDING** |
| 2026-03-16 | Start backend server (`npm run dev` in `server/`)                   | pending     |
| 2026-03-16 | Start frontend server (`npm run dev` in `hortisort-monitor/`)        | pending     |
| 2026-03-16 | Live demo / smoke test                                               | pending     |

### Root Cause Detail

`PrismaClient` is instantiated at module load time. With Vitest `pool: 'forks'`, each test file runs in a separate Node.js process. The `envFile: '.env.test'` config loads env vars for the worker — but only **after** module imports run. When the test file does `import { app } from '../app.ts'`, the `app.ts` import chain loads `src/utils/prisma.ts`, which creates the `PrismaClient` singleton using whatever `DATABASE_URL` was in env at that moment (the production `.env`, pointing to `hortisort_dev`).

Result: `truncateAll()` in `helpers.ts` truncates `hortisort_dev`, while the test HTTP requests (via `app`) also hit `hortisort_dev` — but the `helpers.ts` `prisma` client (also pointing to `hortisort_dev`) sees rows that were never cleared because `RESTART IDENTITY CASCADE` doesn't remove rows inserted by previous tests. Duplicate email constraint on second `beforeEach`.

### Fix Applied

1. `src/__tests__/envSetup.ts` — new file, registered as `setupFiles` in vitest config. Calls `dotenv.config({ path: '.env.test', override: true })` synchronously before any test module is imported in the worker fork.
2. `src/utils/prisma.ts` — `new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } })` so even if loaded slightly early it reads from env at call time.
3. `src/__tests__/helpers.ts` — same defensive fix for the test-side `PrismaClient`.

### What Phase 5 builds

Replaces all in-memory mock data with a real Express.js + Prisma + PostgreSQL backend.

| Chunk | Tasks | Scope |
|-------|-------|-------|
| 1 | 1–17  | Docker, server scaffold, Prisma schema + seed, JWT, Express app + middleware, auth routes + tests, frontend apiClient + Vite proxy + authService/AuthContext/route guards |
| 2 | 18–27 | Machines + daily logs — server services, routes, tests, frontend service swaps |
| 3 | 28–33 | Tickets + comments — server services, routes (tickets.ts + ticketComments.ts), tests, frontend service swap |
| 4 | 34–41 | Site visits, machine history, activity log, users — server services, routes, tests, frontend service swaps |

---

## Phase 5 Post-Implementation: Bug Fixes (2026-03-16 session 2)

### Status: IN PROGRESS

| Date       | Task                                                                 | Status      |
|------------|----------------------------------------------------------------------|-------------|
| 2026-03-16 | Fix: CORS origin regex — was `localhost:3000` only, now allows any `localhost:<port>` | done |
| 2026-03-16 | Fix: `sameSite: 'strict'` → `'lax'` on refresh token cookie so Chrome accepts it | done |
| 2026-03-16 | Fix: `UpdateStatusPage` was using fake `setTimeout` mock submit — now calls `addDailyLog` + `updateMachineStatus` real API | done |
| 2026-03-16 | Fix: Engineer ticket scoping — backend `roleWhere` was `assigned_to` only; now `OR [assigned_to, raised_by]` | done |
| 2026-03-16 | Fix: Engineer ticket stats — same `OR` fix applied in `getTicketStats` | done |
| 2026-03-16 | Fix: `TicketsPage` was making extra `?assignedTo` / `?raisedBy` API calls that double-filtered against server `roleWhere`, returning empty results | done |
| 2026-03-16 | Simplify: `TicketsPage` now calls `getTickets()` once for all roles; server handles scoping | done |
| 2026-03-16 | Fix: seed.ts — add truncateAll() before createMany so reseed clears old data | done |
| 2026-03-16 | Fix: machines 8–12 customer_id changed to 5 (admin-owned, not Sunita) | done |
| 2026-03-16 | Add: new customer Vikram Mehta (id=7) + machine 8 assigned to him | done |
| 2026-03-16 | Reseed database (truncate + fresh insert) | done |
| 2026-03-16 | Verify customer machine counts in browser — Rajesh=2, Sunita=2, Vikram=1 | done ✅ |

### Root Causes Fixed

**Engineer/Customer seeing wrong or empty tickets:**
- The frontend `TicketsPage` was doing role-specific API calls: engineers called `?assignedTo=<id>` and `?raisedBy=<id>` as separate requests, then merged client-side. But the backend *also* applies `roleWhere` (server-side JWT scope). Stacking `?assignedTo=3` on top of `roleWhere = { assigned_to: 3 }` was effectively AND-ing both — fine for assigned, but `?raisedBy=3 AND assigned_to=3` returned nothing since no ticket is both raised by AND assigned to the same engineer.
- Additionally, the backend engineer `roleWhere` only included `assigned_to`, not `raised_by`. Engineers who raise tickets (e.g. on behalf of others) would never see them.
- Fix: backend `roleWhere` for engineers now uses `OR [assigned_to, raised_by]`. Frontend simplified to always call `getTickets()` — server role-scoping handles everything.

---

### File Structure Summary

#### server/ (Phase 5 — all chunks complete)

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
    ├── app.ts                       -- Express app: CORS, JSON, cookieParser, all 9 routers, errorHandler
    ├── index.ts                     -- listens on env.PORT
    ├── config/env.ts                -- Zod-validated env (DATABASE_URL, JWT_SECRET, PORT, NODE_ENV)
    ├── middleware/
    │   ├── auth.ts                  -- authenticate (Bearer JWT) + requireRole(...roles)
    │   ├── errorHandler.ts          -- AppError / ZodError / PrismaKnownError / unknown → JSON
    │   └── validate.ts              -- Zod validation factory (body/query/params)
    ├── routes/
    │   ├── auth.ts                  -- POST login, POST logout, GET me, POST refresh
    │   ├── machines.ts              -- GET / , GET /:id, GET /stats, PATCH /:id/status
    │   ├── dailyLogs.ts             -- GET /, POST /
    │   ├── tickets.ts               -- GET /, GET /stats, GET /:id, POST /, PATCH /:id/status, PATCH /:id/resolve
    │   ├── ticketComments.ts        -- POST /tickets/:id/comments
    │   ├── siteVisits.ts            -- GET /, POST /
    │   ├── machineHistory.ts        -- GET /:machineId
    │   ├── activityLog.ts           -- GET / (admin only)
    │   └── users.ts                 -- GET /, GET /:id, PATCH /:id/active (admin only)
    ├── schemas/
    │   ├── auth.ts, machines.ts, dailyLogs.ts, tickets.ts, siteVisits.ts, users.ts
    ├── services/
    │   ├── authService.ts, machineService.ts, dailyLogService.ts, ticketService.ts
    │   ├── siteVisitService.ts, machineHistoryService.ts, activityLogService.ts, userService.ts
    ├── utils/
    │   ├── AppError.ts              -- operational error with statusCode
    │   ├── jwt.ts                   -- signAccessToken(15m) / signRefreshToken(7d) / verify both
    │   └── prisma.ts                -- PrismaClient singleton
    └── __tests__/
        ├── setup.ts                 -- globalSetup: loads .env.test, runs prisma migrate deploy
        ├── helpers.ts               -- truncateAll() + prisma export
        ├── auth.test.ts             -- 7 integration tests
        ├── machines.test.ts         -- 11 integration tests
        ├── dailyLogs.test.ts        -- 6 integration tests
        ├── tickets.test.ts          -- 11 integration tests
        ├── siteVisits.test.ts       -- 6 integration tests
        ├── machineHistory.test.ts   -- 3 integration tests
        ├── activityLog.test.ts      -- 4 integration tests
        └── users.test.ts            -- 7 integration tests
```

#### hortisort-monitor/src/ (Phases 1–5 all complete)

```
hortisort-monitor/src/
├── App.tsx                          -- AuthProvider + Router + PageLayout
├── main.tsx                         -- entry point
├── index.css                        -- Tailwind + slide-in animation
├── types/index.ts                   -- 8 table interfaces + 5 Phase 3 interfaces + 9 union types
├── data/mockData.ts                 -- reference seed data (used by server/prisma/seed.ts)
├── utils/
│   ├── formatters.ts                -- formatRelativeTime, getStatusBadgeColor, getSeverityBadgeColor
│   └── userLookup.ts                -- getUserById, getUserName
├── services/
│   ├── apiClient.ts                 -- JWT token store + fetch wrapper + 401→refresh→retry interceptor
│   ├── authService.ts               -- login/logout/restoreSession/getCurrentUser/isAuthenticated (→ real API)
│   ├── machineService.ts            -- getMachines, getMachineById, getMachineStats, getMachinesByRole (→ real API)
│   ├── dailyLogService.ts           -- getDailyLogs, byMachineId, getRecent, getAllDailyLogs, addDailyLog (→ real API)
│   ├── ticketService.ts             -- 14 functions: CRUD, queries, status updates, comments (→ real API)
│   ├── siteVisitService.ts          -- getSiteVisitsByMachineId, getAllSiteVisits, logSiteVisit (→ real API)
│   ├── machineHistoryService.ts     -- getHistoryByMachineId (→ real API)
│   ├── userService.ts               -- getUsers, getUserById, toggleUserActive (→ real API)
│   ├── activityLogService.ts        -- getRecentActivity (→ real API)
│   └── __tests__/
│       ├── authService.test.ts      -- 15 tests (mock apiClient)
│       ├── machineService.test.ts   -- 15 tests (mock apiClient)
│       ├── dailyLogService.test.ts  -- 5+ tests (mock apiClient)
│       ├── ticketService.test.ts    -- 14 tests (mock apiClient)
│       ├── siteVisitService.test.ts -- 6 tests (mock apiClient)
│       ├── machineHistoryService.test.ts -- 2 tests (mock apiClient)
│       ├── activityLogService.test.ts -- 3 tests (mock apiClient)
│       └── userService.test.ts      -- 4 tests (mock apiClient)
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
