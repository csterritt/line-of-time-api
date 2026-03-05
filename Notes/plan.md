## Assumptions

- The current failures can be fixed without changing the database schema.
- The root `e2e-tests` failures are flaky and may require repeated focused runs to reproduce reliably.
- The behavior of the current application is correct, and the tests under `line-of-time-fe/e2e-tests` should be updated to match it.

## Plan

1. Reproduce the flaky root `e2e-tests` failures from `Notes/Failed-Tests.md` using focused Playwright runs and stop at the first live failure.
2. Inspect the related app code, E2E specs, and `e2e-tests/support` helpers to identify and fix the underlying source of flakiness using Red/Green TDD.
3. Review `line-of-time-fe/e2e-tests` against the current app behavior and rewrite outdated tests so they match the application rather than changing the application to satisfy stale tests.
4. Re-run the affected tests, then make sure all tests under both the `e2e-tests` and `tests` directories pass.

## Pitfalls

- Intermittent auth, redirect, or seeded-state races may require repeated runs to expose a consistent failure mode.
- The frontend E2E tests may be broadly outdated, so the smallest correct fix may still involve rewriting whole specs.
- If any fix appears to require a schema change, stop and ask for permission immediately.
