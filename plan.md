# Plan: Fix timezone bug in ISO-to-timestamp conversion

## Problem

`new Date('2023-01-15')` parses as UTC midnight. But `getFullYear()`, `getMonth()`, `getDate()` return **local** time components. On a UTC box (Sprite) this gives Jan 15; on an EST box (Mac) it gives Jan 14 — off by one day.

## Assumptions

- The intent is that the date string represents a calendar date, and timezone should not shift it
- No tests need to change — the server code is what's wrong

## Files to Modify

| File | Change |
| --- | --- |
| `src/routes/time-info/new-event.ts` | `getFullYear` → `getUTCFullYear`, `getMonth` → `getUTCMonth`, `getDate` → `getUTCDate` |
| `src/routes/time-info/event.ts` | Same changes in the PUT handler |

## Implementation Steps

### Step 1: Fix `new-event.ts`

- Line 40: `getFullYear()` → `getUTCFullYear()`
- Line 41: `getMonth()` → `getUTCMonth()`
- Line 42: `getDate()` → `getUTCDate()`
- Lines 49–51: same three changes for `endTimestamp`

### Step 2: Fix `event.ts`

- Lines 59–61: same three changes for `startTimestamp`
- Lines 68–70: same three changes for `endTimestamp`

### Step 3: Run tests

- Start server: `npm run dev-open-sign-up`
- Run: `npx playwright test e2e-tests/time-info/ -x`
- Verify all pass

## Pitfalls

1. **Only affects date-only ISO strings** — `new Date('2023-01-15T10:00')` is parsed as local time, so the UI's `datetime-local` input already works. But date-only strings like `'2023-01-15'` are parsed as UTC per the spec, causing the mismatch.
2. **Both routes need the fix** — `event.ts` (PUT) has the same pattern as `new-event.ts` (POST).
3. **Don't change the tests** — the tests are correct; the server must produce consistent results regardless of timezone.
