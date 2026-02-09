# Plan: Redesign HomeView event list to row-based layout with date column

## Assumptions

- `startTimestamp` is a day-number (days from year 1 AD), not a Unix timestamp — same system as `src/lib/timestamp.ts`
- The frontend needs its own `timestampToYmd` utility since no frontend timestamp formatting exists yet
- Seeded test events have known timestamps: Moon Landing (719163 → 1969-07-20), WWII (708249 → 1939-09-01), US Declaration (648856 → 1776-07-04)
- The existing `event-item` data-testid stays, but inner structure changes

## Files to Create

| File | Purpose |
| --- | --- |
| `line-of-time-fe/src/utils/timestamp.ts` | `timestampToYmd(timestamp: number): string` — converts day-number to `yyyy-mm-dd` |

## Files to Modify

| File | Change |
| --- | --- |
| `line-of-time-fe/src/components/HomeView.vue` | Replace card-based event list with row layout: date | vertical line | bold name + truncated description |
| `e2e-tests/general/04-new-event.spec.ts` | Update tests that check event list content to match new layout (date column, name, truncated description) |

## Implementation Steps

### Step 1: Create frontend timestamp utility

- Port the `timestampToComponents` logic from `src/lib/timestamp.ts` to `line-of-time-fe/src/utils/timestamp.ts`
- Export `timestampToYmd(timestamp: number): string` returning `yyyy-mm-dd`

### Step 2: Update HomeView.vue

- Import `timestampToYmd`
- Replace the `v-for` card layout with a row layout:
  - Each row: `[date] | [bold name] [truncated description]`
  - Date formatted as `yyyy-mm-dd`
  - Vertical divider between date and name/description
  - Description in a `div` with class `truncate` and `title` attribute set to full text
- Keep existing `data-testid="event-item"` on each row
- Add `data-testid="event-date"` on the date element
- Add `data-testid="event-name"` on the name element
- Add `data-testid="event-description"` on the description div

### Step 3: Update existing tests

- Test "event list shows seeded events when signed in" — add checks for date, name, and truncated description elements
- Test "successfully creating an event redirects to home with success message and event in list" — verify new layout structure

### Step 4: Add new tests

- Verify date column shows `yyyy-mm-dd` format for seeded events
- Verify name is bold
- Verify description has `truncate` class
- Verify description `title` attribute contains full text
- Verify vertical divider exists between date and name/description

### Step 5: Run tests

- Start server: `npm run dev-open-sign-up`
- Run: `npx playwright test e2e-tests/general/ -x`
- Fix failures one at a time

## Pitfalls

1. **Timestamp is day-number, not Unix** — must use the same leap-year-aware algorithm from `src/lib/timestamp.ts`, not `new Date()`
2. **Truncation depends on container width** — `truncate` class needs a constrained-width parent; ensure the flex layout constrains the description column
3. **Existing tests reference `event-list` text content** — the text now includes dates, so `toContain('Mercury')` should still work but verify
4. **Year formatting** — for years < 1000, need zero-padding to 4 digits for `yyyy-mm-dd` format
