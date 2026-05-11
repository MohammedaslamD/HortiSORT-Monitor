# HortiSort Monitor — Test Cases

**Total: 147 tests** across 20 test files (92 frontend · 55 backend)

---

## Frontend Tests

### 1. `authService.test.ts` — 19 tests

**login**

| # | Test Case |
|---|-----------|
| 1 | calls POST /api/v1/auth/login with email and password |
| 2 | stores the access token after login |
| 3 | stores the refresh token in sessionStorage after login |
| 4 | returns the user object from the login response |
| 5 | does not include password_hash in returned user |
| 6 | throws when apiClient.post rejects (invalid credentials) |

**logout**

| # | Test Case |
|---|-----------|
| 7 | calls POST /api/v1/auth/logout |
| 8 | clears the access token on logout |
| 9 | clears the access token even if logout request fails |

**restoreSession**

| # | Test Case |
|---|-----------|
| 10 | returns null when no refresh token is stored in sessionStorage |
| 11 | returns null when refresh endpoint returns non-ok |
| 12 | returns user when refresh + me succeed |
| 13 | sends refreshToken in request body to /auth/refresh |
| 14 | returns null and clears tokens when /me throws after refresh |

**getCurrentUser**

| # | Test Case |
|---|-----------|
| 15 | calls GET /api/v1/auth/me and returns user |
| 16 | returns null when /me throws |

**isAuthenticated**

| # | Test Case |
|---|-----------|
| 17 | returns false when getAccessToken returns null |
| 18 | returns true when getAccessToken returns a token |

---

### 2. `machineService.test.ts` — 8 tests

**getMachines**

| # | Test Case |
|---|-----------|
| 1 | calls GET /api/v1/machines with no params when no filters |
| 2 | calls GET /api/v1/machines with status query param |
| 3 | calls GET /api/v1/machines with multiple filter params |
| 4 | returns the data array from the response |

**getMachineById**

| # | Test Case |
|---|-----------|
| 5 | calls GET /api/v1/machines/:id |

**getMachineStats**

| # | Test Case |
|---|-----------|
| 6 | calls GET /api/v1/machines/stats and returns stats |

**getMachinesByRole**

| # | Test Case |
|---|-----------|
| 7 | calls GET /api/v1/machines (server handles role-scoping) |

**updateMachineStatus**

| # | Test Case |
|---|-----------|
| 8 | calls PATCH /api/v1/machines/:id/status with correct body |

---

### 3. `dailyLogService.test.ts` — 13 tests

**getDailyLogs**

| # | Test Case |
|---|-----------|
| 1 | calls GET /api/v1/daily-logs with no query when no filters |
| 2 | calls GET /api/v1/daily-logs with machineId query param |
| 3 | calls GET /api/v1/daily-logs with date query param |
| 4 | calls GET /api/v1/daily-logs with status query param |
| 5 | calls GET /api/v1/daily-logs with multiple query params |
| 6 | returns data from the response |

**getDailyLogsByMachineId**

| # | Test Case |
|---|-----------|
| 7 | calls GET /api/v1/daily-logs?machineId=:id |

**getRecentDailyLogs**

| # | Test Case |
|---|-----------|
| 8 | calls GET /api/v1/daily-logs with limit and sort params |

**getAllDailyLogs**

| # | Test Case |
|---|-----------|
| 9 | calls GET /api/v1/daily-logs with no params when no filters |
| 10 | calls GET /api/v1/daily-logs with machineId filter |
| 11 | calls GET /api/v1/daily-logs with date filter |
| 12 | calls GET /api/v1/daily-logs with status filter |

**addDailyLog**

| # | Test Case |
|---|-----------|
| 13 | calls POST /api/v1/daily-logs with the correct body |

---

### 4. `ticketService.test.ts` — 14 tests

| # | Test Case |
|---|-----------|
| 1 | calls GET /api/v1/tickets and returns data |
| 2 | calls GET /api/v1/tickets?machineId=:id |
| 3 | calls GET /api/v1/tickets/stats and returns stats.open |
| 4 | calls GET /api/v1/tickets with limit and sort params |
| 5 | calls GET /api/v1/tickets/:id and returns ticket |
| 6 | returns null when apiClient throws |
| 7 | calls GET /api/v1/tickets?status=:status |
| 8 | calls GET /api/v1/tickets?severity=:severity |
| 9 | calls GET /api/v1/tickets?assignedTo=:userId |
| 10 | calls GET /api/v1/tickets?raisedBy=:userId |
| 11 | fetches all tickets and filters client-side by machine ID set |
| 12 | returns empty array for empty ids list (all filtered out) |
| 13 | calls GET /api/v1/tickets/:id and returns comments array |
| 14 | posts to /api/v1/tickets/:id/comments with correct body |

---

### 5. `siteVisitService.test.ts` — 6 tests

| # | Test Case |
|---|-----------|
| 1 | getSiteVisitsByMachineId calls GET /api/v1/site-visits?machineId=:id |
| 2 | getAllSiteVisits calls GET /api/v1/site-visits with no params when no filters |
| 3 | getAllSiteVisits appends engineerId filter to query string |
| 4 | getAllSiteVisits appends machineId filter to query string |
| 5 | getAllSiteVisits appends purpose filter to query string |
| 6 | logSiteVisit posts to /api/v1/site-visits with body |

---

### 6. `machineHistoryService.test.ts` — 2 tests

| # | Test Case |
|---|-----------|
| 1 | getHistoryByMachineId calls GET /api/v1/machine-history/:machineId |
| 2 | getHistoryByMachineId returns the data array from the response |

---

### 7. `activityLogService.test.ts` — 3 tests

| # | Test Case |
|---|-----------|
| 1 | getRecentActivity calls GET /api/v1/activity-log?limit=:limit |
| 2 | getRecentActivity returns the data array from the response |
| 3 | getRecentActivity passes the limit value in the query string |

---

### 8. `userService.test.ts` — 4 tests

| # | Test Case |
|---|-----------|
| 1 | getUsers calls GET /api/v1/users |
| 2 | getUserById calls GET /api/v1/users/:id and returns the user |
| 3 | getUserById returns null when the request throws (404) |
| 4 | toggleUserActive calls PATCH /api/v1/users/:id/active |

---

### 9. `userLookup.test.ts` — 4 tests

**getUserById**

| # | Test Case |
|---|-----------|
| 1 | should return the user when given a valid ID |
| 2 | should return undefined for an invalid ID |

**getUserName**

| # | Test Case |
|---|-----------|
| 3 | should return the user name for a valid ID |
| 4 | should return "Unknown" for an invalid ID |

---

### 10. `AuthContext.test.tsx` — 6 tests

| # | Test Case |
|---|-----------|
| 1 | starts with isLoading true, then false after restore resolves to null |
| 2 | restores user from session on mount |
| 3 | sets user after successful login |
| 4 | clears user after logout |
| 5 | sets error on failed login |
| 6 | exposes isLoading true during login, false after |

---

### 11. `LoginPage.test.tsx` — 7 tests

| # | Test Case |
|---|-----------|
| 1 | renders email and password fields |
| 2 | renders a submit button |
| 3 | shows error message on invalid credentials |
| 4 | navigates to /dashboard on successful login |
| 5 | disables submit button while loading |
| 6 | requires email field |
| 7 | requires password field |

---

### 12. `ProtectedRoute.test.tsx` — 7 tests

| # | Test Case |
|---|-----------|
| 1 | renders a loading spinner while session is being restored |
| 2 | redirects to /login when session restore returns null |
| 3 | renders children when session restore returns a user |
| 4 | redirects to /dashboard when user role is not in allowedRoles |
| 5 | renders children when user role is in allowedRoles |
| 6 | allows engineer access to engineer+admin routes |
| 7 | renders children for any authenticated user when no allowedRoles specified |

---

## Backend Integration Tests

### 13. `auth.test.ts` — 7 tests

| # | Test Case |
|---|-----------|
| 1 | POST /auth/login - valid credentials returns accessToken and user |
| 2 | POST /auth/login - wrong password returns 401 |
| 3 | POST /auth/login - non-existent email returns 401 |
| 4 | GET /auth/me - valid token returns user |
| 5 | GET /auth/me - no token returns 401 |
| 6 | POST /auth/refresh - valid cookie returns new accessToken |
| 7 | POST /auth/logout - clears the refresh token cookie |

---

### 14. `machines.test.ts` — 11 tests

| # | Test Case |
|---|-----------|
| 1 | GET /machines - admin sees all machines |
| 2 | GET /machines - customer sees only their machines |
| 3 | GET /machines - unauthenticated returns 401 |
| 4 | GET /machines - filter by status returns matching machines |
| 5 | GET /machines/stats - returns status counts |
| 6 | GET /machines/:id - returns machine with relations |
| 7 | GET /machines/:id - non-existent machine returns 404 |
| 8 | PATCH /machines/:id/status - engineer can update status |
| 9 | PATCH /machines/:id/status - customer cannot update status (403) |
| 10 | PATCH /machines/:id/status - invalid status returns 400 |

---

### 15. `dailyLogs.test.ts` — 6 tests

| # | Test Case |
|---|-----------|
| 1 | GET /daily-logs - admin sees all logs |
| 2 | GET /daily-logs - unauthenticated returns 401 |
| 3 | GET /daily-logs - filter by machineId returns only that machine logs |
| 4 | POST /daily-logs - engineer can create a daily log |
| 5 | POST /daily-logs - customer cannot create a daily log (403) |
| 6 | POST /daily-logs - missing required field returns 400 |

---

### 16. `tickets.test.ts` — 11 tests

| # | Test Case |
|---|-----------|
| 1 | GET /tickets - admin sees all tickets |
| 2 | GET /tickets - customer sees their raised tickets |
| 3 | GET /tickets - engineer sees their assigned tickets |
| 4 | GET /tickets - unauthenticated returns 401 |
| 5 | GET /tickets/stats - returns open count and bySeverity |
| 6 | GET /tickets/:id - returns ticket with comments and machine |
| 7 | GET /tickets/:id - non-existent ticket returns 404 |
| 8 | POST /tickets - creates a ticket with correct fields |
| 9 | PATCH /tickets/:id/status - engineer can update status to in_progress |
| 10 | PATCH /tickets/:id/status - reopened increments reopen_count and sets reopened_at |
| 11 | PATCH /tickets/:id/status - customer cannot update status (403) |
| 12 | PATCH /tickets/:id/resolve - sets resolved fields |
| 13 | PATCH /tickets/:id/resolve - customer cannot resolve ticket (403) |
| 14 | POST /tickets/:id/comments - adds a comment to the ticket |

---

### 17. `siteVisits.test.ts` — 6 tests

| # | Test Case |
|---|-----------|
| 1 | GET /site-visits - engineer sees only their own visits |
| 2 | GET /site-visits - admin sees all visits |
| 3 | GET /site-visits - unauthenticated returns 401 |
| 4 | POST /site-visits - engineer can create a site visit |
| 5 | POST /site-visits - customer cannot create a site visit (403) |

---

### 18. `machineHistory.test.ts` — 3 tests

| # | Test Case |
|---|-----------|
| 1 | GET /machine-history/:id - returns history entries ordered by created_at desc |
| 2 | GET /machine-history/:id - returns empty array for machine with no history |
| 3 | GET /machine-history/:id - unauthenticated returns 401 |

---

### 19. `activityLog.test.ts` — 4 tests

| # | Test Case |
|---|-----------|
| 1 | GET /activity-log - admin sees activity log entries |
| 2 | GET /activity-log - engineer is forbidden (403) |
| 3 | GET /activity-log - customer is forbidden (403) |
| 4 | GET /activity-log - unauthenticated returns 401 |

---

### 20. `users.test.ts` — 7 tests

| # | Test Case |
|---|-----------|
| 1 | GET /users - admin can list all users, response excludes password_hash |
| 2 | GET /users - engineer is forbidden (403) |
| 3 | GET /users - unauthenticated returns 401 |
| 4 | GET /users/:id - admin can get a user by ID |
| 5 | GET /users/:id - engineer is forbidden (403) |
| 6 | GET /users/:id - non-existent user returns 404 |
| 7 | PATCH /users/:id/active - admin can toggle user is_active |
| 8 | PATCH /users/:id/active - engineer is forbidden (403) |

---

## Summary

| Layer | Files | Tests |
|-------|-------|-------|
| Frontend services | 8 | 69 |
| Frontend utils | 1 | 4 |
| Frontend context | 1 | 6 |
| Frontend pages/routes | 2 | 14 |
| Backend integration | 8 | 54 |
| **Total** | **20** | **147** |
