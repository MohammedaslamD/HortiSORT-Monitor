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

## Phase 5 Post-Implementation: Bug Fixes (2026-03-16 session 3)

### Status: COMPLETE

| Date       | Task                                                                 | Status      |
|------------|----------------------------------------------------------------------|-------------|
| 2026-03-16 | Fix: multi-tab auth — second login overwrote shared httpOnly refresh cookie, forcing both tabs to the same session | done |
| 2026-03-16 | Fix: server `POST /auth/login` now returns `refreshToken` in JSON body alongside the cookie | done |
| 2026-03-16 | Fix: server `POST /auth/refresh` now accepts token from request body first, falls back to cookie | done |
| 2026-03-16 | Fix: frontend `apiClient.ts` — added `setRefreshToken`/`getRefreshToken`/`clearRefreshToken` using `sessionStorage` (per-tab) | done |
| 2026-03-16 | Fix: frontend `apiClient.ts` — `tryRefresh()` sends per-tab refresh token in request body | done |
| 2026-03-16 | Fix: frontend `authService.ts` — `login()` saves refresh token to sessionStorage; `logout()` + `restoreSession()` clear/use it | done |
| 2026-03-16 | Update: `authService.test.ts` — mocks extended for new token helpers; 3 new restoreSession tests added | done |

### Root Cause

httpOnly cookies are shared across all browser tabs for the same origin. When a second user logged in from Tab B, the server's `Set-Cookie: refresh_token=...` response overwrote the first user's refresh cookie in the browser jar. Any subsequent token refresh from Tab A (first user) used the second user's refresh token, returning the wrong session — manifesting as "forced login as the other user after page refresh".

### Fix

Switched the refresh token storage from the shared httpOnly cookie to **`sessionStorage`** on the frontend. `sessionStorage` is per-tab and not shared across tabs, so Tab A and Tab B each hold their own refresh token independently. The server still sets the httpOnly cookie (for any non-JS consumers) but the frontend now sends the refresh token explicitly in the request body. The server's `/auth/refresh` endpoint accepts the token from the request body first, falling back to the cookie.

---



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
│       ├── authService.test.ts      -- 19 tests (mock apiClient, covers refreshToken sessionStorage)
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

---

## Phase 6: Dashboard Charts

### Status: COMPLETE

| Date       | Task                                                               | Status |
|------------|--------------------------------------------------------------------|--------|
| 2026-03-30 | Design spec (`docs/superpowers/specs/2026-03-30-dashboard-charts-design.md`) | done |
| 2026-03-30 | Implementation plan (`docs/superpowers/plans/2026-03-30-dashboard-charts.md`) | done |
| 2026-03-30 | Add `recharts ^3.8.1` to `hortisort-monitor/package.json`         | done   |
| 2026-03-30 | `MachineStatusChart` component + 3 unit tests (RED→GREEN)          | done   |
| 2026-03-30 | `TicketSeverityChart` component + 3 unit tests (RED→GREEN)         | done   |
| 2026-03-30 | `ThroughputChart` component + 3 unit tests (RED→GREEN)             | done   |
| 2026-03-30 | Barrel export (`components/dashboard/index.ts`) updated            | done   |
| 2026-03-30 | Chunk 1 commit: `feat: add MachineStatusChart, TicketSeverityChart, ThroughputChart components` | done |
| 2026-03-30 | `DashboardPage.test.tsx` — 9 new tests (RED)                       | done   |
| 2026-03-30 | `DashboardPage.tsx` updated — charts wired, role-based visibility   | done   |
| 2026-03-30 | All 122 frontend tests passing; type-check clean                   | done   |
| 2026-03-30 | Chunk 2 commit: `feat: wire dashboard charts into DashboardPage with role-based visibility` | done |
| 2026-03-30 | E2E Suite 9 (6 TCs) — all PASS; `E2E_TEST_REPORT.md` updated (27→33 total TCs) | done |

### What Phase 6 builds

Three Recharts-powered charts added to the DashboardPage for all roles:

| Chart | Component | Visibility |
|-------|-----------|------------|
| Machine Status donut | `MachineStatusChart` | All roles |
| Ticket Severity grouped bar | `TicketSeverityChart` | Engineer + Admin only |
| 7-day Throughput area | `ThroughputChart` | All roles |

### Key implementation notes

- Recharts v3.8.1 was already in `node_modules` but not in `package.json` — added manually
- `node_modules` must be installed natively on Windows (not WSL) for Vite 8 / rolldown
- Recharts `Tooltip` `formatter` requires wide value type (`number | string | readonly (string | number)[] | undefined`) in v3.x
- `DashboardPage`: renamed `todayLogs→allDailyLogs`, added `allMachinesStats` and `last7DaysLogs` derived values
- `DailyLog.notes` is non-nullable — fixture data uses `notes: ''` not `notes: null`

---

## Phase 7: Admin User Management (CRUD)

### Status: COMPLETE

### Completed Tasks

| Date | Task | Status |
|------|------|--------|
| 2026-04-04 | Design spec (`docs/superpowers/specs/2026-04-04-admin-user-management-design.md`) | done |
| 2026-04-04 | Implementation plan (`docs/superpowers/plans/2026-04-04-admin-user-management.md`) | done |
| 2026-04-04 | Server schemas: `createUserSchema`, `updateUserSchema`, `assignMachinesSchema` | done |
| 2026-04-04 | Server service: `createUser`, `updateUser`, `assignMachinesToUser`, `deleteUser` | done |
| 2026-04-04 | Server routes: POST /users, PATCH /users/:id, PATCH /users/:id/machines, DELETE /users/:id | done |
| 2026-04-04 | 13 new server integration tests (22 total in users.test.ts; 80 total server tests pass) | done |
| 2026-04-04 | Chunk 1 commit: `feat: add create/edit/assign-machines/delete user endpoints` | done |
| 2026-04-04 | Frontend types: `CreateUserPayload`, `UpdateUserPayload` | done |
| 2026-04-04 | Frontend service: `createUser`, `updateUser`, `assignMachinesToUser`, `deleteUser` | done |
| 2026-04-04 | 4 new userService unit tests (8 total pass) | done |
| 2026-04-04 | Chunk 2 commit: `feat: add createUser, updateUser, assignMachinesToUser, deleteUser to frontend userService` | done |
| 2026-04-04 | `CreateUserModal` component + 3 unit tests (RED→GREEN) | done |
| 2026-04-04 | `EditUserModal` component + 4 unit tests (RED→GREEN) | done |
| 2026-04-04 | `DeleteUserModal` component + 3 unit tests (RED→GREEN) | done |
| 2026-04-04 | Admin barrel export updated with 3 new modals | done |
| 2026-04-04 | Chunk 3 commit: `feat: add CreateUserModal, EditUserModal, DeleteUserModal components` | done |
| 2026-04-04 | `UserTable.tsx` updated: Edit/Delete per row, "+ Add User" button | done |
| 2026-04-04 | `AdminPage.tsx` updated: modal state, handlers, modal JSX wired | done |
| 2026-04-04 | `AdminPage.test.tsx` created: 4 tests (render + 3 modal open tests) — all PASS | done |
| 2026-04-04 | Chunk 4 commit: `feat: wire CreateUserModal, EditUserModal, DeleteUserModal into AdminPage` | done |
| 2026-04-04 | E2E Suite 10 (10 TCs) — all PASS; `E2E_TEST_REPORT.md` updated (33→43 total TCs) | done |
| 2026-04-04 | Final commit: `docs: add Suite 10 E2E results and Phase 7 completion entry` | done |

### What Phase 7 builds

Full admin user management (CRUD) wired end-to-end:

| Feature | Backend | Frontend |
|---------|---------|----------|
| Create user | POST /api/v1/users (bcrypt hash, 409 on dup email) | CreateUserModal with validation |
| Edit user | PATCH /api/v1/users/:id (name, phone, whatsapp, role) | EditUserModal pre-filled |
| Assign machines | PATCH /api/v1/users/:id/machines | Checkbox list in EditUserModal (customers only) |
| Delete user | DELETE /api/v1/users/:id (403 self, 409 if has records) | DeleteUserModal with inline error |

### Key implementation notes

- `AppError` constructor: `new AppError(message, statusCode)` — message first
- Server uses `bcrypt` (not `bcryptjs`) — `import bcrypt from 'bcrypt'`
- `validate` middleware: `validate(schema)` or `validate(schema, 'body')` — schema first
- `Machine.customer_id` is non-nullable; `assignMachinesToUser` only assigns, no unassign-to-null
- `PATCH /:id/machines` declared before `PATCH /:id` in route file
- Frontend `apiClient` is a named export — mock factory: `vi.mock('../apiClient', () => ({ apiClient: {...} }))`
- `vi.mock` factory is hoisted — top-level variables referenced in factory cause ReferenceError; use `beforeEach` with `vi.mocked()` instead
- Full vitest suite times out in WSL (~50s per test file due to happy-dom env setup); individual files verified

---

## Dark Theme Phase B — Chunk 4: ProductionPage

### Status: COMPLETE

| Date       | Task                                                            | Status |
|------------|-----------------------------------------------------------------|--------|
| 2026-05-02 | Append Chunk 4 plan to phase-b plan file                        | done   |
| 2026-05-02 | Step 4.1: `ProductionStats` type added to `src/types/index.ts`  | done   |
| 2026-05-02 | Step 4.2: `computeProductionStats` helper + 4 unit tests        | done   |
| 2026-05-02 | Step 4.4: Rewrote `ProductionPage` (StatCard×4 + DataTable + StatBadge live/completed); 4 page tests | done |
| 2026-05-02 | Step 4.5: Dark-mode smoke test now covers ProductionPage (10/10 pass) | done |
| 2026-05-02 | `npm run test:run` — **62 files / 336 tests passing** (was 326 before chunk 4) | done |
| 2026-05-02 | `npm run build` — GREEN                                         | done   |
| 2026-05-02 | `npm run lint` — 8 errors (chunk-3 baseline; no new errors)     | done   |
| 2026-05-02 | Spec status updated to "chunk 4 complete"                       | done   |

## 2026-05-02 — Phase B Chunk 5 (DailyLogsPage)

| Date       | Step                                                              | Status |
|------------|-------------------------------------------------------------------|--------|
| 2026-05-02 | Step 5.1: `DailyLogStats` type added to `src/types/index.ts`     | done   |
| 2026-05-02 | Step 5.2: `computeDailyLogStats` helper + 4 unit tests           | done   |
| 2026-05-02 | Step 5.3: `maintenance` variant added to `StatBadge` (19/21)     | done   |
| 2026-05-02 | Step 5.4: New `InfoBanner` atom + 2 tests                        | done   |
| 2026-05-02 | Step 5.5: Rewrote `DailyLogsPage` as Phase B dense dark table; 4 page tests | done |
| 2026-05-02 | Step 5.6: Dark-mode smoke now covers DailyLogsPage (12/12 pass)  | done   |
| 2026-05-02 | `npm run test:run` — **65 files / 349 tests passing** (chunk-5 floor ≥ 349 hit) | done |
| 2026-05-02 | `npm run build` — GREEN                                          | done   |
| 2026-05-02 | `npm run lint` — 8 errors (baseline preserved; no new)           | done   |
| 2026-05-02 | Spec status updated to "chunk 5 complete"                        | done   |

## 2026-05-02 — Phase B Chunk 6 (SiteVisitsPage)

| Date       | Step                                                              | Status |
|------------|-------------------------------------------------------------------|--------|
| 2026-05-02 | Step 6.1: `SiteVisitStats` type + `computeSiteVisitStats` helper + 4 tests | done |
| 2026-05-02 | Step 6.2: 3 new StatBadge variants (`emergency`/`routine`/`install`) — 22/21 | done |
| 2026-05-02 | Step 6.3: New `VisitCard` molecule + 4 tests                     | done   |
| 2026-05-02 | Step 6.4: Rewrote `SiteVisitsPage` as StatCard×4 + VisitCard list (filters dropped); existing test file rewritten with 4 new tests | done |
| 2026-05-02 | Step 6.5: Dark-mode smoke now covers SiteVisitsPage (14/14 pass) | done   |
| 2026-05-02 | `npm run test:run` — **67 files / 364 tests passing** (chunk-6 floor ≥ 364) | done |
| 2026-05-02 | `npm run build` — GREEN                                          | done   |
| 2026-05-02 | `npm run lint` — 8 errors (baseline preserved; no new)           | done   |
| 2026-05-02 | Spec status updated to "chunk 6 complete"                        | done   |

## 2026-05-02 — Phase B Chunk 7 (UserTable)

| Date       | Step                                                              | Status |
|------------|-------------------------------------------------------------------|--------|
| 2026-05-02 | Step 7.1: Rewrote `UserTable` as dark `DataTable` + role/status `StatBadge` pills + ghost action buttons; added 4 component tests (none existed before) | done |
| 2026-05-02 | `npm run test:run` — **68 files / 368 tests passing** (chunk-7 floor ≥ 368 hit exactly) | done |
| 2026-05-02 | `npm run build` — GREEN                                          | done   |
| 2026-05-02 | `npm run lint` — 8 errors (baseline preserved; no new)           | done   |
| 2026-05-02 | Spec status updated to "chunk 7 complete"                        | done   |

### Pending — remaining Phase B chunks

Per `docs/superpowers/specs/2026-04-25-dark-theme-phase-b-design.md` §7:

| # | Page | Status |
|---|------|--------|
| 8 | All modal forms restyled + Toast (split 8a–8d) | **8a + 8b + 8c + 8d complete** — chunk 8 done |
| 9 | `OperatorConsoleOverlay` (new, polls fleet every 15 s) | **done** |
| 10 | `NotificationBell` dropdown (new) | pending |

## 2026-05-02 — Phase B Chunk 9 (OperatorConsoleOverlay)

| Date | Task | Status |
|------|------|--------|
| 2026-05-02 | Step 9.1–9.8: build `OperatorConsoleOverlay` (fullscreen, ticking clock, 15s polling, machine grid) + 7 tests + barrel | done |
| 2026-05-02 | Step 9.9–9.10: wire launcher button into `Topbar` (admin/engineer only) + 4 new tests | done |
| 2026-05-02 | Step 9.11: full gate (suite, lint, build) | done |

#### Chunk 9 implementation notes

- New component at `components/dark/OperatorConsoleOverlay.tsx` (~180 lines). Returns `null` when `isOpen=false`. When open: `fixed inset-0 z-[200] bg-bg p-6 overflow-y-auto`.
- Reused existing infra: `useLivePolling` hook for both `getFleetSummary` and `getMachineRows` at 15s cadence — auto-pauses on `document.hidden`. `StatCard` from dark primitives for the 4-up KPI row.
- Ticking clock: separate `useEffect` with 1s `setInterval`. Removed the synchronous `setNow(new Date())` call inside the effect after lint flagged "Cannot call impure function during render"; the initial state seeds `now` from `() => new Date()` so the first paint shows current time.
- Tile body logic: when `status === 'running'` and tons-per-hour is non-null, show the number + "t/hr"; otherwise show the status word + caption ("IDLE/Standby", "DOWN/Fault", "OFF/Offline"). Color via two maps (`TILE_ACCENT` for left border, `TILE_VALUE_COLOR` for the big number).
- Esc-to-close via `keydown` listener attached only when `isOpen` (cleaned up on close/unmount).
- Topbar now uses `useAuth()` to gate the launcher button (`admin` and `engineer` only). `customer` users do not see the button. The overlay component is co-located in the `Topbar` so console state stays at the navbar level rather than being lifted to a global provider.
- Launcher button styling matches mockup `console-btn`: `bg-gradient-to-br from-blue-900 to-blue-600 text-white`, small black-square icon prefix.
- `PageLayout.test.tsx` needed `vi.mock('../../../context/AuthContext')` and `liveMetricsService` because Topbar now consumes both. The 4 existing tests continued to pass after the mock was added.
- Test count: 394 → 405 (+11: 7 new console + 4 new Topbar role-gating tests).
- Lint baseline: 8 errors preserved (after one transient impure-function lint regression was fixed by removing the synchronous setState call).
- Build: 42.50 → 43.83 kB CSS (+1.33 kB; new `bg-bg`, `border-l-{cyan,red,yellow,slate}`, gradient classes, `tabular-nums`).

## 2026-05-02 — Phase B Chunk 8d (2 large detail pages)

| Date | Task | Status |
|------|------|--------|
| 2026-05-02 | Step 8d.1: `MachineDetailPage` Phase B (header, today's-prod card, dark tabs, production table, ticket/visit/history cards, timeline, EmptyState) + smoke entry | done |
| 2026-05-02 | Step 8d.2: `TicketDetailPage` Phase B (header, info grid, dark-green resolution panel, comment thread, status panel) + smoke entry | done |

#### Chunk 8d implementation notes

- Smoke harness extended with a second `describe.each` for route-param pages: a small `renderRouted(Component, path, entry)` helper wraps the page in `MemoryRouter` + `Routes` + `ThemeProvider`. Adds 4 tests (2 themes × 2 pages).
- Mocks added to dark-mode.test.tsx: `getMachineHistoryService.getHistoryByMachineId`, `getTodaySessions`; existing `ticketService` mock expanded with `getTicketById` (returns Smoke ticket fixture), `getTicketComments`, `addTicketComment`, `updateTicketStatus`. `getMachineById` now returns a real `Smoke Machine` fixture (was `null`).
- Reused existing dark helpers (`statusToBadgeVariant`, `severityToBadgeVariant`, `ticketStatusToBadgeVariant`) to keep mappings centralized.
- New maps inside MachineDetailPage: `DAILY_LOG_STATUS_VARIANT` (`running|notrun|maintenance`) and `VISIT_PURPOSE_VARIANT` (`routine`/`medium`/`install`/`engineer` for ticket/training reuse). Inside TicketDetailPage: `CATEGORY_VARIANT` mapping the 5 ticket categories to existing `StatBadge` tones.
- Dropped `Badge`, `getStatusBadgeColor`, `getSeverityBadgeColor` imports from both pages.
- Resolution panel (TicketDetailPage) reskinned from `bg-green-50 border-green-200 text-green-*` → `bg-green-950/40 border-brand-green/30 text-brand-green/80` for labels and `text-fg-1`/`text-fg-2` for values. Stars now `text-yellow-400`.
- Machine history timeline: `bg-line-strong` line, `bg-fg-4 border-bg` dot, dark card wrappers. Single `medium` `StatBadge` for all change-type pills (no per-type colors needed in mockup).
- Production-history table now wrapped in `bg-bg-surface2 border border-line-strong rounded-xl` to give it a panel feel; row hover → `bg-bg-surface3`.
- `EmptyState` sub-component → `border-line-strong bg-bg-surface2 text-fg-4`.
- `SectionCard` was considered but its uppercase title styling didn't fit the existing free-form headers in these two pages; we used raw `bg-bg-surface2 border border-line-strong rounded-xl` panels for tighter visual control.
- Test count: 390 → 394 (+4: 2 MachineDetail + 2 TicketDetail × theme).
- Lint baseline preserved (8 errors). Build clean. CSS bundle 43.14 → 42.50 kB (-0.64 kB; light `dark:bg-gray-900` etc. classes removed since both files no longer reference them).

## 2026-05-02 — Phase B Chunk 8c (3 short form pages)

| Date | Task | Status |
|------|------|--------|
| 2026-05-02 | Step 8c.1: `RaiseTicketPage` Phase B SectionCard form, dark severity radio cards + 1 styling test | done |
| 2026-05-02 | Step 8c.2: `LogVisitPage` Phase B SectionCard form, dark loading + helper text + smoke entry | done |
| 2026-05-02 | Step 8c.3: `UpdateStatusPage` Phase B SectionCard form, dark not-found, `StatBadge` for machine status | done |

#### Chunk 8c implementation notes

- All 3 form pages now use `SectionCard` from `components/dark/` as the form wrapper, replacing the legacy `bg-white border-gray-200 shadow-sm` panel.
- Loading spinners switched from `border-gray-300 border-t-primary-600` to `border-line-strong border-t-brand-cyan`.
- Severity (RaiseTicket) and Status (UpdateStatus) radio cards now use `border-brand-cyan bg-brand-cyan/10` for the selected state and `border-line-strong bg-bg-surface1 hover:bg-bg-surface3` for unselected — consistent dark Phase B treatment.
- `UpdateStatusPage`'s machine status `Badge` was swapped for `StatBadge` with a `MachineStatus → variant` map (`running/idle/down/offline` → same names). The legacy `Badge` import and `getStatusBadgeColor` import were dropped.
- The Cancel button on all three pages was changed from `variant="secondary"` (which is now muted dark) to `variant="ghost"` (which is the mockup's preferred low-emphasis button style and visually paired with the blue gradient primary).
- Smoke coverage: added `RaiseTicketPage` and `LogVisitPage` to `dark-mode.test.tsx` (×2 themes each = +4 tests; net +2 because `RaiseTicketPage` already had its own test which counts toward smoke). `UpdateStatusPage` deferred from smoke — the page reads `useParams().id` and the not-found path doesn't exercise the styled form. Smoke for it would require a `MemoryRouter` with route binding which is heavier than necessary for a smoke test.
- Test count: 385 → 390 (+5: 2 RaiseTicketPage smoke + 2 LogVisitPage smoke + 1 RaiseTicketPage Phase B header test).
- Build, full suite (390/390), lint baseline (8 errors) preserved. CSS bundle 43.31 → 43.14 kB (slightly smaller — gradient classes from primitives were not duplicated as inline styles).

## 2026-05-02 — Phase B Chunk 8b (common primitives foundation + admin modals)

| Date | Task | Status |
|------|------|--------|
| 2026-05-02 | Step 8b.1: `Button` Phase B variants (primary blue gradient, ghost surface3, danger red-950) + 2 tests | done |
| 2026-05-02 | Step 8b.2: `Input` Phase B styling (dark surface, uppercase fg-4 label, brand-cyan focus) + 3 tests | done |
| 2026-05-02 | Step 8b.3: `Select` Phase B styling matching Input + 3 tests | done |
| 2026-05-02 | Step 8b.4: `TextArea` Phase B styling matching Input + 3 tests | done |
| 2026-05-02 | Step 8b.5: `Modal` Phase B dark shell with `subtitle` prop + 5 tests | done |
| 2026-05-02 | Step 8b.6: 3 admin modals — error banner restyle, subtitles, machine-list polish | done |

## 2026-05-02 — Phase B Chunk 8a (Toast position)

| Date | Task | Status |
|------|------|--------|
| 2026-05-02 | Step 8a.1: Toast bottom-right positioning per mockup line 205 + 9th test asserting `bottom-4` / `right-4` / not `top-4` | done |

#### Chunk 8 plan

Spec §7 row 8 ("modal forms + Toast") split 4-ways because surface area is uneven and only 1/5 form pages have tests. Per user direction, the 5 form pages stay as routes (deep-linkable) and are restyled in place rather than converted to overlay modals.

| Sub | Scope | Status |
|-----|-------|--------|
| 8a  | Toast bottom-right position fix | **done** |
| 8b  | 3 admin overlay modals (`CreateUserModal`, `EditUserModal`, `DeleteUserModal`) | **done** (foundation pass + content polish) |
| 8c  | 3 short form pages (`RaiseTicketPage`, `LogVisitPage`, `UpdateStatusPage`) | **done** |
| 8d  | 2 large detail pages (`MachineDetailPage`, `TicketDetailPage`) — add smoke tests | **done** |

#### Chunk 8a implementation notes

- Toast component already used Phase B tokens (`stat-gradient`, `border-brand-{green,red,amber,cyan}`, `animate-slide-in`) from earlier chunks; the only mockup-divergent detail was viewport position. Mockup line 205 specifies `bottom: 20px; right: 20px`; old impl used `top-4 right-4`.
- Test floor 368 → 369. Build + lint baseline (8 errors) preserved.

#### Chunk 8b implementation notes

- Discovered during research that `common/Button`, `common/Input`, `common/Select`, `common/TextArea`, and `common/Modal` were all using light Tailwind classes with `dark:` variants. Because the app does not toggle Tailwind's `dark` class, only the light variants rendered — every existing usage of these primitives showed light controls on the Phase B dark page. Confirmed with user, then did a foundation pass restyling all five primitives to Phase B tokens.
- Token mapping: `bg-bg-surface1` (form input bg), `bg-bg-surface2` (modal panel), `border-line-strong`, `text-fg-1/text-fg-4`, focus `border-brand-cyan` + `ring-brand-cyan/20`. Buttons: `primary` = blue gradient, `ghost` = `bg-bg-surface3`, `danger` = `bg-red-950 + border-brand-red`.
- Form labels switched to `text-[11px] font-semibold uppercase tracking-wider text-fg-4` matching mockup `.form-label`.
- `Modal` gained an optional `subtitle` prop matching mockup `.modal-sub`. Three admin modals updated to pass subtitles ("Create a team account" / "Update team account" / "This action cannot be undone").
- Error banners changed from `bg-red-50 text-red-700` to `bg-red-950/40 border border-brand-red text-red-300`.
- Tests added: Button (+2 = 3 total), Input (3, new file), Select (3, new file), TextArea (3, new file), Modal (5, new file). Test count: 369 → 385 (+16).
- All 14 admin modal tests stayed green throughout — a refactor confirmed by behaviour-preserving primitives.
- Build passes, lint baseline (8 errors) preserved. CSS bundle grew 42.15 kB → 43.31 kB.

#### Chunk 7 implementation notes

- Per the user's "users-table-only" directive, only `UserTable.tsx` was rewritten. `AdminPage.tsx`, `AdminStatsCards`, `ActivityFeed`, the three admin modals, and the page-level Toast all retain their light-theme styling and will be migrated in chunks 8+.
- `User` type lacks `site` and `last_login_at` fields. The new table renders `'—'` for Site and uses `updated_at` as a proxy for Last Login via an inline `formatRelativeTime` helper. Both call sites are marked `// TODO(phase-c)` for backend follow-up.
- Role-badge mapping uses pre-existing variants: `admin`→`admin` (purple), `engineer`→`engineer` (blue), `customer`→`customer` (cyan). No new StatBadge variants in this chunk.
- Status-badge mapping: `is_active === true` → `running` variant labelled "Active"; `false` → `idle` variant labelled "Idle". Reuses existing variants verbatim.
- Self-disable invariant preserved: the currently-logged-in admin's Deactivate and Delete buttons remain disabled (`disabled={isSelf}`).
- The header bar ("Users" + "+ Add User") continues to be rendered inside `UserTable` to match the existing `AdminPage` composition; Chunk 8 may revisit when the New User modal is restyled.
- No dark-mode smoke update in this chunk — `AdminPage` itself isn't yet a Phase B page, so adding it to the smoke would require migrating its other sections first.

#### Chunk 6 implementation notes

- `VisitPurpose → StatBadgeVariant` mapping: `routine`→`routine` (blue), `ticket`→`emergency` (red), `installation`→`install` (purple), `training`→`engineer` (cyan-blue, reused). The `engineer` reuse for `training` is intentional — the spec does not provide a dedicated tone, and the connotations are similar.
- Three filter inputs (machine / purpose / engineer) and the engineer-list fetch are dropped per mockup precedent (chunks 2/3/5).
- The `getUsers()` import is removed from `SiteVisitsPage`. Engineer names still resolve via `getUserName(id)` in `userLookup` for the meta line.
- `computeSiteVisitStats` uses UTC date-only comparisons for `due_this_week` to avoid time-of-day drift across timezones; tests pass `now` as a fixed `Date` for determinism.
- StatBadge total: 19 → **22**. The spec §3 budget was 21; we exceed it by one because `routine` (badge) is semantically distinct from `running` despite sharing the blue tone with `low`/`engineer`. Reconciliation: spec §3 explicitly permits "extend the variant union as Phase B chunks need".
- "+ Log Visit" button hidden for `customer` role via `user.role !== 'customer'` guard, even though customer is gated out of `/visits` by routing today (defensive UI).
- The legacy `SiteVisitsPage.test.tsx` (2 tests pre-existing) was overwritten with 4 new Phase B tests — net +2 tests, not +4. Plan estimate of 17 added was off; actual = 15.

- `ProductionSession` lacks `items_processed` / `items_rejected` fields. Chunk 4 renders both columns as `'—'` placeholders with `// TODO(phase-c)` comments. The Rejection Rate stat card also shows `'—'` for the same reason.
- Stat values are derived from the same `sessions` array via `computeProductionStats` — no new mock file. `lots_today` reflects total session count; `items_processed_kg` sums `quantity_kg` (rounded).
- `LIVE` and `Completed` `StatBadge` variants already shipped in chunk 2; no atom changes required.
- Socket.io live-update effect from the old page is preserved verbatim.
- The native `@rolldown/binding-win32-x64-msvc` was missing from `node_modules` after the OpenCode reinstall — `npm i @rolldown/binding-win32-x64-msvc` fixed Vitest startup.
