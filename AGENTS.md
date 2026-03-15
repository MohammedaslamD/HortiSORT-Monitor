# AGENTS.md — HortiSort Monitor

> Mandatory rules for all AI coding agents in this repo. No exceptions.

## Tech Stack

| Layer       | Technology                                      |
|-------------|--------------------------------------------------|
| Frontend    | React 19 + TypeScript 5.9 + Vite 8               |
| Styling     | Tailwind CSS v3 + `@tailwindcss/forms`            |
| Testing     | Vitest 4 + React Testing Library + happy-dom      |
| Routing     | react-router-dom v7                               |
| Backend/DB  | Node.js + PostgreSQL (future phase)               |
| Methodology | Test-Driven Development (TDD) — always            |

## Build / Dev / Test Commands

All commands run from `hortisort-monitor/`.

| Command              | Description                               |
|----------------------|-------------------------------------------|
| `npm run dev`        | Start Vite dev server                     |
| `npm run build`      | Type-check (`tsc -b`) then Vite build     |
| `npm run test`       | Run Vitest in watch mode                  |
| `npm run test:run`   | Run all tests once (CI-friendly)          |
| `npm run lint`       | ESLint the codebase                       |

### Single test file

```bash
npx vitest run src/services/__tests__/authService.test.ts
```

### Tests matching a name pattern

```bash
npx vitest run -t "should calculate total"
```

### Type-check only

```bash
npx tsc -b --noEmit
```

## Project Structure

```
hortisort-monitor/src/
  components/
    common/          Reusable UI primitives (Button, Badge, Card, Input, …)
      index.ts       Barrel re-exports
    layout/          Shell components (Navbar, Sidebar, PageLayout, BottomNav)
      index.ts       Barrel re-exports
  context/           React context providers (AuthContext)
  data/              Mock/seed data (mockData.ts)
  pages/             Route-level page components (LoginPage, DashboardPage, …)
  routes/            Router config and route guards (AppRoutes, ProtectedRoute)
  services/          Business logic / data access (authService, machineService)
  test/              Test infra (setup.ts, utils.tsx)
  types/             Shared type definitions (index.ts)
  App.tsx            Root component (sole default export in the codebase)
  main.tsx           Entry point
```

Tests live in `__tests__/` subdirectories beside their source (e.g., `services/__tests__/authService.test.ts`).

## TDD Workflow (Mandatory)

Every feature, function, and bugfix follows Red-Green-Refactor.

```
1. RED      Write a failing test (one assert, one reason to fail)
2. GREEN    Write the minimum code to make it pass
3. REFACTOR Clean up without changing behavior
4. COMMIT   Git commit with conventional message
```

- **Test before fix** — verify the test is failing before writing any implementation.
- **One assert per test initially** — add more only after the first passes.
- **Regression within file** — after each fix: `npx vitest run src/path/to/file.test.ts`
- **Cross-file regression** — after each fix: `npm run test:run`
- Use `it.each` / `describe.each` for parameterized tests.
- Use `beforeEach`/`afterEach` to manage test state; never leak state between tests.

## Git Commits

Conventional commit prefixes: `feat:`, `fix:`, `test:`, `refactor:`, `chore:`, `docs:`, `build:`.
Every commit must leave the codebase in a working state with all tests passing.
Atomic commits — one complete functionality per commit.

## Code Style

### Naming Conventions

| Kind            | Convention       | Example                          |
|-----------------|------------------|----------------------------------|
| Components      | PascalCase       | `ProductCard`, `LoginForm`       |
| Component files | PascalCase       | `LoginPage.tsx`, `Button.tsx`    |
| Functions/vars  | camelCase        | `calculateTotal`, `isLoading`    |
| Service files   | camelCase        | `authService.ts`                 |
| Constants       | UPPER_SNAKE_CASE | `STORAGE_KEY`, `MOCK_USERS`      |
| Event handlers  | `handle[Action]` | `handleSubmit`, `handleClick`    |
| Booleans        | `is`/`has` prefix| `isValid`, `hasItems`            |
| Interfaces      | PascalCase       | `CartItem`, `ButtonProps`        |
| Test files      | `*.test.ts(x)`   | `authService.test.ts`            |
| DB fields       | snake_case       | `machine_code`, `password_hash`  |

### Types (TypeScript Strict Mode)

- `interface` for object shapes; `type` for unions and mapped types.
- No `any` — use `unknown` if the type is truly unknown.
- Explicit return types on all exported functions.
- Use `Record<K, V>` for lookup maps.
- Declare nullable types explicitly: `user: AuthUser | null`.
- `verbatimModuleSyntax` is enabled — always use `import type` for type-only imports.

### Functions and Exports

- **Function declarations** for React components and standalone exported functions.
- **Arrow functions** for callbacks, inline closures, and `useCallback` wrappers.
- **Named exports everywhere** — default exports are not used (sole exception: `App.tsx`).
- Barrel `index.ts` files in component directories for cleaner imports.

### Imports

Order: external packages -> internal modules -> types (separate `import type` lines).

```typescript
import { useState, useCallback } from 'react'
import { authService } from '../services/authService'
import type { AuthUser } from '../types'
```

No path aliases — all imports use relative paths.

### Error Handling

- Try-catch around all async operations and I/O (DB, localStorage, network).
- Errors propagate with meaningful messages — never swallow silently.
- Use `error: string | null` state pattern for UI error display.
- Context hooks throw on misuse: `throw new Error('useX must be used within XProvider')`.
- Type-narrow errors: `err instanceof Error ? err.message : 'Fallback message'`.

### Comments

- Comments explain **why**, never **what**.
- JSDoc on all exported functions, public methods, and interface properties.
- No commented-out code in commits.
- Use `{/* Section Label */}` comments in JSX to delineate template sections.

### Formatting

- Semicolons: use them consistently (some files currently omit them — prefer with).
- No Prettier config exists; maintain consistency within each file.
- Tailwind classes inline on elements; extract to variables (`variantClasses`, `sizeClasses`) when mapping over variants.

## Vitest Configuration

- **Environment:** happy-dom (not jsdom).
- **Globals:** enabled (`describe`, `it`, `expect` available without import).
- **Setup file:** `src/test/setup.ts` — imports `@testing-library/jest-dom` matchers.
- **CSS:** enabled in tests.

## TypeScript Configuration

- **Target:** ES2023, strict mode with all additional checks.
- **Enabled flags:** `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `erasableSyntaxOnly`, `noUncheckedSideEffectImports`.
- **Tests excluded** from the app tsconfig (they have their own config).

## ESLint Configuration

Flat config (`eslint.config.js`) with: `@eslint/js` recommended, `typescript-eslint` recommended, `react-hooks` recommended, `react-refresh` for Vite. The `dist/` directory is globally ignored.
