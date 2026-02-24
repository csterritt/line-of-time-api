# Plan: Extracting TimelineDisplay.vue

## Assumptions
- We are working in `line-of-time-fe/src/components/`.
- `HomeView.vue` currently contains the timeline display logic (lines 217-250) and computed properties/types for `timelineRows`, `TimelineEntry`, and `TimelineRow` (lines 75-128).
- `TimelineDisplay.vue` will need to accept `events` as a prop and handle its own computed properties for displaying the timeline rows.
- The `formatEventDate` function and `rangeIsMoreThanOneYear` computed property might need to be passed down or recreated in `TimelineDisplay.vue`, but since `eventStore` is accessible globally, `TimelineDisplay.vue` can just use `useEventStore()` directly.

## The Plan
1. **Create `TimelineDisplay.vue`**:
   - Move lines 217-250 from `HomeView.vue` to `TimelineDisplay.vue`.
   - Move the `TimelineEntry`, `TimelineRow`, `timelineRows`, `endDescription`, `formatEventDate`, and `rangeIsMoreThanOneYear` logic into `TimelineDisplay.vue`.
   - Update `TimelineDisplay.vue` to use `useEventStore()`.

2. **Update `HomeView.vue`**:
   - Import `TimelineDisplay` and use it in place of the old timeline HTML.
   - Remove the extracted types, computed properties, and helper functions from `HomeView.vue` to clean it up.

3. **E2E Tests**:
   - Check existing tests to see if they rely on the structure of the timeline in `HomeView.vue` (e.g., `data-testid="event-list"`, `data-testid="timeline-row"`).
   - Ensure these `data-testid` attributes are preserved in `TimelineDisplay.vue` so existing tests don't break.
   - Run tests using `npx playwright test` to ensure everything is still green.

4. **Verify**:
   - Start the server with `npm run dev-open-sign-up`.
   - Visually confirm the timeline looks and behaves exactly as before.

## Pitfalls
- **Props vs Store**: Since `HomeView.vue` relies heavily on `useEventStore()`, moving the logic to `TimelineDisplay.vue` might make it tightly coupled to the store. If `TimelineDisplay.vue` is meant to be a purely presentational component, it should take `events`, `filterStart`, and `filterEnd` as props instead of accessing the store directly. I will use the prop approach to make it more reusable, passing `eventStore.events`, `eventStore.filterStart`, and `eventStore.filterEnd` as props.
- **Breaking Tests**: The e2e tests might fail if `data-testid` attributes are lost or if the DOM structure changes slightly. I must copy the HTML exactly.
