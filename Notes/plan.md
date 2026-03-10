# Plan: Replace date inputs in NewEventView.vue with separate year/month/day inputs

## Goal
Replace the single `type="date"` inputs for start and end dates in `NewEventView.vue`
with separate year/month/day text inputs, matching the pattern used in `TimelineDisplay.vue`.

## Assumptions
- Month and day are optional (can be left blank); year is required for start date
- End date (all three fields) remains fully optional
- The same `toTimestampWithDefaults` / `dateInputToTimestamp` utility pattern from
  `TimelineDisplay.vue` will be reused
- No database schema changes; only UI changes

## Pitfalls
- Tests currently call `fillInput(page, 'start-timestamp-input', '2026-06-15')` using
  the old single-input approach — these must be updated to fill year/month/day individually
- Tests that call `.inputValue()` on `start-timestamp-input` / `end-timestamp-input`
  must be updated to check individual year/month/day inputs
- Validation: start year is required; the form submit should be blocked if year is empty
  or invalid

## Steps
1. ✅ Write this plan
2. Add `DateInputs` type and helper functions (`parsePositiveInteger`,
   `toTimestampWithDefaults`, `splitDateString`) to `NewEventView.vue`
3. Replace `startTimestamp` / `endTimestamp` string refs with `startInputs` / `endInputs`
   object refs (year/month/day)
4. Split `getStartDate` / `getEndDate` to return `DateInputs` objects instead of strings
5. Update `handleSubmit` to build timestamp from year/month/day inputs
6. Update template: replace single date inputs with year/month/day fields
7. Update `04-new-event.spec.ts` tests to use new `start-year-input`, `start-month-input`,
   `start-day-input`, `end-year-input`, `end-month-input`, `end-day-input` test IDs
8. Run tests; fix any remaining failures
