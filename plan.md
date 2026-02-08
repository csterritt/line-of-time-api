# Plan: Split /ui/new-event into /ui/search and /ui/new-event

## Assumptions

- The "Add New Event" heading stays on both pages.
- The event store already holds `wikiInfo` across navigation (Pinia store persists while the SPA is alive), so no extra persistence is needed.
- "Search again" clears all store state and redirects to `/search` with empty fields.
- The `Name` and `Reference URL` fields on `/ui/new-event` are rendered as read-only inputs (not plain text), preserving existing `data-testid` attributes.
- The `Create Event` button is enabled only when `basicDescription` is non-empty and `startTimestamp` is non-empty (HTML `required` attributes handle this via form validation).
- "1/4 of the visible page size" for Wikipedia Text Preview and Related Links means `height: 25vh` with `overflow-y: auto`.

## Files to Create / Modify

| File | Action |
|------|--------|
| `line-of-time-fe/src/components/SearchView.vue` | **Create** — search page |
| `line-of-time-fe/src/components/NewEventView.vue` | **Modify** — post-search event creation page |
| `line-of-time-fe/src/router/index.ts` | **Modify** — add `/search` route |
| `line-of-time-fe/src/components/HomeView.vue` | **Modify** — link to `/search` instead of `/new-event` |
| `e2e-tests/general/04-new-event.spec.ts` | **Modify** — update URLs and flow for split pages |

## Implementation Steps

### Step 1: Create `SearchView.vue`

- Title: "Add a New Event"
- `Name` input with `data-testid="name-input"`
- `Search Wikipedia` button with `data-testid="search-wikipedia-action"`
- Pressing Enter in the Name field triggers search (same as clicking button)
- On successful search: `router.push('/new-event')`
- On failure: show error message on this page
- Error message display (same pattern as current)

### Step 2: Refactor `NewEventView.vue`

- Guard: if `eventStore.wikiInfo` is null, redirect to `/search`
- `Name` input: read-only, value from store
- `Basic Description` textarea: editable, pre-filled from store
- `Start Date/Time` and `End Date/Time` inputs
- `Reference URL` input: read-only, value computed from store
- `Create Event` button (`data-testid="create-event-action"`)
- `Search again` button (`data-testid="search-again-action"`) — clears store, navigates to `/search`
- **Wikipedia Text Preview**: `data-testid="wiki-text-preview"`, `h-[25vh] overflow-y-auto`
- **Related Links**: `data-testid="wiki-links-list"`, `h-[25vh] overflow-y-auto`

### Step 3: Update router

- Add `{ path: '/search', component: SearchView }`
- Keep `{ path: '/new-event', component: NewEventView }`

### Step 4: Update HomeView link

- Change `RouterLink to="/new-event"` → `to="/search"`

### Step 5: Update e2e tests

Modify `04-new-event.spec.ts`:
- Tests that navigate to `/ui/new-event` for search should now go to `/ui/search`
- After search succeeds, verify redirect to `/ui/new-event`
- Verify Name and Reference URL are read-only on `/ui/new-event`
- Verify "Search again" button navigates back to `/ui/search` with empty fields
- Add test: pressing Enter in Name field on search page triggers search
- Add test: Wikipedia Text Preview and Related Links sections are scrollable (have correct sizing)
- Verify "Search again" button text (not "Search Wikipedia")

### Step 6: Run tests and fix

- `npx playwright test -x` — fix one failure at a time

## Pitfalls

1. **Pinia store lifetime** — Store state persists only within the SPA session. A hard refresh on `/ui/new-event` will lose `wikiInfo`, so the guard must redirect to `/search`.
2. **Enter key in search** — Must use `@keydown.enter` on the input or wrap in a `<form>` with `@submit.prevent`. Be careful not to trigger default form submission.
3. **Read-only vs disabled** — Use `readonly` attribute (not `disabled`) so the fields remain part of form submission and look normal but aren't editable.
4. **data-testid consistency** — The "Search again" button needs a new `data-testid="search-again-action"` (not reusing `search-wikipedia-action`) since it has different behavior.
5. **Error state across navigation** — Clear `errorMessage` when navigating between pages to avoid stale errors showing up.
6. **25vh scrollable sections** — If content is shorter than 25vh, the container shouldn't force empty space. Consider `max-h-[25vh]` instead of `h-[25vh]`... but the spec says "sized to be 1/4", so use `h-[25vh]` with overflow.
