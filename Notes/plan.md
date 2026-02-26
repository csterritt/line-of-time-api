# Plan: Move Event Insert to db-access with Retry + Result

## Assumptions
- No database schema change is needed.
- `insertEvent` should return `Result<boolean, Error>` to match existing db-access patterns.
- Existing `POST /time-info/new-event` tests should still pass without endpoint contract changes.

## Answer
Create `insertEvent` in `src/lib/db-access.ts` using `withRetry` + `toResult`, then switch `src/routes/time-info/new-event.ts` from direct `db.insert(...)` to `insertEvent(...)` and handle `Result.isErr` with a 500 response.

## Plan
1. Add `insertEvent(db, newEvent)` to `src/lib/db-access.ts`.
2. Implement it with `withRetry('insertEvent', ...)` and a small `insertEventActual` that does `db.insert(event).values(newEvent)`.
3. Update `src/routes/time-info/new-event.ts` to call `insertEvent`.
4. Keep error handling explicit: on `isErr`, log and return `{ error: 'Failed to create event' }` with HTTP 500.

## Pitfalls
- Accidentally bypassing retry by calling `insertEventActual` directly.
- Returning inconsistent error shapes/status codes from `new-event` route.
- Changing payload shape or response body for successful create.

## Test Plan (Red/Green TDD)
1. **Red**: run `npx playwright test e2e-tests/time-info/03-create-event.spec.ts -x` and capture first failure.
2. **Green**: apply minimal fix for that failure.
3. Repeat Red/Green until spec passes.
4. Run `/home/chris/notify-app Task Finished` when done (fallback: `/Users/chris/bin/notify-app Task Finished`).
