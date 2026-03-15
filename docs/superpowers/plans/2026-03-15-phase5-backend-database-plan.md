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
server/.env.test
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

Copy the exact schema below into `server/prisma/schema.prisma`. All 9 enums + 8 models + relations + indexes, mapping 1:1 from the spec (lines 83–238) and `hortisort-monitor/src/types/index.ts`.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  customer
  engineer
  admin
}

enum MachineStatus {
  running
  idle
  down
  offline
}

enum TicketSeverity {
  P1_critical
  P2_high
  P3_medium
  P4_low
}

enum TicketCategory {
  hardware
  software
  sensor
  electrical
  other
}

enum TicketStatus {
  open
  in_progress
  resolved
  closed
  reopened
}

enum DailyLogStatus {
  running
  not_running
  maintenance
}

enum VisitPurpose {
  routine
  ticket
  installation
  training
}

enum ChangeType {
  location_change
  status_change
  engineer_change
  software_update
}

enum EntityType {
  machine
  ticket
  user
}

model User {
  id               Int       @id @default(autoincrement())
  name             String
  email            String    @unique
  phone            String
  whatsapp_number  String?
  password_hash    String
  role             UserRole
  is_active        Boolean   @default(true)
  created_at       DateTime  @default(now())
  updated_at       DateTime  @updatedAt

  machines_as_customer  Machine[]        @relation("CustomerMachines")
  machines_as_engineer  Machine[]        @relation("EngineerMachines")
  machines_updated      Machine[]        @relation("LastUpdatedByMachines")
  daily_logs_updated    DailyLog[]
  tickets_raised        Ticket[]         @relation("RaisedByTickets")
  tickets_assigned      Ticket[]         @relation("AssignedToTickets")
  ticket_comments       TicketComment[]
  site_visits           SiteVisit[]
  machine_histories     MachineHistory[]
  activity_logs         ActivityLog[]
}

model Machine {
  id                Int           @id @default(autoincrement())
  machine_code      String        @unique
  machine_name      String
  model             String
  serial_number     String        @unique
  customer_id       Int
  engineer_id       Int
  location          String
  city              String
  state             String
  country           String        @default("India")
  grading_features  String
  num_lanes         Int
  software_version  String
  installation_date DateTime
  status            MachineStatus @default(idle)
  last_updated      DateTime      @default(now())
  last_updated_by   Int
  is_active         Boolean       @default(true)
  created_at        DateTime      @default(now())
  updated_at        DateTime      @updatedAt

  customer      User             @relation("CustomerMachines", fields: [customer_id], references: [id])
  engineer      User             @relation("EngineerMachines", fields: [engineer_id], references: [id])
  updated_by    User             @relation("LastUpdatedByMachines", fields: [last_updated_by], references: [id])
  daily_logs    DailyLog[]
  tickets       Ticket[]
  site_visits   SiteVisit[]
  history       MachineHistory[]

  @@index([status])
  @@index([customer_id])
  @@index([engineer_id])
  @@index([city])
}

model DailyLog {
  id              Int            @id @default(autoincrement())
  machine_id      Int
  date            DateTime
  status          DailyLogStatus
  fruit_type      String
  tons_processed  Float
  shift_start     String
  shift_end       String
  notes           String
  updated_by      Int
  created_at      DateTime       @default(now())
  updated_at      DateTime       @updatedAt

  machine     Machine @relation(fields: [machine_id], references: [id])
  updated_by_user User @relation(fields: [updated_by], references: [id])

  @@unique([machine_id, date])
  @@index([date])
}

model Ticket {
  id                   Int            @id @default(autoincrement())
  ticket_number        String         @unique
  machine_id           Int
  raised_by            Int
  assigned_to          Int
  severity             TicketSeverity
  category             TicketCategory
  title                String
  description          String
  status               TicketStatus   @default(open)
  sla_hours            Int
  created_at           DateTime       @default(now())
  resolved_at          DateTime?
  resolution_time_mins Int?
  root_cause           String?
  solution             String?
  parts_used           String?
  reopen_count         Int            @default(0)
  reopened_at          DateTime?
  customer_rating      Int?
  customer_feedback    String?
  updated_at           DateTime       @updatedAt

  machine     Machine         @relation(fields: [machine_id], references: [id])
  raiser      User            @relation("RaisedByTickets", fields: [raised_by], references: [id])
  assignee    User            @relation("AssignedToTickets", fields: [assigned_to], references: [id])
  comments    TicketComment[]
  site_visits SiteVisit[]

  @@index([machine_id])
  @@index([status])
  @@index([assigned_to])
  @@index([raised_by])
}

model TicketComment {
  id             Int      @id @default(autoincrement())
  ticket_id      Int
  user_id        Int
  message        String
  attachment_url String?
  created_at     DateTime @default(now())

  ticket Ticket @relation(fields: [ticket_id], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [user_id], references: [id])
}

model SiteVisit {
  id              Int          @id @default(autoincrement())
  machine_id      Int
  engineer_id     Int
  visit_date      DateTime
  visit_purpose   VisitPurpose
  ticket_id       Int?
  findings        String
  actions_taken   String
  parts_replaced  String?
  next_visit_due  DateTime?
  created_at      DateTime     @default(now())

  machine  Machine  @relation(fields: [machine_id], references: [id])
  engineer User     @relation(fields: [engineer_id], references: [id])
  ticket   Ticket?  @relation(fields: [ticket_id], references: [id])

  @@index([machine_id])
  @@index([engineer_id])
}

model MachineHistory {
  id          Int        @id @default(autoincrement())
  machine_id  Int
  change_type ChangeType
  old_value   String
  new_value   String
  changed_by  Int
  notes       String?
  created_at  DateTime   @default(now())

  machine    Machine @relation(fields: [machine_id], references: [id])
  changed_by_user User @relation(fields: [changed_by], references: [id])
}

model ActivityLog {
  id          Int        @id @default(autoincrement())
  user_id     Int
  action      String
  entity_type EntityType
  entity_id   Int
  details     String
  created_at  DateTime   @default(now())

  user User @relation(fields: [user_id], references: [id])

  @@index([user_id])
  @@index([entity_type, entity_id])
}
```

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

Translate all arrays from `hortisort-monitor/src/data/mockData.ts` into Prisma `createMany` calls (not `create` — use `createMany` for bulk efficiency). **Seeding order matters for FK integrity**:

1. `users` (no FKs)
2. `machines` (FK: customer_id, engineer_id, last_updated_by → users)
3. `daily_logs` (FK: machine_id, updated_by)
4. `tickets` (FK: machine_id, raised_by, assigned_to)
5. `ticket_comments` (FK: ticket_id, user_id)
6. `site_visits` (FK: machine_id, engineer_id, ticket_id?)
7. `machine_history` (FK: machine_id, changed_by)
8. `activity_log` (FK: user_id)

Hash all passwords with `await bcrypt.hash('password_123', 12)` before inserting users.

After `createMany`, reset auto-increment sequences so future inserts don't collide with seeded IDs:
```typescript
await prisma.$executeRaw`SELECT setval('"users_id_seq"', (SELECT MAX(id) FROM users))`
// repeat for each table
```

Wrap the entire seed in a `main()` function with `prisma.$disconnect()` in a finally block.

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

```typescript
// server/src/utils/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 2: Create AppError class**

```typescript
// server/src/utils/AppError.ts
export class AppError extends Error {
  statusCode: number
  isOperational: boolean

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}
```

- [ ] **Step 3: Create env config**

```typescript
// server/src/config/env.ts
import { z } from 'zod'
import 'dotenv/config'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(8),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

export const env = envSchema.parse(process.env)
```

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
- `POST /api/v1/auth/logout` — `authenticate` middleware (spec requires auth), clear refresh cookie
- `GET /api/v1/auth/me` — `authenticate` middleware, return user
- `POST /api/v1/auth/refresh` — read cookie, call service, return new access token (no auth middleware — cookie is the credential)

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
- Create: `server/vitest.config.ts`
- Create: `server/.env.test`
- Create: `server/src/__tests__/setup.ts`
- Create: `server/src/__tests__/helpers.ts`
- Create: `server/src/__tests__/auth.test.ts`

- [ ] **Step 1: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    globalSetup: './src/__tests__/setup.ts',
    // envFile injects .env.test into ALL worker processes (not just globalSetup)
    // This ensures PrismaClient in test files connects to hortisort_test, not hortisort_dev
    env: { NODE_ENV: 'test' },
    pool: 'forks',
  },
})
```

- [ ] **Step 2: Create server/.env.test**

```
DATABASE_URL="postgresql://hortisort:hortisort_dev@localhost:5432/hortisort_test"
JWT_SECRET="test-secret"
PORT=4001
NODE_ENV=test
```

- [ ] **Step 3: Create server/src/__tests__/setup.ts**

Global setup: runs once before all tests, loads `.env.test` and runs Prisma migrations on the test DB. Note: this file runs in a separate process from test workers — env vars set here do NOT propagate to tests. Tests get env from `.env.test` via Vitest's `dotenv` loading (add `--env-file=.env.test` to the `test:run` script in `package.json`, or use Vitest's built-in `dotenvOptions`).

```typescript
import { execSync } from 'child_process'
import { config } from 'dotenv'
import path from 'path'

export async function setup() {
  // Load .env.test so DATABASE_URL points to hortisort_test for the migration command
  config({ path: path.resolve(process.cwd(), '.env.test') })
  // Run migrations on test DB
  execSync('npx prisma migrate deploy', { stdio: 'inherit' })
}

export async function teardown() {
  // Nothing to clean up globally
}
```

Also update the `test:run` script in `server/package.json` to pass `--env-file`:

```json
"test:run": "vitest run --env-file .env.test"
```

This ensures Vitest injects `.env.test` into all worker processes before any test file runs.

- [ ] **Step 4: Create server/src/__tests__/helpers.ts**

Per-test truncation helper (imported directly by test files — NOT via globalSetup, which runs in a separate worker):

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Truncates all tables in FK-safe order. Call in beforeEach to isolate tests.
 */
export async function truncateAll(): Promise<void> {
  const tables = [
    'activity_log', 'machine_history', 'site_visits',
    'ticket_comments', 'tickets', 'daily_logs', 'machines', '"User"',
  ]
  for (const t of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${t} RESTART IDENTITY CASCADE`)
  }
}

export { prisma }
```

- [ ] **Step 5: Write auth tests**

Use `truncateAll()` from `helpers.ts` in a `beforeEach` to isolate each test. Seed one test user directly with Prisma before tests that need a real user.

```typescript
// server/src/__tests__/auth.test.ts
import request from 'supertest'
import bcrypt from 'bcrypt'
import { app } from '../app'
import { prisma, truncateAll } from './helpers'

let testUserId: number

beforeEach(async () => {
  await truncateAll()
  const hash = await bcrypt.hash('password_123', 12)
  const user = await prisma.user.create({
    data: {
      name: 'Test Admin',
      email: 'admin@test.com',
      phone: '0000000000',
      password_hash: hash,
      role: 'admin',
    },
  })
  testUserId = user.id
})

it('POST /auth/login - valid credentials returns accessToken and user', async () => {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@test.com', password: 'password_123' })
  expect(res.status).toBe(200)
  expect(res.body.data.accessToken).toBeDefined()
  expect(res.body.data.user.email).toBe('admin@test.com')
  expect(res.body.data.user.password_hash).toBeUndefined()
  expect(res.headers['set-cookie']).toBeDefined() // refresh token cookie
})

it('POST /auth/login - wrong password returns 401', async () => {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@test.com', password: 'wrong' })
  expect(res.status).toBe(401)
})

it('POST /auth/login - non-existent email returns 401', async () => {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'nobody@test.com', password: 'password_123' })
  expect(res.status).toBe(401)
})

it('GET /auth/me - valid token returns user', async () => {
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@test.com', password: 'password_123' })
  const { accessToken } = loginRes.body.data

  const meRes = await request(app)
    .get('/api/v1/auth/me')
    .set('Authorization', `Bearer ${accessToken}`)
  expect(meRes.status).toBe(200)
  expect(meRes.body.data.id).toBe(testUserId)
})

it('GET /auth/me - no token returns 401', async () => {
  const res = await request(app).get('/api/v1/auth/me')
  expect(res.status).toBe(401)
})

it('POST /auth/refresh - valid cookie returns new accessToken', async () => {
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@test.com', password: 'password_123' })
  const cookie = loginRes.headers['set-cookie'] as string[]

  const refreshRes = await request(app)
    .post('/api/v1/auth/refresh')
    .set('Cookie', cookie)
  expect(refreshRes.status).toBe(200)
  expect(refreshRes.body.data.accessToken).toBeDefined()
})

it('POST /auth/logout - clears the refresh token cookie', async () => {
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@test.com', password: 'password_123' })
  const { accessToken } = loginRes.body.data
  const cookie = loginRes.headers['set-cookie'] as string[]

  const logoutRes = await request(app)
    .post('/api/v1/auth/logout')
    .set('Authorization', `Bearer ${accessToken}`)
    .set('Cookie', cookie)
  expect(logoutRes.status).toBe(200)
  // Verify cookie is cleared (Max-Age=0 or Expires in the past)
  const setCookie = (logoutRes.headers['set-cookie'] as string[]).join(';')
  expect(setCookie).toMatch(/refresh_token=;|Max-Age=0/)
})
```

- [ ] **Step 6: Run tests**

Run: `cd server && npm run test:run`
Expected: all 7 auth tests pass

- [ ] **Step 7: Commit**

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
- 401 interceptor: on 401 response → calls `POST /api/v1/auth/refresh` → if refresh succeeds, retries the **original failed request** once with the new token → if refresh also fails, clears token + redirects to `/login`

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

- [ ] **Step 2: Update `__tests__/authService.test.ts`** to mock `apiClient` with `vi.mock`. The existing 13 tests use in-memory mock data — replace them with tests that assert the correct `apiClient` method and path are called with the right arguments (e.g. `expect(mockPost).toHaveBeenCalledWith('/api/v1/auth/login', { email, password })`). Do not test `apiClient` internals here; assume it works.

- [ ] **Step 3: Run frontend tests**

Run: `cd hortisort-monitor && npm run test:run`
Expected: all passing (authService tests updated, no regressions)

- [ ] **Step 4: Commit**

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

- [ ] **Step 2: Update `__tests__/AuthContext.test.tsx`** — existing 6 tests use synchronous mock auth. Update them to mock `authService.restoreSession` as an async function returning `null` or a user, and add an assertion that `isLoading` transitions from `true` to `false` on mount.

- [ ] **Step 3: Run frontend tests**

Run: `cd hortisort-monitor && npm run test:run`
Expected: all passing

- [ ] **Step 4: Commit**

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

- [ ] **Step 3: Update `__tests__/ProtectedRoute.test.tsx`** — existing 6 tests don't account for `isLoading`. Add tests that verify a loading spinner is rendered while `isLoading` is true, and that the redirect only happens once `isLoading` is false.

- [ ] **Step 4: Run frontend tests**

Run: `cd hortisort-monitor && npm run test:run`
Expected: all passing

- [ ] **Step 5: Commit**

```
feat: update route guards to handle async auth loading state
```

---

### Task 17: Update task.md + final Chunk 1 verification

- [ ] **Step 1: Update `task.md`** (repo root: `/task.md`) with Chunk 1 status
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

- `getMachines(filters, user)` — role-scoped query with filters, uses Prisma `include: { customer: { select: { name: true } }, engineer: { select: { name: true } } }`.
  Role-scoping `where` clauses:
  - `customer` role → `where: { customer_id: user.id }`
  - `engineer` role → `where: { engineer_id: user.id }`
  - `admin` role → no scope restriction
  Additional filters: status, model, city, search (machine_code/machine_name/city/state via OR).

- `getMachineById(id)` — include `customer: { select: { name: true } }`, `engineer: { select: { name: true } }`, `updated_by: { select: { name: true } }`

- `getMachineStats(user)` — role-scoped `groupBy status` aggregation. Returns:
  `{ running: number, idle: number, down: number, offline: number, total: number }`

- `updateMachineStatus(id, status, userId)` — update `status`, `last_updated: new Date()`, `last_updated_by: userId`

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

Apply `authenticate` middleware to all 4 routes. Apply `requireRole('engineer', 'admin')` to `PATCH /:id/status`.
- GET `/machines` — `authenticate`, list with filters (role-scoped)
- GET `/machines/stats` — `authenticate`, stats (registered BEFORE `/:id`)
- GET `/machines/:id` — `authenticate`, detail
- PATCH `/machines/:id/status` — `authenticate`, `requireRole('engineer', 'admin')`, update status

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

- `getDailyLogs(filters, user)` — role-scoped via the machine relation, supports limit/sort.
  Role-scoping: customer → only logs for machines where `machine.customer_id = user.id`; engineer → logs for machines where `machine.engineer_id = user.id`; admin → no restriction.
  Use Prisma `where: { machine: { customer_id: user.id } }` pattern.
- `createDailyLog(data, userId)` — create entry with `updated_by: userId`

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

Apply `authenticate` to all routes. Apply `requireRole('engineer', 'admin')` to `POST /daily-logs`.
- GET `/daily-logs` — `authenticate`, list with filters
- POST `/daily-logs` — `authenticate`, `requireRole('engineer', 'admin')`, create

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

Run: `cd server && npm run test:run`
Expected: all machine and daily log tests pass (9+ tests)

- [ ] **Step 4: Commit**

```
test: add machine and daily log integration tests
```

---

### Task 25: Frontend — machineService.ts swap

**Files:**
- Modify: `hortisort-monitor/src/services/machineService.ts`

- [ ] **Step 1: Rewrite machineService to call real API**

Replace all mock-data queries with `apiClient` calls. Keep the same function signatures (same name, same params, same return types).

Function → endpoint mapping:
- `getMachines(filters)` → `GET /api/v1/machines?status=&model=&city=&search=` (pass filter fields as query params)
- `getMachineById(id)` → `GET /api/v1/machines/:id`
- `getMachineStats(user)` → `GET /api/v1/machines/stats`
- `getMachinesByRole(role, userId)` → `GET /api/v1/machines` (server does role-scoping from JWT, no extra params needed)
- `updateMachineStatus(id, status, userId)` → `PATCH /api/v1/machines/:id/status` with body `{ status }`

- [ ] **Step 2: Update `__tests__/machineService.test.ts`** to mock `apiClient.get/patch` with `vi.mock` instead of importing from `mockData`

- [ ] **Step 3: Commit**

```
feat: swap machineService to use real API
```

---

### Task 26: Frontend — dailyLogService.ts swap

**Files:**
- Modify: `hortisort-monitor/src/services/dailyLogService.ts`

- [ ] **Step 1: Rewrite dailyLogService to call real API**

Replace all mock-data queries with `apiClient` calls. Keep the same function signatures.

Function → endpoint mapping:
- `getDailyLogs(filters?)` → `GET /api/v1/daily-logs?machineId=&date=&status=`
- `getDailyLogsByMachineId(id)` → `GET /api/v1/daily-logs?machineId=:id`
- `getRecentDailyLogs(limit)` → `GET /api/v1/daily-logs?limit=:limit&sort=date:desc`
- `getAllDailyLogs()` → `GET /api/v1/daily-logs`
- `addDailyLog(data)` → `POST /api/v1/daily-logs` with body `{ ...data }`

- [ ] **Step 2: Update `__tests__/dailyLogService.test.ts`** to mock `apiClient` instead of importing `mockData`

- [ ] **Step 3: Commit**

```
feat: swap dailyLogService to use real API
```

---

### Task 27: Update task.md for Chunk 2

- [ ] **Step 1: Update `/task.md`** (repo root) with Chunk 2 status
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

- `getTickets(filters, user)` — role-scoped (customer→raised_by or machine.customer_id, engineer→assigned_to, admin→all), supports limit/sort
- `getTicketById(id)` — include `comments` with `user: { select: { name: true } }` (so comment author names are returned, not just user_id), include `machine: { select: { machine_code: true, machine_name: true } }`
- `createTicket(data, userId)` — auto-generate `ticket_number` (e.g. `TKT-${Date.now()}`), set `raised_by: userId`, set SLA hours based on severity: P1_critical→4, P2_high→8, P3_medium→24, P4_low→72
- `updateTicketStatus(id, status, userId)` — update `status`. If status is `reopened`: increment `reopen_count += 1`, set `reopened_at: new Date()`
- `resolveTicket(id, data, userId)` — set `status: 'resolved'`, write `root_cause`, `solution`, `parts_used`, set `resolved_at: new Date()`, compute `resolution_time_mins: Math.round((Date.now() - ticket.created_at.getTime()) / 60000)`
- `getTicketStats(user)` — role-scoped; returns `{ open: number, bySeverity: { P1_critical: number, P2_high: number, P3_medium: number, P4_low: number } }`
- `addComment(ticketId, userId, data)` — create TicketComment record

- [ ] **Step 2: Commit**

```
feat: add ticket service with CRUD and role scoping
```

---

### Task 30: Ticket routes

**Files:**
- Create: `server/src/routes/tickets.ts`
- Create: `server/src/routes/ticketComments.ts`
- Modify: `server/src/app.ts` (mount both)

- [ ] **Step 1: Write ticket routes (`routes/tickets.ts`)**

Apply `authenticate` to all routes. Apply `requireRole('engineer', 'admin')` to status/resolve routes.
- GET `/tickets` — `authenticate`, list
- GET `/tickets/stats` — `authenticate`, stats (**registered BEFORE `/:id`**)
- GET `/tickets/:id` — `authenticate`, detail with comments
- POST `/tickets` — `authenticate`, create
- PATCH `/tickets/:id/status` — `authenticate`, `requireRole('engineer', 'admin')`, update status
- PATCH `/tickets/:id/resolve` — `authenticate`, `requireRole('engineer', 'admin')`, resolve

- [ ] **Step 2: Write ticket comment routes (`routes/ticketComments.ts`)**

- POST `/tickets/:id/comments` — `authenticate`, add comment (any role)

Note: this file is separate per the spec's intended structure (spec line 50). Mount it independently in `app.ts`.

- [ ] **Step 3: Mount both in app.ts**

- [ ] **Step 4: Commit**

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
- Update status to `in_progress` as engineer
- Update status to `reopened` as engineer — verify `reopen_count` increments and `reopened_at` is set
- Update status as customer (403)
- Resolve ticket — verify `resolved_at`, `resolution_time_mins`, `root_cause` are written
- Resolve ticket as customer (403)
- Add comment
- Get stats

- [ ] **Step 2: Run tests**

Run: `cd server && npm run test:run`
Expected: all ticket tests pass (10+ tests)

- [ ] **Step 3: Commit**

```
test: add ticket integration tests
```

---

### Task 32: Frontend — ticketService.ts swap

**Files:**
- Modify: `hortisort-monitor/src/services/ticketService.ts`

- [ ] **Step 1: Rewrite ticketService to call real API**

Replace all mock-data queries with `apiClient` calls. Keep the same function signatures. All 14 functions and their endpoint mappings:

- `getTickets()` → `GET /api/v1/tickets`
- `getTicketsByMachineId(machineId)` → `GET /api/v1/tickets?machineId=:machineId`
- `getOpenTicketCount()` → `GET /api/v1/tickets/stats` → extract `response.data.open` (the server returns active-status count; align definition: count tickets with status `open | in_progress | reopened`)
- `getRecentTickets(limit)` → `GET /api/v1/tickets?limit=:limit&sort=created_at:desc`
- `getTicketById(id)` → `GET /api/v1/tickets/:id`
- `getTicketsByStatus(status)` → `GET /api/v1/tickets?status=:status`
- `getTicketsBySeverity(severity)` → `GET /api/v1/tickets?severity=:severity`
- `getTicketsByAssignedTo(userId)` → `GET /api/v1/tickets?assignedTo=:userId`
- `getTicketsByRaisedBy(userId)` → `GET /api/v1/tickets?raisedBy=:userId`
- `getTicketsByMachineIds(ids)` → `GET /api/v1/tickets` and filter client-side (no bulk machineId filter endpoint in spec)
- `getTicketComments(ticketId)` → `GET /api/v1/tickets/:ticketId` and return `.comments` from the response (comments are embedded in ticket detail)
- `addTicketComment(data: Omit<TicketComment, 'id' | 'created_at'>)` — **signature stays the same** (single-object param). Route expects `ticket_id` from the object: → `POST /api/v1/tickets/:data.ticket_id/comments` with body `{ message: data.message, attachment_url: data.attachment_url }`. **No caller signature change required.**
- `updateTicketStatus(id, status, resolution?)` — **signature stays the same**. If `resolution` is present (i.e. status is `resolved`), call `PATCH /api/v1/tickets/:id/resolve` with body `{ root_cause: resolution.root_cause, solution: resolution.solution, parts_used: resolution.parts_used }`. Otherwise call `PATCH /api/v1/tickets/:id/status` with body `{ status }`. This preserves full backward compatibility with all callers that pass `resolution` data.
- `createTicket(data)` → `POST /api/v1/tickets` with body `{ ...data }`

- [ ] **Step 2: Update `__tests__/ticketService.test.ts`**

The existing 21 tests use in-memory mock data (count-based assertions like `toHaveLength(10)`) — these all become invalid after the swap. Rewrite the test file to mock `apiClient` with `vi.mock`. Pattern:

```typescript
import { vi, beforeEach, it, expect } from 'vitest'

vi.mock('../apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

import { apiClient } from '../apiClient'
import { getTickets, getOpenTicketCount, addTicketComment, updateTicketStatus, createTicket } from '../ticketService'

beforeEach(() => {
  vi.clearAllMocks()
})

it('getTickets calls GET /api/v1/tickets', async () => {
  ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] })
  const result = await getTickets()
  expect(apiClient.get).toHaveBeenCalledWith('/api/v1/tickets')
  expect(result).toEqual([])
})

it('getOpenTicketCount returns stats.open from GET /api/v1/tickets/stats', async () => {
  ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { open: 7, bySeverity: {} } })
  const count = await getOpenTicketCount()
  expect(count).toBe(7)
})

it('addTicketComment posts to /api/v1/tickets/:id/comments with correct body', async () => {
  ;(apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { id: 1 } })
  await addTicketComment({ ticket_id: 5, user_id: 2, message: 'hello', attachment_url: null })
  expect(apiClient.post).toHaveBeenCalledWith('/api/v1/tickets/5/comments', { message: 'hello', attachment_url: null })
})

it('updateTicketStatus routes to /status when no resolution', async () => {
  ;(apiClient.patch as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} })
  await updateTicketStatus(3, 'in_progress')
  expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/tickets/3/status', { status: 'in_progress' })
})

it('updateTicketStatus routes to /resolve when resolution provided', async () => {
  ;(apiClient.patch as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} })
  await updateTicketStatus(3, 'resolved', { root_cause: 'sensor fault', solution: 'replaced', parts_used: 'sensor' })
  expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/tickets/3/resolve', {
    root_cause: 'sensor fault',
    solution: 'replaced',
    parts_used: 'sensor',
  })
})
```

Add similar tests for the remaining 9 functions following the same pattern.

- [ ] **Step 3: Run frontend tests**

Run: `cd hortisort-monitor && npm run test:run`
Expected: all passing (ticketService tests updated, no regressions)

- [ ] **Step 4: Commit**

```
feat: swap ticketService to use real API
```

---

### Task 33: Update task.md for Chunk 3

- [ ] **Step 1: Update `/task.md`** (repo root) with Chunk 3 status
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

- `siteVisitQuerySchema` — `engineerId` (optional Int), `machineId` (optional Int), `purpose` (optional VisitPurpose enum), `limit` (optional Int), `sort` (optional string e.g. `visit_date:desc`)
- `createSiteVisitSchema` — `machine_id` (Int), `engineer_id` (Int), `visit_date` (string/DateTime), `visit_purpose` (VisitPurpose), `ticket_id` (optional Int), `findings` (string), `actions_taken` (string), `parts_replaced` (optional string), `next_visit_due` (optional string/DateTime)

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

- `getSiteVisits(filters, user)` — role-scoped: customer → visits for machines where `machine.customer_id = user.id`; engineer → visits where `engineer_id = user.id`; admin → all.
- `createSiteVisit(data, userId)` — create site visit record

- [ ] **Step 2: Write routes**

Apply `authenticate` to all routes. Apply `requireRole('engineer', 'admin')` to POST.
- GET `/site-visits` — `authenticate`, role-scoped list
- POST `/site-visits` — `authenticate`, `requireRole('engineer', 'admin')`, create

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

Apply `authenticate` to all routes.
- GET `/machine-history/:machineId` — `authenticate`, ordered by `created_at desc`

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

Apply `authenticate` + `requireRole('admin')` to all routes.
- GET `/activity-log` — `authenticate`, `requireRole('admin')`, limit param (default 20)

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

Apply `authenticate` + `requireRole('admin')` to all routes.
- GET `/users` — `authenticate`, `requireRole('admin')`, list all
- GET `/users/:id` — `authenticate`, `requireRole('admin')`, single user
- PATCH `/users/:id/active` — `authenticate`, `requireRole('admin')`, toggle is_active

- [ ] **Step 3: Mount in app.ts**

- [ ] **Step 4: Commit**

```
feat: add user admin service and routes
```

---

### Task 39: Chunk 4 integration tests

**Files:**
- Create: `server/src/__tests__/siteVisits.test.ts`
- Create: `server/src/__tests__/machineHistory.test.ts`
- Create: `server/src/__tests__/activityLog.test.ts`
- Create: `server/src/__tests__/users.test.ts`

- [ ] **Step 1: Write site visit tests**

- List site visits as engineer (sees own visits only)
- List site visits as admin (sees all)
- Create site visit as engineer
- Create site visit as customer (403)

- [ ] **Step 2: Write machine history tests**

- Get history entries for a machine (ordered by created_at desc)
- Get history for non-existent machine (returns empty array, not 404)

- [ ] **Step 3: Write activity log tests**

- Get activity log as admin returns entries
- Get activity log as engineer (403)
- Get activity log as customer (403)

- [ ] **Step 4: Write user admin tests**

- List users as admin — response excludes `password_hash` field
- Get user by ID as admin
- Get user by ID as engineer (403)
- Toggle user active as admin — verify `is_active` flips in DB

- [ ] **Step 5: Run tests**

Run: `cd server && npm run test:run`
Expected: all Chunk 4 tests pass

- [ ] **Step 6: Commit**

```
test: add site visit, machine history, activity log, and user admin integration tests
```

---

### Task 40: Frontend — swap remaining services

**Files:**
- Modify: `hortisort-monitor/src/services/siteVisitService.ts`
- Modify: `hortisort-monitor/src/services/machineHistoryService.ts`
- Modify: `hortisort-monitor/src/services/activityLogService.ts`
- Modify: `hortisort-monitor/src/services/userService.ts`

- [ ] **Step 1: Rewrite siteVisitService**

Replace mock-data queries with `apiClient` calls, keeping the same function signatures:
- `getSiteVisitsByMachineId(machineId)` → `GET /api/v1/site-visits?machineId=:machineId`
- `getAllSiteVisits(filters?)` → `GET /api/v1/site-visits?engineerId=&machineId=&purpose=`
- `logSiteVisit(data)` → `POST /api/v1/site-visits` with body `{ ...data }`

Update `__tests__/siteVisitService.test.ts` to mock `apiClient`.

- [ ] **Step 2: Rewrite machineHistoryService**

Replace mock-data queries with `apiClient` calls:
- `getHistoryByMachineId(machineId)` → `GET /api/v1/machine-history/:machineId`

Update `__tests__/machineHistoryService.test.ts` to mock `apiClient`.

- [ ] **Step 3: Rewrite activityLogService**

Replace mock-data queries with `apiClient` calls:
- `getRecentActivity(limit)` → `GET /api/v1/activity-log?limit=:limit`

Update `__tests__/activityLogService.test.ts` to mock `apiClient`.

- [ ] **Step 4: Rewrite userService**

Replace mock-data queries with `apiClient` calls:
- `getUsers()` → `GET /api/v1/users`
- `getUserById(id)` → `GET /api/v1/users/:id`
- `toggleUserActive(id)` → `PATCH /api/v1/users/:id/active`

Update `__tests__/userService.test.ts` to mock `apiClient`.
- [ ] **Step 5: Commit**

```
feat: swap remaining frontend services to use real API
```

---

### Task 41: Final task.md update + Phase 5 complete

- [ ] **Step 1: Update `/task.md`** (repo root) with Chunk 4 status

- [ ] **Step 2: Commit**

```
docs: mark Phase 5 Chunk 4 (site visits + history + activity + users) complete
```

- [ ] **Step 3: Verify all pages work end-to-end**

Start Docker + server + frontend (`docker compose up -d && cd server && npm run dev` in one terminal, `cd hortisort-monitor && npm run dev` in another), then verify:
- Login page → login with a valid user (e.g. admin) → redirected to Dashboard
- Dashboard loads machines, stats, recent tickets from real DB
- Machines page: filter by status/city returns real results
- Machine detail page: tabs show real daily logs, tickets, site visits, history
- Tickets page: raise a ticket, verify it appears in the list
- Daily Logs page: see real log data
- Site Visits page: see real visit data
- Admin page: activity log + user list appear with real data
- Page refresh: session persists (refresh token cookie flow works)
- Run full test suite: `cd server && npm run test:run` → all tests pass

- [ ] **Step 4: Commit**

```
docs: mark Phase 5 (backend & database) complete
```
