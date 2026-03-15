# Timestamp Validation Audit Plan

## Overview

Verify that no path allows creation or update of an event whose `startTimestamp` is after its `endTimestamp`, and add regression tests to ensure this stays true.

## Investigation Findings

All three event creation/update paths are **properly protected** by `validateEventInput` in `src/validators/event-validator.ts` (lines 51-61), which rejects `endTimestamp < startTimestamp`.

- **POST /time-info/new-event** — calls `validateEventInput(body)` ✓
- **PUT /time-info/event/:id** — calls `validateEventInput(body)` ✓
- **POST /time-info/bulk-events** — `validateBulkEvents` calls `validateEventInput` per event ✓

No database-level CHECK constraint exists, but application-level validation is comprehensive.

**No code changes needed.** The only gap is missing test coverage for this case.

## Implementation Steps

1. **Add unit test** in `tests/event-validator.test.ts`
   - Test: reject event where `endTimestamp < startTimestamp`
   - Test: accept event where `endTimestamp === startTimestamp`

2. **Add e2e test** in `e2e-tests/time-info/03-create-event.spec.ts`
   - Test: POST returns 400 when `startTimestamp > endTimestamp`

3. **Add e2e test** in `e2e-tests/time-info/04-update-event.spec.ts`
   - Test: PUT returns 400 when `startTimestamp > endTimestamp`

4. **Add e2e test** in `e2e-tests/time-info/10-bulk-events.spec.ts`
   - Test: POST returns 400 when a bulk event has `startTimestamp > endTimestamp`

5. **Run all tests** to confirm they pass

## Assumptions

- No database schema changes required
- No code changes required — only adding tests
- `endTimestamp === startTimestamp` is valid (point-in-time events)
