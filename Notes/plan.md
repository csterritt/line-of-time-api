# Plan: Fix Broken E2E Tests

## Problem
All 9 failing tests are in `e2e-tests/general/10-timeline-filter.spec.ts`. They fail because filter controls (`filter-controls`, `filter-min-date`, `filter-max-date`, `reset-min-action`, `reset-max-action`) were removed from `HomeView.vue` during the panel refactoring.

## Solution
Restore filter controls to `TimelineDisplay.vue` so each timeline panel has its own filtering capability.

## Steps

### 1. Add Filter Controls to TimelineDisplay.vue
- Add local state for `filterStart` and `filterEnd` (initialized from `panel.startTimestamp` and `panel.endTimestamp`)
- Add date input controls with proper data-testid attributes
- Add reset buttons to restore original min/max dates
- Update event fetching to use filtered dates
- Ensure controls only show when signed in and events exist

### 2. Update Event Fetching Logic
- Fetch events using `filterStart` and `filterEnd` instead of panel timestamps directly
- Store original min/max from panel for reset functionality
- Watch for changes to filter inputs and refetch events

### 3. Run Tests
- Run `npx playwright test e2e-tests/general/10-timeline-filter.spec.ts`
- Verify all 9 tests pass
- Ensure no regressions in other tests

### 4. Notify User
- Run `/home/chris/notify-app Task Finished`

## Assumptions
- Filter controls should be per-panel, not global
- Each TimelinePanel manages its own filter state
- Tests expect specific data-testid attributes
- Seed data includes events from 1732-1969

## Pitfalls
- Must preserve exact data-testid names expected by tests
- Date format handling (year-only vs year-month based on range)
- Proper reactivity when filter dates change
- Reset buttons must restore to original panel timestamps, not global min/max
