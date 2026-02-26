# Plan: Move Test-only DB Access Out of src/lib

## Assumptions

- No database schema change is needed.
- Test-only route code can import from `e2e-tests/support/db-access.ts`.
- The test-only functions to move are: `clearTestDatabase`, `clearTestSessions`, `seedAuthTestData`, `getTestDatabaseCounts`, `clearAllEvents`, `seedEventTestData`, and `getEventCount`.

## Answer

Move test-only database helpers out of `src/lib/db-access.ts` into `e2e-tests/support/db-access.ts`, then update test-route imports to use the new module and verify all `tests` and `e2e-tests` pass.

## Plan

1. Create `e2e-tests/support/db-access.ts` with the moved test-only helpers and required local types/interfaces.
2. Update `src/routes/test/database.ts` to import those helpers from `e2e-tests/support/db-access.ts`.
3. Remove moved helpers/types from `src/lib/db-access.ts` and clean up now-unused imports.
4. Run Red/Green test cycle: start server with `npm run dev-open-sign-up`, run failing tests first, fix, then run full `tests` and `e2e-tests`.

## Pitfalls

- Breaking build paths between `src` and `e2e-tests`.
- Accidentally moving non-test code used by production routes.
- Missing one of the helper functions and leaving stale imports.
- Type mismatches after moving `TestDatabaseCounts`.

## Test Plan (Red/Green TDD)

1. **Red**: run one focused failing suite first (start with `npx playwright test -x`).
2. **Green**: apply minimal fix for first failure.
3. Repeat Red/Green until no failures remain.
4. Run full checks for both folders and confirm green.
