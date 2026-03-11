# Plan: Connector Line & Lane Assignment Changes

## Assumptions
1. "Units" for separator width = Tailwind px (w-5=20px, w-6=24px). Code already has `w-6` and `separatorWidth=24` — appears already done.
2. "Four units wide instead of two" = `stroke-width="4"` instead of `stroke-width="2"`.
3. No database schema changes needed — all work is front-end in `TimelineDisplay.vue`.
4. Lane assignment replaces current `computeOverlapOffsets` with proper first-available-lane algorithm.

## Steps
1. Change `stroke-width` from `"2"` to `"4"` on connector `<line>` elements.
2. Confirm separator column is already at 24 (`w-6` class + `separatorWidth = 24` constant).
3. Replace `computeOverlapOffsets` with a lane-assignment algorithm:
   - Process connectors sorted by `startRowIndex`.
   - Track active lanes (each lane holds the `endRowIndex` of its current occupant).
   - Assign new connectors to the first lane whose previous occupant has ended (`endRowIndex <= startRowIndex`).
   - If no lane is free, allocate a new lane.
   - When all lanes would exceed the separator width, allow overlap (clamped via existing `Math.max(xOffset, 4)`).
4. Add e2e test asserting `stroke-width="4"` on connector lines.
5. Run all tests (`tests/` via `bun test`, `e2e-tests/` via `npx playwright test`) and fix any failures.
6. Notify via `/home/chris/notify-app`.

## Pitfalls
- Current seed data has 2 connectors (George Washington & WWII) that don't overlap, so lane reuse won't be directly visible in e2e tests. The algorithm still needs to be correct for future overlapping cases.
- The `offsetStep` (5px) and `separatorWidth` (24px) allow ~4 lanes before clamping kicks in.
- Existing connector count tests (6 lines total, 3 after filter) should pass unchanged since the lane algorithm doesn't change which connectors are drawn.
