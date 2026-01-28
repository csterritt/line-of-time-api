# Schema and API Changes Plan

## Assumptions

- No existing event data needs migration (early development)
- Timestamps are integers (days since Jan 1, 1 AD) per SPECS.md
- The `fromTimestamp`/`toTimestamp` functions in `src/lib/timestamp.ts` are ready to use

---

## The Answer

Change `startDate`/`endDate` from ISO strings to integer timestamps, update API routes to match new paths, and add the `GET /time-info/events/:start/:end` endpoint for filtering events by timestamp range.

**New API paths (per SPECS.md):**

- `GET /time-info/events/:start/:end` — filter by timestamp range
- `GET /time-info/event/:id` — get single event (was `/events/:id`)
- `POST /time-info/new-event` — create event (was `/events`)
- `PUT /time-info/event/:id` — update event (was `/events/:id`)
- `DELETE /time-info/event/:id` — delete event (was `/events/:id`)

---

## The Plan

### Step 1: Update Schema

In `src/db/schema.ts`, change:

- `startDate: text('start_date')` → `startTimestamp: integer('start_timestamp')`
- `endDate: text('end_date')` → `endTimestamp: integer('end_timestamp')`

### Step 2: Generate Migration

Run `npx drizzle-kit generate` to create the migration file.

### Step 3: Update Event Validator

In `src/validators/event-validator.ts`:

- Change `startDate`/`endDate` validation from ISO date strings to integers
- Remove `isValidIsoDate` checks, add integer range checks

### Step 4: Restructure Routes

Reorganize `src/routes/time-info/` to match new API paths:

- Create `src/routes/time-info/events.ts` — handles `GET /events/:start/:end`
- Create `src/routes/time-info/event.ts` — handles `GET/PUT/DELETE /event/:id`
- Create `src/routes/time-info/new-event.ts` — handles `POST /new-event`

In each file:

- Update interfaces to use `startTimestamp`/`endTimestamp`
- Update handlers to accept/return integer timestamps

Update `src/index.ts` to mount the new routes:

- `app.route('/time-info/events', eventsRouter)`
- `app.route('/time-info/event', eventRouter)`
- `app.route('/time-info/new-event', newEventRouter)`

### Step 5: Update Test Endpoints

In `src/routes/test/database.ts`:

- Update seed data to use integer timestamps instead of ISO dates

### Step 6: Update E2E Tests

In `e2e-tests/time-info/*.spec.ts` and `e2e-tests/support/db-helpers.ts`:

- Update test data to use integer timestamps
- Add tests for the new `GET /:start/:end` endpoint

### Step 7: Run Tests

Verify all tests pass with `bun test` and `npx playwright test`.

---

## Pitfalls

- **Route conflict resolved** — Separating `/events/:start/:end` and `/event/:id` into different base paths avoids ambiguity
- **Integer vs string params** — Path params come as strings; must parse to integers
- **Timestamp validation** — Large timestamps (billions of years) are valid; don't reject them
