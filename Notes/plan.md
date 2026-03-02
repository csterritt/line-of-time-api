# Plan: Timeline Visibility + Lens Inheritance Fix

## Assumptions

- No database schema changes are needed.
- "Timeline display" and "filter controls" should be visible to all users (signed in or not).
- Only the "Add a new event" button should be gated by sign-in status.
- When creating a new lens from a parent lens, the child lens should only show events selected in the parent lens (not all events).

## Answer

1. Remove tests asserting filter controls are hidden for non-signed-in users (those tests are wrong per the new requirement).
2. If `TimelineDisplay.vue` or `HomeView.vue` hide filter controls based on sign-in, remove that gate.
3. Fix `panel-store.ts` `addLensPanel()` so new lens uses the last lens's selected events as its available events (not `firstLens`).
4. Run all tests and document failures in `Notes/Failed-Tests.md`.

## Plan

1. Remove sign-in-gated filter-control tests from:
   - `e2e-tests/general/10-timeline-filter.spec.ts` (test: 'filter controls do not appear when not signed in')
   - `e2e-tests/general/11-public-events.spec.ts` (test: 'filter controls not visible to non-signed-in users')
2. Fix `panel-store.ts`: In `addLensPanel()`, use the last lens in the structures as the parent lens, and populate the new lens's `eventMap` from that parent's selected `events` (not `firstLens.events`).
3. Run all tests and write `Notes/Failed-Tests.md`.

## Pitfalls

- Tests in `10-timeline-filter.spec.ts` asserting filter controls ARE visible (signed-in) should remain.
- The `panels.spec.ts` in `line-of-time-fe/e2e-tests/` has an outdated test expecting `add-timeline-panel-action` on the lens — that test needs updating too.
