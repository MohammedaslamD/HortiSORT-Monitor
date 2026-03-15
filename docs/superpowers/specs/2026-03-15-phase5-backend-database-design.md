# Phase 5: Backend & Database — Design Spec

> Express.js + Prisma + PostgreSQL backend for HortiSort Monitor.
> Replaces in-memory mock data with a real database, built incrementally in 4 chunks.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Express.js | Mature, massive ecosystem, 1:1 mapping to existing REST-like service layer |
| ORM | Prisma | Auto-generated typed client, migrations, great DX |
| Database | PostgreSQL 16 | Specified in AGENTS.md, robust relational DB |
| DB hosting | Docker Compose | Reproducible, no system-level install, dev + test DBs |
| Auth | JWT (access + refresh tokens) | Stateless, maps to existing localStorage auth pattern |
| Password hashing | bcrypt (cost 12) | Industry standard, brute-force resistant |
| Validation | Zod | TypeScript-first, Prisma-compatible, can infer TS types |
| Structure | Separate `server/` at repo root | Clean separation from frontend, independent dependencies |
| API prefix | `/api/v1/` | Versioned from the start |
| Ports | Backend 4000, Frontend 3000 | Vite proxies `/api` to backend in dev |
| Migration scope | Full schema upfront, endpoints in 4 chunks | Types are stable since Phase 1, low risk |
| Testing | Vitest + supertest | Consistent with frontend tooling |

## Project Structure

```
/                              (repo root)
├── hortisort-monitor/         (existing frontend — unchanged until service swap)
├── server/                    (NEW)
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                   (DATABASE_URL, JWT_SECRET, etc.)
│   ├── .env.example
│   ├── prisma/
│   │   ├── schema.prisma      (all 8 tables defined upfront)
│   │   └── seed.ts            (mirrors mockData.ts)
│   └── src/
│       ├── index.ts           (Express bootstrap, listen on 4000)
│       ├── app.ts             (Express app factory, middleware, routes)
│       ├── config/
│       │   └── env.ts         (typed env vars parsed with Zod)
│       ├── middleware/
│       │   ├── auth.ts        (JWT verification, attach user to req)
│       │   ├── validate.ts    (generic Zod validation middleware)
│       │   └── errorHandler.ts (global error handler)
│       ├── routes/
│       │   ├── auth.ts
│       │   ├── machines.ts
│       │   ├── dailyLogs.ts
│       │   ├── tickets.ts
│       │   ├── ticketComments.ts
│       │   ├── siteVisits.ts
│       │   ├── machineHistory.ts
│       │   ├── activityLog.ts
│       │   └── users.ts
│       ├── schemas/           (Zod request validation schemas)
│       │   ├── auth.ts
│       │   ├── machines.ts
│       │   ├── dailyLogs.ts
│       │   ├── tickets.ts
│       │   ├── siteVisits.ts
│       │   └── users.ts
│       ├── services/          (business logic, calls Prisma)
│       │   ├── authService.ts
│       │   ├── machineService.ts
│       │   ├── dailyLogService.ts
│       │   ├── ticketService.ts
│       │   ├── siteVisitService.ts
│       │   ├── machineHistoryService.ts
│       │   ├── activityLogService.ts
│       │   └── userService.ts
│       ├── utils/
│       │   ├── jwt.ts         (sign, verify, refresh token helpers)
│       │   ├── prisma.ts      (singleton Prisma client)
│       │   └── AppError.ts    (custom error class)
│       └── __tests__/         (integration + service tests)
├── docker-compose.yml         (PostgreSQL dev + test databases)
└── .gitignore                 (updated for server/)
```

## Database Schema

### Enums

All existing TypeScript union types become Prisma enums:

- `UserRole`: customer, engineer, admin
- `MachineStatus`: running, idle, down, offline
- `TicketSeverity`: P1_critical, P2_high, P3_medium, P4_low
- `TicketCategory`: hardware, software, sensor, electrical, other
- `TicketStatus`: open, in_progress, resolved, closed, reopened
- `DailyLogStatus`: running, not_running, maintenance
- `VisitPurpose`: routine, ticket, installation, training
- `ChangeType`: location_change, status_change, engineer_change, software_update
- `EntityType`: machine, ticket, user

### Models (8 tables)

Each model maps 1:1 from the existing TypeScript interface in `src/types/index.ts`.
Column names use `snake_case` (matching the existing interfaces).

#### users
| Column | Type | Constraints |
|--------|------|-------------|
| id | Int | @id @default(autoincrement()) |
| name | String | |
| email | String | @unique |
| phone | String | |
| whatsapp_number | String? | |
| password_hash | String | |
| role | UserRole | |
| is_active | Boolean | @default(true) |
| created_at | DateTime | @default(now()) |
| updated_at | DateTime | @updatedAt |

#### machines
| Column | Type | Constraints |
|--------|------|-------------|
| id | Int | @id @default(autoincrement()) |
| machine_code | String | @unique |
| machine_name | String | |
| model | String | |
| serial_number | String | @unique |
| customer_id | Int | FK → users |
| engineer_id | Int | FK → users |
| location | String | |
| city | String | |
| state | String | |
| country | String | @default("India") |
| grading_features | String | |
| num_lanes | Int | |
| software_version | String | |
| installation_date | DateTime | |
| status | MachineStatus | @default(idle) |
| last_updated | DateTime | @default(now()) |
| last_updated_by | Int | FK → users |
| is_active | Boolean | @default(true) |
| created_at | DateTime | @default(now()) |
| updated_at | DateTime | @updatedAt |

**Indexes**: status, customer_id, engineer_id, city

#### daily_logs
| Column | Type | Constraints |
|--------|------|-------------|
| id | Int | @id @default(autoincrement()) |
| machine_id | Int | FK → machines |
| date | DateTime | (date only) |
| status | DailyLogStatus | |
| fruit_type | String | |
| tons_processed | Float | |
| shift_start | String | |
| shift_end | String | |
| notes | String | |
| updated_by | Int | FK → users |
| created_at | DateTime | @default(now()) |
| updated_at | DateTime | @updatedAt |

**Indexes**: machine_id + date (unique composite), date

#### tickets
| Column | Type | Constraints |
|--------|------|-------------|
| id | Int | @id @default(autoincrement()) |
| ticket_number | String | @unique |
| machine_id | Int | FK → machines |
| raised_by | Int | FK → users |
| assigned_to | Int | FK → users |
| severity | TicketSeverity | |
| category | TicketCategory | |
| title | String | |
| description | String | |
| status | TicketStatus | @default(open) |
| sla_hours | Int | |
| created_at | DateTime | @default(now()) |
| resolved_at | DateTime? | |
| resolution_time_mins | Int? | |
| root_cause | String? | |
| solution | String? | |
| parts_used | String? | |
| reopen_count | Int | @default(0) |
| reopened_at | DateTime? | |
| customer_rating | Int? | |
| customer_feedback | String? | |
| updated_at | DateTime | @updatedAt |

**Indexes**: machine_id, status, assigned_to, raised_by

#### ticket_comments
| Column | Type | Constraints |
|--------|------|-------------|
| id | Int | @id @default(autoincrement()) |
| ticket_id | Int | FK → tickets (cascade delete) |
| user_id | Int | FK → users |
| message | String | |
| attachment_url | String? | |
| created_at | DateTime | @default(now()) |

#### site_visits
| Column | Type | Constraints |
|--------|------|-------------|
| id | Int | @id @default(autoincrement()) |
| machine_id | Int | FK → machines |
| engineer_id | Int | FK → users |
| visit_date | DateTime | (date only) |
| visit_purpose | VisitPurpose | |
| ticket_id | Int? | FK → tickets (optional) |
| findings | String | |
| actions_taken | String | |
| parts_replaced | String? | |
| next_visit_due | DateTime? | (date only) |
| created_at | DateTime | @default(now()) |

**Indexes**: machine_id, engineer_id

#### machine_history
| Column | Type | Constraints |
|--------|------|-------------|
| id | Int | @id @default(autoincrement()) |
| machine_id | Int | FK → machines |
| change_type | ChangeType | |
| old_value | String | |
| new_value | String | |
| changed_by | Int | FK → users |
| notes | String? | |
| created_at | DateTime | @default(now()) |

#### activity_log
| Column | Type | Constraints |
|--------|------|-------------|
| id | Int | @id @default(autoincrement()) |
| user_id | Int | FK → users |
| action | String | |
| entity_type | EntityType | |
| entity_id | Int | |
| details | String | |
| created_at | DateTime | @default(now()) |

**Indexes**: user_id, entity_type + entity_id

### Seed Script

Translates `mockData.ts` arrays into Prisma `createMany` calls. Passwords hashed with bcrypt. IDs preserved to maintain referential integrity. Resets auto-increment sequences after seeding.

## Authentication & Authorization

### JWT Token Strategy

- **Access token**: 15-minute TTL. Payload: `{ userId: number, role: UserRole, email: string }`. Sent in `Authorization: Bearer <token>` header.
- **Refresh token**: 7-day TTL. Stored in HTTP-only, SameSite=Strict cookie named `refreshToken`. Used to get new access tokens.
- **Secret**: `JWT_SECRET` env var (single secret for both; separate secrets are YAGNI for this app).

### Auth Endpoints

| Method | Path | Body | Response | Auth |
|--------|------|------|----------|------|
| POST | `/api/v1/auth/login` | `{ email, password }` | `{ data: { accessToken, user } }` + refresh cookie | None |
| POST | `/api/v1/auth/logout` | — | `{ data: { message } }` + clear cookie | Required |
| GET | `/api/v1/auth/me` | — | `{ data: { user } }` | Required |
| POST | `/api/v1/auth/refresh` | — (reads cookie) | `{ data: { accessToken } }` | Cookie |

### Auth Middleware

```
authenticate(req, res, next)
  → Extracts token from Authorization header
  → Verifies JWT, attaches req.user = { id, role, email }
  → 401 if missing/invalid/expired

requireRole(...roles: UserRole[])
  → Checks req.user.role is in allowed roles
  → 403 if not
```

### Password Handling

- Hash: `bcrypt.hash(password, 12)`
- Compare: `bcrypt.compare(candidatePassword, storedHash)`
- Seed script hashes `password_123` for all 6 mock users

### Frontend Auth Swap (Chunk 1)

- Access token stored in a module-level variable (NOT localStorage — more secure against XSS)
- Refresh token in HTTP-only cookie (browser manages automatically)
- `apiClient.ts` — shared fetch/axios wrapper:
  - Base URL from `VITE_API_URL` env or `/api/v1` default
  - Attaches access token to every request
  - 401 interceptor: calls `/auth/refresh`, retries original request once, logout if refresh fails
- Vite proxy: `/api` → `http://localhost:4000`

### Frontend Auth Restoration (Page Refresh)

On page refresh, the module-level access token is lost. The app must restore auth state before rendering protected content. The `AuthContext` mount sequence:

1. `AuthProvider` initializes with `user: null` and `isLoading: true`
2. On mount (`useEffect`), call `authService.restoreSession()`:
   a. `POST /auth/refresh` — browser sends the HTTP-only refresh cookie automatically
   b. If refresh succeeds → store new access token in module variable → `GET /auth/me` → set `user` state
   c. If refresh fails (no cookie, expired) → set `user = null`, `isLoading = false` (user is logged out)
3. While `isLoading` is true, render a loading spinner (not the login page)
4. `ProtectedRoute` checks `isLoading` — shows spinner while restoring, redirects to `/login` only after restoration completes with `user = null`

This replaces the current synchronous `useState(() => authService.getCurrentUser())` pattern. The `getCurrentUser()` function becomes async and is only called during the restoration flow, not in a `useState` initializer.

The `isAuthenticated()` function becomes a synchronous check on whether the module-level access token variable is non-null (fast, no API call). It returns `false` during the brief restoration window, which is why `isLoading` is needed to prevent premature redirects.

## API Endpoints

All routes prefixed with `/api/v1`. Consistent response shape:
- Success: `{ data: T }` for single items, `{ data: T[] }` for lists
- Error: `{ error: string, details?: unknown }`
- List endpoints support `limit` and `sort` query params (e.g., `?limit=5&sort=created_at:desc`)
- Pagination via `?page=1&limit=20` is future-proofed but optional for now

**Route ordering rule**: Static path segments (e.g., `/machines/stats`, `/tickets/stats`) MUST be registered before parameterized segments (e.g., `/machines/:id`, `/tickets/:id`) in Express to avoid the `:id` param matching literal strings like "stats".

### Machines

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/machines` | Yes | Any | List machines. Query params: status, model, city, search, limit, sort. Role-scoped (customer→own, engineer→assigned, admin→all). Includes customer/engineer names via Prisma relations. |
| GET | `/machines/stats` | Yes | Any | Aggregated counts by status. Role-scoped. **Must be registered before /:id.** |
| GET | `/machines/:id` | Yes | Any | Single machine with relations (customer, engineer names) |
| PATCH | `/machines/:id/status` | Yes | Engineer/Admin | Update status field |

### Daily Logs

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/daily-logs` | Yes | Any | List with filters (machineId, date, status, limit, sort). Role-scoped. Used for both full list and "recent logs" (via `?limit=5&sort=date:desc`). |
| POST | `/daily-logs` | Yes | Engineer/Admin | Create daily log entry |

### Tickets

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/tickets` | Yes | Any | List with filters (status, severity, category, machineId, assignedTo, raisedBy, limit, sort). Role-scoped. Used for both full list and "recent tickets" (via `?limit=5&sort=created_at:desc`). |
| GET | `/tickets/stats` | Yes | Any | Open count, by severity breakdown. **Must be registered before /:id.** |
| GET | `/tickets/:id` | Yes | Any | Single ticket with comments |
| POST | `/tickets` | Yes | Any | Create ticket |
| PATCH | `/tickets/:id/status` | Yes | Engineer/Admin | Update status (in_progress, closed, reopen) |
| PATCH | `/tickets/:id/resolve` | Yes | Engineer/Admin | Resolve with root_cause, solution, parts_used |
| POST | `/tickets/:id/comments` | Yes | Any | Add comment to ticket |

### Site Visits

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/site-visits` | Yes | Any | List with filters (engineerId, machineId, purpose). Role-scoped. |
| POST | `/site-visits` | Yes | Engineer/Admin | Log a site visit |

### Machine History

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/machine-history/:machineId` | Yes | Any | History entries for a machine, ordered by date desc |

### Activity Log

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/activity-log` | Yes | Admin | Recent activity entries, ordered by date desc. Query params: limit (default 20). |

### Users (Admin)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/users` | Yes | Admin | List all users |
| GET | `/users/:id` | Yes | Admin | Single user (excludes password_hash) |
| PATCH | `/users/:id/active` | Yes | Admin | Toggle is_active |

## Error Handling

### Custom Error Class

```typescript
class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) { ... }
}
```

### Global Error Handler Middleware

- Catches all unhandled errors
- `AppError` → returns `{ error: message }` with the specified status code
- `ZodError` → 400 with `{ error: "Validation failed", details: issues }`
- `PrismaClientKnownRequestError`:
  - P2002 (unique constraint) → 409 Conflict
  - P2025 (record not found) → 404 Not Found
  - Others → 500
- Unknown errors → 500 with generic message (log full error server-side)

### Validation Middleware

Generic middleware factory that takes a Zod schema and validates `req.body`, `req.query`, or `req.params`:

```typescript
function validate(schema: ZodSchema, source: 'body' | 'query' | 'params')
```

Returns 400 with Zod error details on failure. Passes parsed (typed) data to the next handler on success.

## Testing Strategy

### Framework

Vitest (same as frontend) + supertest for HTTP integration tests.

### Test Database

- `docker-compose.yml` creates two databases: `hortisort_dev` and `hortisort_test`
- `.env.test` overrides `DATABASE_URL` to point to test DB
- Test setup: run migrations on test DB before suite, truncate tables between tests

### Test Types

**Integration tests** (routes):
- Use supertest against the Express app
- Test full request → response cycle including middleware, validation, auth
- Seed specific data per test suite

**Service tests** (business logic):
- Unit test service functions with mocked Prisma client
- Test edge cases, error paths, role-scoping logic

### Test Commands (server/package.json)

- `npm test` — Vitest watch mode
- `npm run test:run` — single CI run

## Incremental Implementation Chunks

### Chunk 1: Infrastructure + Auth
1. `docker-compose.yml` with PostgreSQL 16 (dev + test DBs)
2. `server/` project: package.json, tsconfig.json, .env.example
3. Full Prisma schema (all 8 models + enums + relations + indexes)
4. Prisma migration + seed script (bcrypt-hashed passwords, same IDs as mockData)
5. Express app bootstrap (app.ts, index.ts, CORS, JSON parsing, cookie-parser)
6. Config: typed env vars with Zod (env.ts)
7. Utilities: Prisma singleton, JWT helpers, AppError class
8. Middleware: auth (JWT verify), role guard, validation, error handler
9. Auth routes + service: login, logout, me, refresh
10. Auth Zod schemas
11. Integration tests for auth endpoints
12. **Frontend**: apiClient.ts (fetch wrapper with token + 401 interceptor + refresh retry)
13. **Frontend**: Vite proxy config (`/api` → `localhost:4000`)
14. **Frontend**: authService.ts rewrite (login/logout/restoreSession call real API, access token in module var)
15. **Frontend**: AuthContext.tsx refactor (async restoration flow with isLoading state, replaces sync localStorage pattern)
16. **Frontend**: ProtectedRoute/PublicRoute updates (respect isLoading during restoration)

**End state**: Login/logout works against real PostgreSQL. Session persists across page refresh via refresh token cookie. Other pages still use mock data.

### Chunk 2: Machines + Daily Logs
1. Machine routes + service (list, detail, stats, update status)
2. Daily log routes + service (list, by machine, create)
3. Zod schemas for machines + daily logs
4. Integration tests
5. **Frontend**: machineService.ts + dailyLogService.ts swap

**End state**: Dashboard, MachinesPage, MachineDetailPage, UpdateStatusPage use real DB.

### Chunk 3: Tickets + Comments
1. Ticket routes + service (list, detail, create, status updates, resolve, stats)
2. Ticket comment routes (list by ticket, create)
3. Zod schemas for tickets + comments
4. Integration tests
5. **Frontend**: ticketService.ts swap

**End state**: TicketsPage, TicketDetailPage, RaiseTicketPage use real DB.

### Chunk 4: Site Visits + History + Activity + Users
1. Site visit routes + service (list, create)
2. Machine history routes + service (list by machine)
3. Activity log routes + service (list, admin only)
4. User admin routes + service (list, detail, toggle active)
5. Zod schemas for all
6. Integration tests
7. **Frontend**: siteVisitService.ts, machineHistoryService.ts, activityLogService.ts, userService.ts swap

**End state**: All pages use real DB. Mock data retained for reference only.

## Dev Workflow

```bash
# Start database
docker compose up -d

# Backend
cd server
cp .env.example .env          # first time only
npx prisma migrate dev         # run migrations
npx prisma db seed             # seed mock data
npm run dev                    # Express on :4000 (tsx watch)

# Frontend (separate terminal)
cd hortisort-monitor
npm run dev                    # Vite on :3000, proxies /api → :4000
```

## Code Conventions (Backend)

Follows the same conventions as AGENTS.md with these additions:
- No semicolons (matching frontend)
- `import type` for type-only imports
- Named exports everywhere
- JSDoc on all exported functions
- camelCase for functions/variables, PascalCase for classes/interfaces
- snake_case for database column names (Prisma `@map` where needed)
- Error messages are descriptive: `"Machine not found"`, `"Invalid credentials"`
- All service functions are async and return typed promises
- Route handlers are thin — delegate to services
