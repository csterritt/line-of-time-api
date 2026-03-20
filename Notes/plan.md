# BC/AD Date Support Plan

Add BC date support across the frontend UI (forms, filters, timeline display) while leveraging the backend's existing JDN-based BC support.

## Key Insight: No DB or Backend API Changes Needed

The backend already handles BC dates natively:
- JDN (Julian Day Number) timestamps work for all dates including BC
- `src/lib/timestamp.ts` already converts BC astronomical years to/from JDN
- `validateEventDates` already enforces `MIN_JDN = 38` (Jan 1, 4713 BC)
- Event API accepts/returns integer JDN timestamps — no change needed

All work is **frontend-only**.

---

## 1. Frontend Utility Updates (`line-of-time-fe/src/utils/timestamp.ts`)

- Add `isTimestampBC(jdn)` helper — returns true if astronomical year ≤ 0
- Update `timestampToYear` / `timestampToYearMonth` / `timestampToYmd` to handle BC years correctly (display as positive with BC indicator)
- Update `dateInputToTimestamp` to accept an historical year (only positive or negative, no year 0)

## 2. Timeline Filter Controls

**Files**: `useTimelineDisplay.ts`, `TimelineFilterControls.vue`

- Add `era: 'AD' | 'BC'` field to `FilterInputs` type
- Add DaisyUI **swap** component next to each year input (min and max), defaulting to AD
- Update `toTimestampWithDefaults` to convert `(displayYear, era)` → astronomical year before computing JDN
  - AD: astronomical year = displayYear
  - BC: astronomical year = 1 - displayYear (so 1 BC = 0, 2 BC = -1, etc.)
- Update `timestampToFilterInputs` to detect BC (year ≤ 0) and set era + positive display year accordingly
- Reject year 0 input (there is no year 0 in BC/AD)

## 3. New Event & Edit Event Forms

**Files**: `NewEventView.vue`, `EditEventView.vue`

- Add `era: 'AD' | 'BC'` to the `DateInputs` type
- Add DaisyUI **swap** component next to start year and end year inputs
- Update `dateInputsToTimestamp` in both files to convert `(displayYear, era)` → astronomical year
- Update `timestampToDateInputs` (EditEventView) / `splitDateString` (NewEventView) to detect BC and set era accordingly
- Reject year 0 input
- Year 1 BC displays as "1", with the swap showing "BC"

## 4. Timeline Display Styling

**File**: `TimelineDisplay.vue`

- Determine if a row's timestamp is BC (astronomical year ≤ 0)
- For BC date cells only: apply `bg-base-200 italic` (medium-light gray background + italics)
- Non-BC rows unchanged

## 5. Shared BC/AD Swap Component (optional extraction)

Since the swap appears in 3 places (filter min, filter max, event forms × 2), implement a small `BcAdSwap.vue` component:
- Props: `modelValue: 'AD' | 'BC'`
- Emits: `update:modelValue`
- Uses DaisyUI swap classes

---

## Test Plan (Red/Green TDD)

### Unit Tests — Write FIRST (Red), then implement (Green)

**`line-of-time-fe/src/tests/useTimelineDisplay.test.ts`** — add:
- `timestampToFilterInputs` for BC timestamps returns `era: 'BC'` and positive year
- `toTimestampWithDefaults` with `era: 'BC'` converts correctly
- `toTimestampWithDefaults` rejects year 0
- Filter bounds initialize correctly when events span BC–AD range
- `filteredEvents` works correctly with BC timestamps

**`line-of-time-fe/src/tests/timestamp.test.ts`** (new or extend):
- `isTimestampBC` returns true for BC JDNs, false for AD
- `timestampToYear` returns correct string for BC dates
- `dateInputToTimestamp` works with astronomical year 0 and negative years

**`tests/timestamp.test.ts`** (backend — already good, add if needed):
- Verify `validateEventDates` with BC startYear values

### E2E Tests (Playwright)

**New test file**: `e2e-tests/time-info/12-bc-dates.spec.ts`
- Create event with BC start date via API → verify JDN is correct
- Create event with BC start and end dates → verify ordering

**New test file**: `e2e-tests/admin/03-edit-event-bc.spec.ts`
- Edit existing event to BC date → verify swap shows BC, year shows positive
- Round-trip: edit to BC, save, reload → values preserved

**Modify existing**: `e2e-tests/admin/02-edit-event-ui.spec.ts`
- Verify BC/AD swap is visible on edit form

**Frontend E2E** (if applicable):
- Timeline filter: set min year to BC, verify events filter correctly
- Timeline display: verify BC date cells have gray bg + italics styling

---

## Pitfalls

- **Year 0 confusion**: Historical BC/AD has no year 0, but astronomical years do (year 0 = 1 BC). Must convert correctly at every boundary.
- **Leap year calculation for BC**: The backend `isLeapYear` already handles year ≤ 0 by adjusting. Frontend must use the same logic if validating days-in-month client-side.
- **Wikipedia date parsing**: `CategorizationResult` dates from AI (e.g., `"753-04-21"`) currently assume AD. BC dates from Wikipedia will need a convention (negative year or separate field) — this is a **follow-up** concern, not blocking this task.
- **Filter edge cases**: If user sets min filter to BC and max to AD, the range crosses year 0 boundary — timestamp math must work (it does, since JDN is continuous).

## Assumptions

- The DaisyUI swap component will show "AD" by default and toggle to "BC" on click
- The backend API contract (sending/receiving integer JDN timestamps) does not change
- No database migration is needed
- Wikipedia AI categorization BC date handling is deferred to a follow-up task
