# Plan: Rearrange TimelineDisplay.vue to 3-column layout

## Goal
Rearrange the event list in `TimelineDisplay.vue` from its current layout to a strict
3-column layout:
1. **Date column** — shows the timeline date (only on first row of a date group)
2. **Separator column** — an empty column with a left border (a thin vertical line)
3. **Content column** — shows event name + description (or death/end description)

## Assumptions
- The current `divider divider-horizontal` (DaisyUI) is replaced with a simple `div`
  that has a `border-l` class (TailwindCSS left border)
- All rows must stay properly aligned — the separator column must have consistent width
- No database schema changes; only UI/template changes

## Pitfalls
- The existing test `'vertical dividers exist for each timeline row'` checks for
  `.divider-horizontal` class — it must be updated to check the new separator element
  (using a `data-testid="timeline-separator"` attribute instead)
- The separator column should have a fixed width (e.g. `w-6`) so it doesn't collapse

## Steps
1. ✅ Write this plan
2. Plan tests: identify what the existing `09-event-list-layout.spec.ts` test needs updating
3. Update the test to use `data-testid="timeline-separator"` and check the new border class
4. Run tests (expect red on the separator test)
5. Update `TimelineDisplay.vue`: replace the `divider divider-horizontal` element with
   a `div` with `data-testid="timeline-separator"` and `border-l` styling
6. Run tests (expect green)
7. Run all tests; fix any failures
