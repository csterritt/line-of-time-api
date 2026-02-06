# Event List on Home Page + Redirect After Event Creation

## Goal
1. When signed in, `/ui/` shows a list of the first 20 events (ordered by `startTimestamp`).
2. After successfully creating an event, redirect back to `/ui/` instead of staying on the add page.

## Assumptions
- "First 20 events" = earliest 20 by `startTimestamp`. The API (`GET /time-info/events/:start/:end`) orders by `startTimestamp`. Use a wide range (0 to far-future) and slice to 20 client-side.
- Event list only shown when signed in.
- After redirect, the success message from event creation is still visible on the home page (stored in event-store).
- Each event in the list shows `name` and `basicDescription`.

## Files to Modify

1. **`line-of-time-fe/src/stores/event-store.ts`** — Add `events` state, `fetchEvents` action, and `EventResponse` type
2. **`line-of-time-fe/src/components/HomeView.vue`** — Display event list when signed in, show event-store success message
3. **`line-of-time-fe/src/components/NewEventView.vue`** — Navigate to `/` on successful creation instead of clearing form
4. **`e2e-tests/general/03-new-event.spec.ts`** — Update test for redirect after creation; add test for event list

## Implementation Steps

### 1. Update `event-store.ts`

- Add type `EventResponse` with fields: `id`, `name`, `basicDescription`, `startTimestamp`, `endTimestamp`, `referenceUrls`, `relatedEventIds`, `createdAt`, `updatedAt`
- Add state: `events` (ref, `EventResponse[]`, default `[]`)
- Add action: `fetchEvents()` — GETs `/time-info/events/0/99999999999`, slices result to first 20, stores in `events`
- Keep existing `createNewEvent`, `successMessage`, `errorMessage`, `clearMessages`

### 2. Update `NewEventView.vue`

- Import `useRouter` from `vue-router`
- On successful `createNewEvent`, call `router.push('/')` instead of clearing form fields
- Remove the success alert display (success message will show on HomeView)
- Keep the error alert display for failed submissions

### 3. Update `HomeView.vue`

- Import `useEventStore` and call `eventStore.fetchEvents()` via `onMounted` (only when signed in)
- Display `eventStore.successMessage` as a success alert with `data-testid="success-message"` (for post-creation feedback)
- Display event list in a table or card list below the welcome message and "Add a new event" button:
  - Each event row: `name`, `basicDescription`
  - Container: `data-testid="event-list"`
  - Each event item: `data-testid="event-item"`
- If no events, show "No events yet" with `data-testid="no-events-message"`
- Use `watch` on `userInfo.isSignedIn` to fetch events when sign-in state changes (since `fetchUserInfo` is async in AppLayout)

### 4. Update e2e tests (`e2e-tests/general/03-new-event.spec.ts`)

**Update Test 4 (successful creation):**
- After creating event, verify redirect to `/ui/` (not staying on form page)
- Verify `success-message` is visible on the home page
- Verify the newly created event appears in the event list

**Add Test: event list shows events when signed in**
- Sign in, seed events, navigate to `/ui/`
- Verify `event-list` is visible with event items

**Add Test: event list not shown when not signed in**
- Navigate to `/ui/` without signing in
- Verify `event-list` is NOT visible

### 5. Verify
- Run unit tests: `cd line-of-time-fe && npx vitest run`
- Start server: `npm run dev-open-sign-up`
- Run e2e tests: `npx playwright test e2e-tests/general/03-new-event.spec.ts -x`
- Run full suite: `npx playwright test -x`

## Pitfalls

1. **Timestamp range** — Using `0` to `99999999999` covers all reasonable events. The API requires both start and end as integers.
2. **Async timing** — `fetchUserInfo` in AppLayout is async. HomeView needs to `watch` for `isSignedIn` to become true before fetching events, not just check on mount.
3. **Success message persistence** — The event-store's `successMessage` persists across navigation since Pinia stores are global. Must clear it after displaying (e.g., on next `fetchEvents` or after a timeout).
4. **Redirect vs. form reset** — `router.push('/')` navigates within the Vue SPA, so the Pinia store state (including `successMessage`) is preserved.
5. **Event seeding for tests** — Use `seedEvents` from db-helpers if available, or create events via the API in the test setup.
