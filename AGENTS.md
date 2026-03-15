# AGENTS.md — Fullstack Web App (React + Node.js + PostgreSQL)

> Rules and workflow for all AI coding agents operating in this repository.
> Every rule here is mandatory. No exceptions.

## Tech Stack

- **Frontend:** React (with TypeScript)
- **Backend:** Node.js (with TypeScript) — future phase
- **Database:** PostgreSQL — future phase
- **Testing:** Vitest + React Testing Library (same describe/it/expect API as Jest)
- **Styling:** Tailwind CSS v3
- **Build Tool:** Vite
- **Methodology:** Test-Driven Development (TDD) — always

## Build / Dev / Test Commands

| Command                  | Description                          |
|--------------------------|--------------------------------------|
| `npm run dev`            | Start Vite dev server                |
| `npm run build`          | Type-check (`tsc -b`) then Vite build|
| `npm run test`           | Run Vitest in watch mode             |
| `npm run test:run`       | Run all tests once (CI-friendly)     |
| `npm run lint`           | Lint the codebase                    |

### Running a single test file

```bash
npx vitest run src/components/__tests__/Button.test.tsx
```

### Running tests matching a pattern

```bash
npx vitest run -t "should calculate total"
```

### Type-check only

```bash
npx tsc -b --noEmit
```

## TDD Workflow (Mandatory)

Every feature, function, and bugfix follows Red-Green-Refactor. No code is written
without a failing test first. Build **one functionality at a time**.

### The Cycle

```
1. RED    — Write a failing test (one assert, one reason to fail)
2. GREEN  — Write the minimum code to make it pass
3. REFACTOR — Clean up without changing behavior
4. COMMIT — Git commit after each complete cycle
```

### TDD Rules

1. **Test before fix** — Always verify the test case is failing before writing any fix.
2. **One assert per test initially** — Start with a single assertion. Add more only after
   the first passes and you need to cover additional behavior.
3. **Test fails for exactly one reason** — If a test can fail for multiple reasons, split it.
4. **Single Responsibility Principle (SRP)** — Every function does one thing. Every module
   has one reason to change. Every test verifies one behavior.
5. **Parameterized tests** — Use `it.each` / `describe.each` to eliminate duplication when
   testing the same logic with different inputs.
6. **Setup and teardown** — Use `beforeEach`, `afterEach`, `beforeAll`, `afterAll` to manage
   test state. Never let tests leak state to each other.

### Regression Rules

7. **Regression within file** — After each fix, re-run ALL test cases in the same file.
   ```bash
   npx vitest run src/path/to/file.test.ts
   ```
8. **Cross-file regression** — After each fix, run ALL test files to catch unexpected impacts.
   ```bash
   npm run test:run
   ```

### Commit Rules

9. **Commit after each cycle** — Every Red-Green-Refactor cycle ends with a git commit.
10. **Meaningful commit messages** — Use conventional commits so you can revert to any
    specific functionality:
    ```
    feat: add calculateTotal function
    test: add tests for calculateTotal
    fix: handle edge case in calculateTotal
    refactor: simplify calculateTotal logic
    ```
11. **Atomic commits** — Each commit represents one complete, working functionality.
    You must be able to revert to any commit and have a working codebase.

## Detailed Reporting (Mandatory)

For every change, show:

1. **Before** — The failing test output (RED phase proof)
2. **Code written** — The implementation or fix
3. **After** — The passing test output (GREEN phase proof)
4. **Regression** — Full test suite results (all files)

Format:
```
--- RED (before) ---
FAIL: "should calculate total" — Expected 150, Received undefined

--- GREEN (after) ---
PASS: "should calculate total"

--- REGRESSION ---
Test Suites: X passed, X total
Tests:       X passed, X total
```

## Code Style Guidelines

### Single Responsibility Principle

- **Functions** — One function, one job. If a function does two things, split it.
- **Modules** — One module, one domain. Cart logic stays in cart, auth in auth.
- **Components** — One component, one purpose. Split when it grows beyond one concern.
- **Tests** — One test, one behavior. Name it after what it verifies.

### Naming Conventions

| Kind              | Convention         | Example                        |
|-------------------|--------------------|--------------------------------|
| Components        | PascalCase         | `ProductCard`, `LoginForm`     |
| Functions/vars    | camelCase          | `calculateTotal`, `isLoading`  |
| Constants         | UPPER_SNAKE_CASE   | `MAX_RETRIES`, `DB_HOST`       |
| Test files        | `*.test.ts(x)`     | `cart.test.ts`                 |
| Event handlers    | `handle[Action]`   | `handleSubmit`, `handleClick`  |
| Booleans          | `is`/`has` prefix  | `isValid`, `hasItems`          |
| Interfaces        | PascalCase         | `CartItem`, `UserProfile`      |

### Types

- Use `interface` for object shapes.
- Use `type` for unions and mapped types.
- No `any` — use `unknown` if the type is truly unknown.
- Explicit return types on all exported functions.

### Error Handling

- Try-catch around all async operations and I/O (DB, localStorage, network).
- Errors propagate with meaningful messages — never swallow silently.
- Use `error: string | null` pattern in state for UI error display.
- Log with `console.error` for debugging; show user-friendly messages in UI.

### Imports

- Named imports: `import { useState } from 'react'`
- Type-only imports: `import type { Product } from '../types'`
- Order: stdlib/node -> external packages -> internal modules -> types

### Comments

- Comments explain **why**, never **what**.
- JSDoc on exported functions.
- No commented-out code in commits.

## Test File Structure (Template)

Every test file follows this structure:

```typescript
describe('ModuleName', () => {
  // --- Setup & Teardown ---
  beforeEach(() => {
    // Reset state before each test
  });

  afterEach(() => {
    // Clean up after each test
  });

  // --- Individual behavior tests (one assert each) ---
  it('should do one specific thing', () => {
    const result = doThing(input);
    expect(result).toBe(expected);
  });

  // --- Parameterized tests for multiple inputs ---
  it.each([
    [input1, expected1],
    [input2, expected2],
    [input3, expected3],
  ])('should return %s when given %s', (input, expected) => {
    expect(doThing(input)).toBe(expected);
  });
});
```

## Universal Workflow

This workflow applies to ALL test files and ALL code changes — present and future.
No file or module is exempt.

```
1. Write ONE failing test (single assert, single failure reason)
2. Run it — confirm RED
3. Write minimum code to pass
4. Run it — confirm GREEN
5. Run ALL tests in the file — confirm regression
6. Run ALL test files — confirm cross-file regression
7. Refactor if needed (tests must stay green)
8. Git commit with conventional message
9. Show detailed before/after report
10. Repeat for next functionality
```

## Backup

- Create or update `test.md` after every task as a backup log.

## Git Commits

Conventional commit prefixes: `feat:`, `fix:`, `test:`, `refactor:`, `chore:`, `docs:`, `build:`.
Every commit must leave the codebase in a working state with all tests passing.
