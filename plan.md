# Remove longerDescription Column from event table

## Goal
Remove all code references to the `longerDescription` column from the event table. The schema has already been updated.

## Assumptions
- Database schema already updated (column removed from schema.ts)
- Database migrations already applied
- No data preservation needed

## Files to Modify (21 references across 11 files)

1. `src/validators/event-validator.ts` (6 matches) - Remove from validation schema and validation logic
2. `src/routes/time-info/event-utils.ts` (2 matches) - Remove from EventResponse interface and parseEvent function
3. `src/routes/time-info/event.ts` (1 match) - Remove from update payload
4. `src/routes/time-info/new-event.ts` (1 match) - Remove from insert payload
5. `src/routes/time-info/search.ts` (1 match) - Remove from search query
6. `src/routes/test/database.ts` (3 matches) - Remove from test event seed data
7. `tests/event-validator.test.ts` (2 matches) - Remove from unit tests
8. `e2e-tests/time-info/03-create-event.spec.ts` (2 matches) - Remove from create event test
9. `e2e-tests/time-info/06-search-events.spec.ts` (1 match) - Remove longerDescription search test
10. `e2e-tests/time-info/01-get-events.spec.ts` (1 match) - Remove from expected response
11. `e2e-tests/time-info/02-get-event-by-id.spec.ts` (1 match) - Remove from expected response

## Implementation Steps

1. **Update validator** (`src/validators/event-validator.ts`)
   - Remove `longerDescription?: string | null` from `EventInput` interface
   - Remove `MAX_LONGER_DESCRIPTION_LENGTH` constant
   - Remove validation logic for longerDescription

2. **Update event utils** (`src/routes/time-info/event-utils.ts`)
   - Remove `longerDescription: string | null` from `EventResponse` interface
   - Remove `longerDescription: dbEvent.longerDescription` from `parseEvent` return

3. **Update route handlers**
   - `src/routes/time-info/event.ts`: Remove `longerDescription: body.longerDescription ?? null` from updatedEvent
   - `src/routes/time-info/new-event.ts`: Remove `longerDescription: body.longerDescription ?? null` from newEvent
   - `src/routes/time-info/search.ts`: Remove `sql`LOWER(${event.longerDescription}) LIKE ${lowerPattern}`` from search query

4. **Update test data** (`src/routes/test/database.ts`)
   - Remove `longerDescription` field from all test event objects

5. **Update unit tests** (`tests/event-validator.test.ts`)
   - Remove `longerDescription` from test cases

6. **Update e2e tests**
   - `03-create-event.spec.ts`: Remove longerDescription from test
   - `06-search-events.spec.ts`: Remove longerDescription search test
   - `01-get-events.spec.ts`: Remove from expected response
   - `02-get-event-by-id.spec.ts`: Remove from expected response

7. **Verify**
   - Start server: `npm run dev-open-sign-up`
   - Run tests: `npx playwright test -x`

## Pitfalls

1. **Type errors** - If longerDescription is still referenced in type definitions
2. **Test failures** - If test data expects longerDescription in responses
3. **Database constraint errors** - If migrations not applied (user said they're done)
