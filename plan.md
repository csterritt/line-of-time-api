# Plan: NewEventView improvements + timestamp.ts fix

## Assumptions

- Wikipedia blocks iframes via `X-Frame-Options: DENY`, so we cannot embed the actual Wikipedia page in an iframe.
- The backend already fetches raw HTML from Wikipedia (`parsed.text['*']`) but converts it to plain text before returning. We will add a new `htmlText` field to the API response containing the raw HTML, and render it in the frontend.
- The `/search` route already reads `?name=` query param but does not auto-search. We will add auto-search on mount when the param is present.
- No existing FE e2e tests cover the search/new-event flow; we will add new ones.

## Files to Modify

| File | Change |
| --- | --- |
| `src/routes/time-info/initial-search.ts` | Add `htmlText` field (raw Wikipedia HTML) to the API response |
| `line-of-time-fe/src/stores/event-store.ts` | Add `htmlText` to `WikiInfo` type |
| `line-of-time-fe/src/components/NewEventView.vue` | (1) Replace "Wikipedia Text Preview" with "Wikipedia Page" rendering raw HTML, (2) reorder sections: Wikipedia Page first then Related Links, (3) remove height restriction on Wikipedia Page, (4) remove `textPreview`/`firstNWords` |
| `line-of-time-fe/src/components/SearchView.vue` | Auto-trigger search on mount when `?name=` query param is present |
| `line-of-time-fe/src/utils/timestamp.ts` | Remove `@ts-expect-error` by properly typing the array index access |
| `line-of-time-fe/e2e/vue.spec.ts` or new test file | Add e2e tests for the new behaviors |

## Implementation Steps

### Step 1: Backend — add `htmlText` to initial-search response
- In `initial-search.ts`, include the raw HTML (`parsed.text['*']`) as `htmlText` alongside the existing `text` field.

### Step 2: Frontend store — update WikiInfo type
- Add `htmlText: string` to the `WikiInfo` type in `event-store.ts`.

### Step 3: SearchView — auto-search when `?name=` is present
- In `SearchView.vue`, add an `onMounted` hook that checks `route.query.name`. If present, set `name.value` and call `handleSearch()` automatically.
- Clear `eventStore.wikiInfo` before searching so the page is fresh.

### Step 4: NewEventView — replace Wikipedia Text Preview with Wikipedia Page
- Remove `textPreview`, `firstNWords`, and `textPreviewWordLimit`.
- Replace the "Wikipedia Text Preview" `<div>` with a "Wikipedia Page" section that uses `v-html` to render `eventStore.wikiInfo.htmlText`.
- Scope Wikipedia HTML styles so they don't leak.

### Step 5: NewEventView — reorder and remove height restrictions
- Move "Wikipedia Page" section before "Related Links".
- Remove `h-[25vh]` from the Wikipedia Page container (let it fill remaining space).
- Keep `h-[25vh] overflow-y-auto` on Related Links for scrollability.

### Step 6: Fix timestamp.ts @ts-expect-error
- The `DAYS_IN_MONTH` array is `number[]`, so indexing returns `number | undefined`. Fix by asserting the return type or using a type-safe approach (e.g., non-null assertion since month is validated 1-12 by the caller).

### Step 7: Add/update e2e tests
- Test that clicking a related link triggers a search and lands on `/new-event`.
- Test that "Wikipedia Page" section renders HTML content (check for `wiki-page` testid).
- Test that the section order is correct (Wikipedia Page before Related Links).
- Verify existing tests still pass.

### Step 8: Run tests
- Start server: `npm run dev-open-sign-up`
- Run: `npx playwright test -x`
- Fix failures one at a time.

## Pitfalls

1. **Wikipedia iframe blocking** — Wikipedia sets `X-Frame-Options: DENY`; we use raw HTML via `v-html` instead.
2. **XSS risk with v-html** — The HTML comes from Wikipedia via our own backend, so it's trusted. We scope styles to avoid leaking.
3. **Wikipedia HTML links** — Internal wiki links in the HTML are relative (`/wiki/...`). They will be broken unless we rewrite them or open in new tabs. We should add a `<base>` target or post-process links.
4. **Auto-search race condition** — If the user navigates to `/search?name=X` while a search is already in progress, we should guard against double-submission.
5. **URL encoding** — Link text may contain special characters; `encodeURIComponent` is already used in the router-link `to` prop.
6. **Query param type** — `route.query.name` can be `string | string[]`; must handle both cases.
