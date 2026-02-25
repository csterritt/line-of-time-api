# Plan: Restore Timeline Filters and Stabilize E2E

## Assumptions
- The failing behavior is in the timeline filter UI and panel-level event fetching.
- Existing Playwright tests in `e2e-tests/general/10-timeline-filter.spec.ts` define expected behavior.
- No database schema changes are needed.

## Answer
Implement per-panel date filter controls in the timeline component, wire those controls to fetch filtered events, preserve reset behavior, and validate using Playwright with Red/Green iteration.

## Plan
1. Add timeline filter UI controls (`filter-controls`, min/max date inputs, reset actions) to `TimelineDisplay.vue`.
2. Track panel-local filter state initialized from panel start/end timestamps.
3. Fetch events using the current filter range instead of raw panel timestamps.
4. Ensure date formatting mode (year vs year-month) derives from the active filtered range.
5. Run targeted Playwright tests with `-x`, fix failures one at a time, and apply related fixes broadly where appropriate.

## Pitfalls
- `data-testid` values must exactly match the Playwright selectors.
- Date input conversion can silently produce wrong ranges if parsing/format assumptions drift.
- Reset actions must restore original panel min/max, not the latest edited values.
- Filters should only render for signed-in users with timeline data to satisfy visibility tests.

## Test Plan (Red/Green TDD)
- Red: Run `npx playwright test e2e-tests/general/10-timeline-filter.spec.ts -x` and observe first failure.
- Green: Implement minimal fix for that failure, rerun same command.
- Repeat until the timeline filter spec passes.
- Optionally run adjacent timeline/home specs if needed for regression confidence.

## Reboot Handoff Notes

### Current Status
- Timeline filter implementation is done in `line-of-time-fe/src/components/TimelineDisplay.vue`.
- Added per-panel filter state + controls and wired filtering/reset behavior.
- Added required test selectors:
  - `filter-controls`
  - `filter-min-date`
  - `filter-max-date`
  - `reset-min-action`
  - `reset-max-action`
- Updated event fetch to use date-input-derived filter range.
- Updated year vs year-month formatting to use active filtered range.

### Validation Attempt Result
- Server command used: `npm run dev-open-sign-up`
- Test command used: `npx playwright test e2e-tests/general/10-timeline-filter.spec.ts -x`
- Blocking issue: Playwright browser binary missing.
  - Error requested: `npx playwright install`

### First Steps After Reboot
1. Start server:
   - `npm run dev-open-sign-up`
2. Run the target spec in Red/Green mode:
   - `npx playwright test e2e-tests/general/10-timeline-filter.spec.ts -x`
3. If a test fails, apply minimal fix and rerun step 3 until green.

### If/When Tests Turn Green
1. (Optional confidence pass) run nearby specs as needed.
2. Send completion notification:
   - Preferred: `/home/chris/notify-app Task Finished`
   - Fallback: `/Users/chris/bin/notify-app Task Finished`

### Guardrails
- Do **not** propose DB schema changes without explicit permission.
- Keep fixes minimal and targeted to timeline filter behavior.
