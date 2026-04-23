# Real-Time Machine Data Monitoring — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real-time TDMS-based production session monitoring to HortiSort Monitor — a Python watcher script on the machine PC, new backend API + WebSocket, and a live production dashboard in the browser.

**Architecture:** A self-contained Python `.exe` on the machine PC reads today's TDMS file every 15s, detects production lots, and POSTs JSON to the backend. The Express backend stores sessions in PostgreSQL and broadcasts updates via Socket.io to all connected browsers. The React frontend adds a `/production` page, an updated Machine Detail tab, and a live stat on the Dashboard — all subscribing to WebSocket updates via a shared hook.

**Tech Stack:** Node.js/Express + Prisma/PostgreSQL + Socket.io (backend); Python + nptdms + PyInstaller (watcher); React 19 + TypeScript + Socket.io-client (frontend); Vitest + Supertest (tests)

---

## File Structure

### New Backend Files
```
server/src/
  routes/productionSessions.ts        POST + GET endpoints
  routes/machineErrors.ts             POST + GET machine errors
  services/productionSessionService.ts  DB queries for production_sessions
  services/machineErrorService.ts     DB queries for machine_errors
  middleware/machineAuth.ts           X-Machine-Key header validation
  socket/productionSocket.ts          Socket.io emit helpers
  socket/index.ts                     Socket.io server setup
  schemas/productionSessionSchema.ts  Zod schemas
  schemas/machineErrorSchema.ts       Zod schemas
server/prisma/schema.prisma           Add 3 new models
server/prisma/migrations/             New migration
```

### New Frontend Files
```
hortisort-monitor/src/
  types/index.ts                      Add ProductionSession, MachineError types
  services/productionSessionService.ts  API calls
  hooks/useProductionSocket.ts        WebSocket subscription hook
  components/production/
    ProductionLotTable.tsx            Table component
    ProductionStatusBadge.tsx         Running/Completed/Error badge
    index.ts                          Barrel export
  pages/ProductionPage.tsx            /production route
```

### Modified Files
```
server/src/app.ts                     Mount new routers + Socket.io
hortisort-monitor/src/routes/AppRoutes.tsx   Add /production route
hortisort-monitor/src/pages/MachineDetailPage.tsx  Add Today's Production tab
hortisort-monitor/src/pages/DashboardPage.tsx      Add live production stat
hortisort-monitor/src/components/dashboard/StatsCards.tsx  Add "In Production Now" card
```

### New Watcher Script
```
machine-watcher/
  watcher.py
  config.json
  requirements.txt
  build.sh
  tests/test_lot_detection.py
  README.md
```

---

## Chunk 1: Database + Machine Auth Middleware

### Task 1: Add Prisma Models

**Files:**
- Modify: `server/prisma/schema.prisma`

- [ ] **Step 1:** Open `server/prisma/schema.prisma` and append the three new models after the existing `ActivityLog` model:

```prisma
model ProductionSession {
  id           Int      @id @default(autoincrement())
  machine_id   Int
  lot_number   Int
  session_date DateTime @db.Date
  start_time   DateTime @db.Timestamptz
  stop_time    DateTime? @db.Timestamptz
  fruit_type   String?  @db.VarChar(100)
  quantity_kg  Decimal? @db.Decimal(10, 2)
  status       String   @db.VarChar(20)
  raw_tdms_rows Json?
  created_at   DateTime @default(now()) @db.Timestamptz
  updated_at   DateTime @updatedAt @db.Timestamptz

  machine      Machine  @relation(fields: [machine_id], references: [id])

  @@unique([machine_id, session_date, lot_number])
  @@index([machine_id])
  @@index([session_date])
  @@map("production_sessions")
}

model MachineError {
  id          Int      @id @default(autoincrement())
  machine_id  Int
  occurred_at DateTime @db.Timestamptz
  error_code  String?  @db.VarChar(100)
  message     String?
  raw_line    String?
  created_at  DateTime @default(now()) @db.Timestamptz

  machine     Machine  @relation(fields: [machine_id], references: [id])

  @@index([machine_id])
  @@map("machine_errors")
}

model MachineApiKey {
  id         Int      @id @default(autoincrement())
  machine_id Int      @unique
  api_key    String   @unique @db.VarChar(128)
  is_active  Boolean  @default(true)
  created_at DateTime @default(now()) @db.Timestamptz

  machine    Machine  @relation(fields: [machine_id], references: [id])

  @@map("machine_api_keys")
}
```

- [ ] **Step 2:** Add reverse relations to the `Machine` model in `schema.prisma`:

```prisma
production_sessions ProductionSession[]
machine_errors      MachineError[]
api_key             MachineApiKey?
```

- [ ] **Step 3:** Run migration:
```bash
npx prisma migrate dev --name add_production_tables
```

- [ ] **Step 4:** Commit:
```bash
git add server/prisma/schema.prisma server/prisma/migrations/
git commit -m "feat: add production_sessions, machine_errors, machine_api_keys tables"
```

---

### Task 2: Machine API Key Auth Middleware

**Files:**
- Create: `server/src/middleware/machineAuth.ts`
- Create: `server/src/__tests__/middleware/machineAuth.test.ts`

- [ ] **Step 1: Write the failing test**

- [ ] **Step 2: Run test to verify failure**

- [ ] **Step 3: Implement machineAuth middleware**

- [ ] **Step 4: Run tests — all pass**

- [ ] **Step 5: Commit**

---

### Task 3: Seed API Keys

**Files:**
- Modify: `server/prisma/seed.ts`

- [ ] **Step 1:** Add API key seeding loop after machine seeds
- [ ] **Step 2:** Run `npx prisma db seed`
- [ ] **Step 3:** Commit

---

## Chunk 2: Backend API

### Task 4: Zod Schemas
- [ ] Create `productionSessionSchema.ts`
- [ ] Create `machineErrorSchema.ts`
- [ ] Commit

### Task 5: Production Session Service
- [ ] Write failing tests
- [ ] Implement `upsertSession`, `getTodaySessionsByMachineId`, `getSessions`, `getRunningMachineCount`
- [ ] Run tests pass
- [ ] Commit

### Task 6: Machine Error Service
- [ ] Write failing tests
- [ ] Implement `createError`, `getTodayErrors`
- [ ] Run tests pass
- [ ] Commit

### Task 7: Routers
- [ ] Create `productionSessions.ts` router
- [ ] Create `machineErrors.ts` router
- [ ] Integration tests
- [ ] Mount in `app.ts`
- [ ] Commit

---

## Chunk 3: Socket.io

### Task 8: Socket.io Setup + Broadcast
- [ ] `npm install socket.io` in server/
- [ ] Create `socket/index.ts`
- [ ] Create `socket/productionSocket.ts`
- [ ] Update productionSessions POST to broadcast after upsert
- [ ] Update `app.ts` and `index.ts`
- [ ] Full test suite passes
- [ ] Commit

---

## Chunk 4: Python Watcher

### Task 9: Watcher Script
- [ ] `requirements.txt`
- [ ] Write failing Python tests for `detect_lots`
- [ ] Implement `watcher.py` with `detect_lots`, `read_tdms_rows`, `post_session`, `post_errors`, `run`
- [ ] Tests pass
- [ ] `config.json` template
- [ ] `build.sh`
- [ ] Commit

---

## Chunk 5: Frontend Types + Service + Hook

### Task 10: Types
- [ ] Add `ProductionSession`, `MachineError`, `ProductionSessionFilters` to `types/index.ts`
- [ ] Type-check passes
- [ ] Commit

### Task 11: productionSessionService (frontend)
- [ ] Write failing tests
- [ ] Implement `getTodaySessions`, `getAllTodaySessions`
- [ ] Tests pass
- [ ] Commit

### Task 12: useProductionSocket hook
- [ ] `npm install socket.io-client` in hortisort-monitor/
- [ ] Write failing tests
- [ ] Implement hook
- [ ] Tests pass
- [ ] Commit

---

## Chunk 6: Frontend Components + Pages

### Task 13: ProductionStatusBadge
- [ ] Write failing tests
- [ ] Implement component
- [ ] Tests pass
- [ ] Commit

### Task 14: ProductionLotTable + barrel export
- [ ] Write failing tests
- [ ] Implement component
- [ ] Tests pass
- [ ] Commit

### Task 15: ProductionPage
- [ ] Write failing tests
- [ ] Implement page
- [ ] Tests pass
- [ ] Commit

### Task 16: Add /production route + sidebar link
- [ ] Update AppRoutes.tsx
- [ ] Update Sidebar.tsx
- [ ] Full test suite passes
- [ ] Commit

### Task 17: MachineDetailPage — Today's Production tab
- [ ] Add sessions state + fetch + socket hook
- [ ] Add tab button + content panel with live banner
- [ ] Existing tests pass
- [ ] Commit

### Task 18: Dashboard — In Production Now stat
- [ ] Update StatsCards props + new card
- [ ] Update DashboardPage to fetch + pass stat
- [ ] Existing tests pass
- [ ] Commit

---

## Chunk 7: Docs + Final Verification

### Task 19: README for watcher
- [ ] Write engineer setup guide
- [ ] Commit

### Task 20: Final verification
- [ ] Backend tests all pass
- [ ] Frontend tests all pass
- [ ] Frontend build succeeds
- [ ] Python tests pass
- [ ] Manual smoke test in browser
- [ ] Final commit
