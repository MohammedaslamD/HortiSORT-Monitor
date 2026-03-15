# Phase 5: Backend & Database — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace mock data with a real Express.js + Prisma + PostgreSQL backend, built in small atomic tasks.

**Architecture:** Separate `server/` directory at repo root. Full Prisma schema upfront, API endpoints built incrementally. JWT auth with access + refresh tokens. Vite proxies `/api` to backend.

**Tech Stack:** Express.js, Prisma, PostgreSQL 16, Docker Compose, Zod, bcrypt, jsonwebtoken, Vitest + supertest

**Spec:** `docs/superpowers/specs/2026-03-15-phase5-backend-database-design.md`

---

## Chunk 1: Infrastructure + Auth

### Task 1: Docker Compose + .gitignore

**Files:**
- Create: `docker-compose.yml`
- Modify: `.gitignore`

- [ ] **Step 1: Create docker-compose.yml**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: hortisort-db
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: hortisort
      POSTGRES_PASSWORD: hortisort_dev
      POSTGRES_DB: hortisort_dev
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./docker/init-test-db.sql:/docker-entrypoint-initdb.d/init-test-db.sql

volumes:
  pgdata:
```

- [ ] **Step 2: Create docker/init-test-db.sql**

```sql
CREATE DATABASE hortisort_test;
```

- [ ] **Step 3: Update .gitignore for server/**

Add to `.gitignore`:
```
# Server
server/node_modules/
server/dist/
server/.env
```

- [ ] **Step 4: Commit**

```
feat: add Docker Compose for PostgreSQL dev + test databases
```

---

### Task 2: Server project scaffold

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/.env.example`

- [ ] **Step 1: Create server/package.json**

Dependencies: express, @prisma/client, prisma, zod, bcrypt, jsonwebtoken, cookie-parser, cors, dotenv
Dev deps: typescript, @types/express, @types/bcrypt, @types/jsonwebtoken, @types/cookie-parser, @types/cors, tsx, vitest, supertest, @types/supertest

Scripts:
- `dev`: `tsx watch src/index.ts`
- `build`: `tsc`
- `start`: `node dist/index.js`
- `test`: `vitest`
- `test:run`: `vitest run`

- [ ] **Step 2: Create server/tsconfig.json**

Strict mode, target ES2022, module NodeNext, outDir dist, rootDir src.

- [ ] **Step 3: Create server/.env.example**

```
DATABASE_URL="postgresql://hortisort:hortisort_dev@localhost:5432/hortisort_dev"
JWT_SECRET="change-me-in-production"
PORT=4000
NODE_ENV=development
```

- [ ] **Step 4: npm install**

Run: `cd server && npm install`

- [ ] **Step 5: Commit**

```
feat: scaffold server project with dependencies
```

---

### Task 3: Prisma schema (all 8 tables)

**Files:**
- Create: `server/prisma/schema.prisma`

- [ ] **Step 1: Write full Prisma schema**

All 9 enums + 8 models + relations + indexes. Maps 1:1 from `hortisort-monitor/src/types/index.ts`.

- [ ] **Step 2: Generate Prisma client**

Run: `cd server && npx prisma generate`

- [ ] **Step 3: Run initial migration**

Run: `cd server && npx prisma migrate dev --name init`

- [ ] **Step 4: Commit**

```
feat: add Prisma schema for all 8 tables with relations and indexes
```

---

### Task 4: Seed script

**Files:**
- Create: `server/prisma/seed.ts`
- Modify: `server/package.json` (add prisma.seed config)

- [ ] **Step 1: Write seed.ts**

Translate all arrays from `hortisort-monitor/src/data/mockData.ts` into Prisma `create` calls. Hash passwords with bcrypt. Preserve IDs. Reset sequences after seeding.

- [ ] **Step 2: Add seed config to package.json**

```json
"prisma": { "seed": "tsx prisma/seed.ts" }
```

- [ ] **Step 3: Run seed**

Run: `cd server && npx prisma db seed`

- [ ] **Step 4: Commit**

```
feat: add database seed script with mock data
```

---

### Task 5: Prisma singleton + AppError + env config

**Files:**
- Create: `server/src/utils/prisma.ts`
- Create: `server/src/utils/AppError.ts`
- Create: `server/src/config/env.ts`

- [ ] **Step 1: Create Prisma singleton**

Singleton PrismaClient instance, exported for reuse.

- [ ] **Step 2: Create AppError class**

Custom error with statusCode, message, isOperational.

- [ ] **Step 3: Create env config**

Parse env vars with Zod: DATABASE_URL, JWT_SECRET, PORT, NODE_ENV.

- [ ] **Step 4: Commit**

```
feat: add Prisma singleton, AppError class, and env config
```

---

### Task 6: JWT utilities

**Files:**
- Create: `server/src/utils/jwt.ts`

- [ ] **Step 1: Write JWT helpers**

- `signAccessToken(payload)` — 15min TTL
- `signRefreshToken(payload)` — 7d TTL
- `verifyAccessToken(token)` — returns decoded payload or throws
- `verifyRefreshToken(token)` — returns decoded payload or throws

- [ ] **Step 2: Commit**

```
feat: add JWT sign and verify utilities
```

---

### Task 7: Express app + middleware

**Files:**
- Create: `server/src/app.ts`
- Create: `server/src/index.ts`
- Create: `server/src/middleware/errorHandler.ts`
- Create: `server/src/middleware/validate.ts`
- Create: `server/src/middleware/auth.ts`

- [ ] **Step 1: Create errorHandler middleware**

Handles AppError, ZodError, PrismaClientKnownRequestError (P2002→409, P2025→404), unknown→500.

- [ ] **Step 2: Create validate middleware**

Generic Zod validation factory for body/query/params.

- [ ] **Step 3: Create auth middleware**

`authenticate` — verify JWT from Authorization header, attach `req.user`.
`requireRole(...roles)` — check `req.user.role`.

- [ ] **Step 4: Create app.ts**

Express app factory: cors, json, cookie-parser, routes (empty for now), error handler.

- [ ] **Step 5: Create index.ts**

Import app, listen on PORT from env config.

- [ ] **Step 6: Test server starts**

Run: `cd server && npx tsx src/index.ts` — should log "Server running on port 4000".

- [ ] **Step 7: Commit**

```
feat: add Express app with auth, validation, and error middleware
```

---

### Task 8: Auth Zod schemas

**Files:**
- Create: `server/src/schemas/auth.ts`

- [ ] **Step 1: Write login schema**

```typescript
loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) })
```

- [ ] **Step 2: Commit**

```
feat: add Zod validation schemas for auth endpoints
```

---

### Task 9: Auth service

**Files:**
- Create: `server/src/services/authService.ts`

- [ ] **Step 1: Write auth service**

- `login(email, password)` — find user by email, compare bcrypt, return user (without password_hash) + tokens
- `getUserById(id)` — return user without password_hash
- `refreshToken(token)` — verify refresh token, issue new access token

- [ ] **Step 2: Commit**

```
feat: add auth service with login, getUserById, and refreshToken
```

---

### Task 10: Auth routes

**Files:**
- Create: `server/src/routes/auth.ts`
- Modify: `server/src/app.ts` (mount auth routes)

- [ ] **Step 1: Write auth routes**

- `POST /api/v1/auth/login` — validate body, call service, set refresh cookie, return access token + user
- `POST /api/v1/auth/logout` — clear refresh cookie
- `GET /api/v1/auth/me` — authenticate middleware, return user
- `POST /api/v1/auth/refresh` — read cookie, call service, return new access token

- [ ] **Step 2: Mount in app.ts**

- [ ] **Step 3: Test manually**

Start server + DB, hit `POST /api/v1/auth/login` with curl.

- [ ] **Step 4: Commit**

```
feat: add auth routes (login, logout, me, refresh)
```

---

### Task 11: Auth integration tests

**Files:**
- Create: `server/src/__tests__/auth.test.ts`
- Create: `server/vitest.config.ts`

- [ ] **Step 1: Create vitest.config.ts**

- [ ] **Step 2: Write auth tests**

Tests:
- Login with valid credentials returns accessToken + user + sets cookie
- Login with wrong password returns 401
- Login with non-existent email returns 401
- GET /me with valid token returns user
- GET /me without token returns 401
- POST /refresh with valid cookie returns new accessToken
- POST /logout clears cookie

- [ ] **Step 3: Run tests**

Run: `cd server && npm run test:run`

- [ ] **Step 4: Commit**

```
test: add auth endpoint integration tests
```

---

### Task 12: Frontend — apiClient.ts

**Files:**
- Create: `hortisort-monitor/src/services/apiClient.ts`

- [ ] **Step 1: Write apiClient**

- Module-level `accessToken` variable
- `setAccessToken(token)` / `getAccessToken()` / `clearAccessToken()`
- `apiClient` object with `get`, `post`, `patch`, `delete` methods
- Attaches Bearer token to all requests
- 401 interceptor: calls `/api/v1/auth/refresh`, retries once, clears token + redirects on failure

- [ ] **Step 2: Commit**

```
feat: add API client with JWT token management and refresh interceptor
```

---

### Task 13: Frontend — Vite proxy config

**Files:**
- Modify: `hortisort-monitor/vite.config.ts`

- [ ] **Step 1: Add proxy**

```typescript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:4000',
      changeOrigin: true,
    }
  }
}
```

- [ ] **Step 2: Commit**

```
feat: add Vite dev proxy for /api to backend
```

---

### Task 14: Frontend — authService.ts rewrite

**Files:**
- Modify: `hortisort-monitor/src/services/authService.ts`

- [ ] **Step 1: Rewrite authService**

- `login(email, password)` — POST to `/api/v1/auth/login`, store access token, return user
- `logout()` — POST to `/api/v1/auth/logout`, clear access token
- `restoreSession()` — POST `/api/v1/auth/refresh` then GET `/api/v1/auth/me`, returns user or null
- `getCurrentUser()` — GET `/api/v1/auth/me` (async now)
- `isAuthenticated()` — sync check on access token variable

- [ ] **Step 2: Commit**

```
feat: rewrite authService to use real API endpoints
```

---

### Task 15: Frontend — AuthContext.tsx refactor

**Files:**
- Modify: `hortisort-monitor/src/context/AuthContext.tsx`

- [ ] **Step 1: Refactor AuthContext**

- Add `isLoading` state, default `true`
- Remove sync `useState(() => authService.getCurrentUser())`
- Add `useEffect` on mount: call `authService.restoreSession()`, set user + isLoading
- Export `isLoading` from context value
- `login()` calls `authService.login()`, sets user
- `logout()` calls `authService.logout()`, clears user

- [ ] **Step 2: Commit**

```
feat: refactor AuthContext for async JWT auth restoration
```

---

### Task 16: Frontend — ProtectedRoute/PublicRoute updates

**Files:**
- Modify: `hortisort-monitor/src/routes/ProtectedRoute.tsx`
- Modify: `hortisort-monitor/src/routes/PublicRoute.tsx`

- [ ] **Step 1: Update ProtectedRoute**

- Get `isLoading` from `useAuth()`
- If `isLoading`, render a loading spinner
- If not loading and no user, redirect to `/login`

- [ ] **Step 2: Update PublicRoute**

- Get `isLoading` from `useAuth()`
- If `isLoading`, render a loading spinner
- If not loading and user exists, redirect to `/dashboard`

- [ ] **Step 3: Commit**

```
feat: update route guards to handle async auth loading state
```

---

### Task 17: Update task.md + final Chunk 1 verification

- [ ] **Step 1: Update task.md** with Chunk 1 status
- [ ] **Step 2: Verify end-to-end** — start Docker, server, frontend. Login works against real DB. Refresh persists session.
- [ ] **Step 3: Commit**

```
docs: mark Phase 5 Chunk 1 (infrastructure + auth) complete
```

---

## Chunk 2: Machines + Daily Logs API

### Task 18: Machine Zod schemas

**Files:**
- Create: `server/src/schemas/machines.ts`

- [ ] **Step 1: Write schemas**

- `machineQuerySchema` — status, model, city, search, limit, sort (all optional)
- `updateMachineStatusSchema` — status (MachineStatus enum)

- [ ] **Step 2: Commit**

```
feat: add Zod schemas for machine endpoints
```

---

### Task 19: Machine service

**Files:**
- Create: `server/src/services/machineService.ts`

- [ ] **Step 1: Write machine service**

- `getMachines(filters, user)` — role-scoped query with filters, includes customer/engineer names
- `getMachineById(id)` — with relations
- `getMachineStats(user)` — role-scoped aggregation
- `updateMachineStatus(id, status, userId)` — update status + last_updated_by

- [ ] **Step 2: Commit**

```
feat: add machine service with role-scoped queries
```

---

### Task 20: Machine routes

**Files:**
- Create: `server/src/routes/machines.ts`
- Modify: `server/src/app.ts` (mount)

- [ ] **Step 1: Write machine routes**

- GET `/machines` — list with filters (role-scoped)
- GET `/machines/stats` — stats (registered BEFORE /:id)
- GET `/machines/:id` — detail
- PATCH `/machines/:id/status` — engineer/admin only

- [ ] **Step 2: Mount in app.ts**

- [ ] **Step 3: Commit**

```
feat: add machine API routes
```

---

### Task 21: Daily log Zod schemas

**Files:**
- Create: `server/src/schemas/dailyLogs.ts`

- [ ] **Step 1: Write schemas**

- `dailyLogQuerySchema` — machineId, date, status, limit, sort
- `createDailyLogSchema` — machine_id, date, status, fruit_type, tons_processed, shift_start, shift_end, notes

- [ ] **Step 2: Commit**

```
feat: add Zod schemas for daily log endpoints
```

---

### Task 22: Daily log service

**Files:**
- Create: `server/src/services/dailyLogService.ts`

- [ ] **Step 1: Write daily log service**

- `getDailyLogs(filters, user)` — role-scoped, supports limit/sort
- `createDailyLog(data, userId)` — create entry

- [ ] **Step 2: Commit**

```
feat: add daily log service
```

---

### Task 23: Daily log routes

**Files:**
- Create: `server/src/routes/dailyLogs.ts`
- Modify: `server/src/app.ts` (mount)

- [ ] **Step 1: Write daily log routes**

- GET `/daily-logs` — list with filters
- POST `/daily-logs` — create (engineer/admin)

- [ ] **Step 2: Mount in app.ts**

- [ ] **Step 3: Commit**

```
feat: add daily log API routes
```

---

### Task 24: Machine + daily log integration tests

**Files:**
- Create: `server/src/__tests__/machines.test.ts`
- Create: `server/src/__tests__/dailyLogs.test.ts`

- [ ] **Step 1: Write machine tests**

- List machines as customer (sees own only)
- List machines as admin (sees all)
- Get machine by ID
- Get stats
- Update status as engineer
- Update status as customer (403)

- [ ] **Step 2: Write daily log tests**

- List daily logs
- Create daily log as engineer
- Create daily log as customer (403)

- [ ] **Step 3: Run tests**

- [ ] **Step 4: Commit**

```
test: add machine and daily log integration tests
```

---

### Task 25: Frontend — machineService.ts swap

**Files:**
- Modify: `hortisort-monitor/src/services/machineService.ts`

- [ ] **Step 1: Rewrite machineService to call real API**

Replace mock data queries with apiClient calls. Keep same function signatures.

- [ ] **Step 2: Commit**

```
feat: swap machineService to use real API
```

---

### Task 26: Frontend — dailyLogService.ts swap

**Files:**
- Modify: `hortisort-monitor/src/services/dailyLogService.ts`

- [ ] **Step 1: Rewrite dailyLogService to call real API**

- [ ] **Step 2: Commit**

```
feat: swap dailyLogService to use real API
```

---

### Task 27: Update task.md for Chunk 2

- [ ] **Step 1: Update task.md**
- [ ] **Step 2: Commit**

```
docs: mark Phase 5 Chunk 2 (machines + daily logs) complete
```

---

## Chunk 3: Tickets + Comments API

### Task 28: Ticket Zod schemas

**Files:**
- Create: `server/src/schemas/tickets.ts`

- [ ] **Step 1: Write schemas**

- `ticketQuerySchema` — status, severity, category, machineId, assignedTo, raisedBy, limit, sort
- `createTicketSchema` — machine_id, assigned_to, severity, category, title, description
- `updateTicketStatusSchema` — status
- `resolveTicketSchema` — root_cause, solution, parts_used
- `createCommentSchema` — message, attachment_url

- [ ] **Step 2: Commit**

```
feat: add Zod schemas for ticket endpoints
```

---

### Task 29: Ticket service

**Files:**
- Create: `server/src/services/ticketService.ts`

- [ ] **Step 1: Write ticket service**

- `getTickets(filters, user)` — role-scoped, limit/sort
- `getTicketById(id)` — with comments + user names
- `createTicket(data, userId)` — auto-generate ticket_number, set SLA
- `updateTicketStatus(id, status, userId)`
- `resolveTicket(id, data, userId)`
- `getTicketStats(user)` — open count, by severity
- `addComment(ticketId, userId, data)`

- [ ] **Step 2: Commit**

```
feat: add ticket service with CRUD and role scoping
```

---

### Task 30: Ticket routes

**Files:**
- Create: `server/src/routes/tickets.ts`
- Modify: `server/src/app.ts` (mount)

- [ ] **Step 1: Write ticket routes**

- GET `/tickets` — list
- GET `/tickets/stats` — stats (before /:id)
- GET `/tickets/:id` — detail with comments
- POST `/tickets` — create
- PATCH `/tickets/:id/status` — update status (engineer/admin)
- PATCH `/tickets/:id/resolve` — resolve (engineer/admin)
- POST `/tickets/:id/comments` — add comment

- [ ] **Step 2: Mount in app.ts**

- [ ] **Step 3: Commit**

```
feat: add ticket and comment API routes
```

---

### Task 31: Ticket integration tests

**Files:**
- Create: `server/src/__tests__/tickets.test.ts`

- [ ] **Step 1: Write tests**

- List tickets (role-scoped)
- Get ticket by ID with comments
- Create ticket
- Update status
- Resolve ticket
- Add comment
- Get stats

- [ ] **Step 2: Run tests**

- [ ] **Step 3: Commit**

```
test: add ticket integration tests
```

---

### Task 32: Frontend — ticketService.ts swap

**Files:**
- Modify: `hortisort-monitor/src/services/ticketService.ts`

- [ ] **Step 1: Rewrite ticketService to call real API**

- [ ] **Step 2: Commit**

```
feat: swap ticketService to use real API
```

---

### Task 33: Update task.md for Chunk 3

- [ ] **Step 1: Update task.md**
- [ ] **Step 2: Commit**

```
docs: mark Phase 5 Chunk 3 (tickets + comments) complete
```

---

## Chunk 4: Site Visits + History + Activity + Users API

### Task 34: Remaining Zod schemas

**Files:**
- Create: `server/src/schemas/siteVisits.ts`
- Create: `server/src/schemas/users.ts`

- [ ] **Step 1: Write site visit schemas**

- `siteVisitQuerySchema` — engineerId, machineId, purpose
- `createSiteVisitSchema` — all required fields

- [ ] **Step 2: Write user schemas**

- `toggleActiveSchema` — is_active boolean

- [ ] **Step 3: Commit**

```
feat: add Zod schemas for site visits and users
```

---

### Task 35: Site visit service + routes

**Files:**
- Create: `server/src/services/siteVisitService.ts`
- Create: `server/src/routes/siteVisits.ts`
- Modify: `server/src/app.ts`

- [ ] **Step 1: Write service**

- `getSiteVisits(filters, user)` — role-scoped
- `createSiteVisit(data, userId)`

- [ ] **Step 2: Write routes**

- GET `/site-visits`
- POST `/site-visits` (engineer/admin)

- [ ] **Step 3: Mount in app.ts**

- [ ] **Step 4: Commit**

```
feat: add site visit service and routes
```

---

### Task 36: Machine history service + routes

**Files:**
- Create: `server/src/services/machineHistoryService.ts`
- Create: `server/src/routes/machineHistory.ts`
- Modify: `server/src/app.ts`

- [ ] **Step 1: Write service**

- `getHistoryByMachineId(machineId)` — ordered by date desc

- [ ] **Step 2: Write routes**

- GET `/machine-history/:machineId`

- [ ] **Step 3: Mount in app.ts**

- [ ] **Step 4: Commit**

```
feat: add machine history service and routes
```

---

### Task 37: Activity log service + routes

**Files:**
- Create: `server/src/services/activityLogService.ts`
- Create: `server/src/routes/activityLog.ts`
- Modify: `server/src/app.ts`

- [ ] **Step 1: Write service**

- `getRecentActivity(limit)` — ordered by date desc

- [ ] **Step 2: Write routes**

- GET `/activity-log` (admin only, limit param)

- [ ] **Step 3: Mount in app.ts**

- [ ] **Step 4: Commit**

```
feat: add activity log service and routes (admin only)
```

---

### Task 38: User admin service + routes

**Files:**
- Create: `server/src/services/userService.ts`
- Create: `server/src/routes/users.ts`
- Modify: `server/src/app.ts`

- [ ] **Step 1: Write service**

- `getUsers()` — excludes password_hash
- `getUserById(id)` — excludes password_hash
- `toggleUserActive(id)` — flip is_active

- [ ] **Step 2: Write routes**

- GET `/users` (admin)
- GET `/users/:id` (admin)
- PATCH `/users/:id/active` (admin)

- [ ] **Step 3: Mount in app.ts**

- [ ] **Step 4: Commit**

```
feat: add user admin service and routes
```

---

### Task 39: Chunk 4 integration tests

**Files:**
- Create: `server/src/__tests__/siteVisits.test.ts`
- Create: `server/src/__tests__/users.test.ts`

- [ ] **Step 1: Write site visit tests**
- [ ] **Step 2: Write user admin tests**
- [ ] **Step 3: Run tests**
- [ ] **Step 4: Commit**

```
test: add site visit and user admin integration tests
```

---

### Task 40: Frontend — swap remaining services

**Files:**
- Modify: `hortisort-monitor/src/services/siteVisitService.ts`
- Modify: `hortisort-monitor/src/services/machineHistoryService.ts`
- Modify: `hortisort-monitor/src/services/activityLogService.ts`
- Modify: `hortisort-monitor/src/services/userService.ts`

- [ ] **Step 1: Rewrite siteVisitService**
- [ ] **Step 2: Rewrite machineHistoryService**
- [ ] **Step 3: Rewrite activityLogService**
- [ ] **Step 4: Rewrite userService**
- [ ] **Step 5: Commit**

```
feat: swap remaining frontend services to use real API
```

---

### Task 41: Final task.md update + Phase 5 complete

- [ ] **Step 1: Update task.md** with full Phase 5 status
- [ ] **Step 2: Verify all pages work end-to-end**
- [ ] **Step 3: Commit**

```
docs: mark Phase 5 (backend & database) complete
```
