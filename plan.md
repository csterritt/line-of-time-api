# Plan: Lens/Timeline Layout + Max-Date Behavior

## Assumptions
- No database schema changes are needed.
- "Lens creation" means clicking the Timeline panel add-lens action.
- Existing Playwright tests will be updated/extended for coverage.

## Answer
Update panel behavior so adding a Lens also creates a following Timeline, make Lens width one-quarter of the screen and remove its add-timeline "+" action, render min/max controls in a CSS grid with label/input spacing, and hide death/end rows beyond the current max date.

## Plan
1. Add/adjust E2E coverage first (Red) for:
   - Lens has no add-timeline button.
   - Adding a lens creates both a Lens and a trailing Timeline.
2. Update panel store logic so `addLensPanel()` appends Lens + Timeline in order.
3. Update `LensDisplay.vue`:
   - width to 1/4 screen.
   - remove add-timeline "+" button UI.
4. Update `TimelineDisplay.vue` filter controls into a grid layout and add explicit label/input spacing.
5. Ensure timeline end/death rows are not rendered when end timestamp is greater than applied max filter.
6. Run Red/Green iteration for affected tests, then run all tests in `e2e-tests` and `tests`.

## Pitfalls
- Removing lens "+" action can break any legacy test IDs/selectors.
- Adding two panels from one action can affect ordering assumptions.
- Filtering death/end rows only in UI must match expected max-date semantics.
