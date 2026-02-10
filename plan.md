# Plan: Make Related Links in /ui/new-event clickable, redirecting to /ui/search with name pre-filled

## Assumptions

- Related links in the `wiki-links-list` section are plain text `<li>` items from `eventStore.wikiInfo.links`
- The search page (`SearchView.vue`) uses a local `ref('')` for the name field — we'll use a query param `?name=<text>` to pre-fill it
- Vue Router's `useRoute()` provides access to query params in SearchView
- Links should use `<router-link>` for SPA navigation (no full page reload)

## Files to Modify

| File | Change |
| --- | --- |
| `line-of-time-fe/src/components/NewEventView.vue` | Change each `<li>` in Related Links from plain text to a `<router-link>` pointing to `/search?name=<linkText>` |
| `line-of-time-fe/src/components/SearchView.vue` | On mount, read `route.query.name` and pre-fill the name input if present |
| `e2e-tests/general/04-new-event.spec.ts` | Add tests for related link behavior; update any affected existing tests |

## Implementation Steps

### Step 1: Update NewEventView.vue

- Change each `<li>` from `{{ link }}` to a `<router-link :to="'/search?name=' + encodeURIComponent(link)">{{ link }}</router-link>`
- Add `data-testid="related-link"` on each link element

### Step 2: Update SearchView.vue

- Import `useRoute` from `vue-router`
- On component setup, read `route.query.name` and initialize the `name` ref with it (if present)
- Also clear `eventStore.wikiInfo` so the search page is fresh

### Step 3: Add e2e tests

- **Related links are clickable**: verify `<a>` tags exist inside `wiki-links-list`
- **Clicking a related link navigates to search with name pre-filled**: click a related link, verify URL contains `/ui/search`, verify name input has the link text

### Step 4: Run tests

- Start server: `npm run dev-open-sign-up`
- Run: `npx playwright test e2e-tests/general/04-new-event.spec.ts -x`
- Fix failures one at a time

## Pitfalls

1. **URL encoding** — link text may contain special characters; must `encodeURIComponent` in the `to` prop
2. **Query param type** — `route.query.name` can be `string | string[]`; must handle both cases
3. **Existing "Search again" test** — currently checks that name input is empty after clicking "Search again"; this should still pass since "Search again" clears wikiInfo and navigates without a query param
4. **wikiInfo state** — when navigating from a related link, `wikiInfo` is still set from the previous search; must clear it so SearchView doesn't redirect to `/new-event`
