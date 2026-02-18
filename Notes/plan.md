# Plan: Timeline Filter Controls and Date Display

## Feature Description

Add min/max timestamp filter controls to the `/ui/` timeline page, and change the date display
format based on the range width.

## Assumptions

- Timestamps are integer day-offsets (same units as `startTimestamp`/`endTimestamp` in events)
- "More than 1 year apart" means the range spans > 365 days
- The date picker controls use HTML `<input type="date">` (simple date, no time)
- The min/max of the timeline is derived from the min `startTimestamp` and max `startTimestamp`
  (or `endTimestamp` if present) across all events
- When no events exist, the filter controls are hidden or disabled
- The filter reloads the event list from the API using the chosen range

## Tasks (in order)

1. **Add `timestampToYear` and `timestampToYearMonth` helpers** to
   `line-of-time-fe/src/utils/timestamp.ts`
   - `timestampToYear(ts)` → `"YYYY"` string
   - `timestampToYearMonth(ts)` → `"YYYY-MM"` string
   - `timestampToDateInput(ts)` → `"YYYY-MM-DD"` string (for date input value)
   - `dateInputToTimestamp(dateStr)` → number (inverse of above)

2. **Update event-store** (`line-of-time-fe/src/stores/event-store.ts`)
   - Change `fetchEvents()` to accept optional `start` and `end` timestamp params
   - Add `minTimestamp` and `maxTimestamp` refs (the overall min/max of all events)
   - Add `fetchAllEventsRange()` to fetch the full range (used to determine min/max)
   - Track `filterStart` and `filterEnd` refs (current filter values)

3. **Update HomeView** (`line-of-time-fe/src/components/HomeView.vue`)
   - Add filter controls at the top of the events section:
     - Min date picker (`<input type="date">`) with reset button
     - Max date picker (`<input type="date">`) with reset button
   - When filter changes, call `fetchEvents(filterStart, filterEnd)`
   - Reset buttons restore to the overall min/max timestamps
   - Compute `rangeIsMoreThanOneYear` from `filterStart` and `filterEnd`
   - Display event dates:
     - If range > 1 year: show only start year (and end year if present)
     - If range ≤ 1 year: show start year-month (and end year-month if present)

4. **Update existing e2e tests** (`e2e-tests/general/09-event-list-layout.spec.ts`)
   - Tests that check for `yyyy-mm-dd` format need updating since format now depends on range
   - Update to account for the new conditional display

5. **Write new e2e tests** (`e2e-tests/general/10-timeline-filter.spec.ts`)
   - Filter controls appear when signed in with events
   - Min/max date pickers start with the correct values
   - Changing min date filters the event list
   - Changing max date filters the event list
   - Reset min button restores to original min
   - Reset max button restores to original max
   - Date display shows year-only when range > 1 year
   - Date display shows year-month when range ≤ 1 year

6. **Start server** with `npm run dev-open-sign-up`

7. **Run tests** with `npx playwright test -x` and fix failures one at a time
