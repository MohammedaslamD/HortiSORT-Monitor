# test.md — Backup Log

## Task: Update AGENTS.md with new project rules

**Date:** 2026-03-15

### What was done
- Completely rewrote `AGENTS.md` (removed all previous content)
- New rules based on user's instructions:

### Rules added
1. **Tech Stack** — React + Node.js + PostgreSQL, Jest for testing
2. **TDD Mandatory** — Red-Green-Refactor cycle for every change
3. **Test before fix** — Always verify failing test first
4. **One assert per test initially** — Single assertion, single failure reason
5. **SRP everywhere** — Functions, modules, components, and tests
6. **Parameterized tests** — `it.each` / `describe.each` for reducing duplication
7. **Setup/teardown** — `beforeEach`, `afterEach`, `beforeAll`, `afterAll`
8. **Regression within file** — Re-run all tests in same file after each fix
9. **Cross-file regression** — Run ALL test files after each fix
10. **Commit after each cycle** — Atomic commits, conventional messages, revertable
11. **Detailed reporting** — Before (RED) / After (GREEN) / Regression output shown
12. **Universal workflow** — Same 10-step process for all files, present and future
13. **Backup** — Create/update `test.md` after every task

### Result
- `AGENTS.md` rewritten: ~150 lines covering all user requirements
- `test.md` created as backup log
