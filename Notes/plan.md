# Plan: Timeline Date Inputs as Numeric Fields + Go

## Assumptions

- The change applies to both timeline filter date entries (min and max).
- No database schema changes are required.
- Existing timeline E2E tests are the primary regression safety net for this behavior.

## Answer

Replace each date picker with three numeric inputs (year, month, day) and a `Go` button, where `Enter` in any field applies that side’s filter, editing alone does not apply, and missing month/day default to January/1.

## Plan

1. Update timeline E2E tests first (Red) to reflect the new control layout and interactions.
2. Refactor `TimelineDisplay.vue` to hold per-side numeric input state (`year`, `month`, `day`) instead of date strings.
3. Add helper parsing/build functions to construct timestamps with defaults:
   - year only -> `year-01-01`
   - year + month -> `year-month-01`
4. Wire `Go` buttons and `Enter` key handling to apply filters; remove auto-apply on input edits.
5. Keep reset actions, timeline formatting, and fetch behavior consistent with existing behavior.
6. Run tests in Red/Green mode, then run all tests in `e2e-tests` and `tests`.

## Pitfalls

- Accidentally applying filters on every keystroke instead of explicit action.
- Not handling partial inputs correctly (year-only / year+month defaults).
- Breaking existing selectors and failing current E2E coverage.
- Invalid month/day values producing unexpected timestamps.
