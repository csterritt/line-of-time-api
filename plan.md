# Plan: Wikipedia-Powered "Add Event" Page (Server-Side Search)

## Assumptions

- The user can re-search by editing the name and clicking "Search Wikipedia" again.
- The `MAX_BASIC_DESCRIPTION_LENGTH` (1000 chars) from `event-validator.ts` is the limit for trimming the extract.
- "First N words under the max length" = split plain-text extract into words, accumulate until adding the next word would exceed 1000 chars.
- The 500-word text preview and links list are shown **below** the form, not inside it.
- The Wikipedia `referenceUrl` will be auto-filled as `https://en.wikipedia.org/wiki/<<name>>`.
- `html-to-text` (already in backend `package.json`) is used server-side for HTML→text conversion.
- The new endpoint does NOT require sign-in (matches `searchRouter` pattern — no `signedInAccess` middleware).

## Files to Create / Modify

| File | Change |
|------|--------|
| `src/constants.ts` | Add `INITIAL_SEARCH` to `PATHS.TIME_INFO` |
| `src/routes/time-info/initial-search.ts` *(new)* | New Hono router: fetches Wikipedia, converts with `html-to-text`, returns cleaned result |
| `src/index.ts` | Import and mount `initialSearchRouter` at `PATHS.TIME_INFO.INITIAL_SEARCH` |
| `line-of-time-fe/src/stores/event-store.ts` | Add `WikiInfo` type, `getInfo()` action calling the new backend endpoint, `wikiInfo`/`wikiLoading` state |
| `line-of-time-fe/src/components/NewEventView.vue` | Two-phase UI: search-only → expanded form; display text preview + links |

## Implementation Steps

### Step 1: Add path constant

In `src/constants.ts`, add to `PATHS.TIME_INFO`:
```ts
INITIAL_SEARCH: '/time-info/initial-search',
```

### Step 2: Create `src/routes/time-info/initial-search.ts`

New Hono router with a single `POST /` handler:

1. Parse JSON body `{ name: string }`. Validate: must be a non-empty, non-whitespace-only string.
2. **GET 1** — `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&titles=${encodeURIComponent(name)}`
   - If `pages` has key `"-1"` → return `{ error: 'Nothing found for that name' }` with 404.
   - Otherwise extract `title` and `extract` from the first page entry.
3. **GET 2** — `https://en.wikipedia.org/w/api.php?action=parse&format=json&prop=text|links&page=${encodeURIComponent(name)}`
   - If `error` key present → return 404 (shouldn't happen if GET 1 succeeded).
   - Extract `parse.links` (map each to its `"*"` field), `parse.text["*"]`.
4. **Convert HTML→text** using `html-to-text`'s `convert()` on: `title`, `extract`, `text["*"]`, and each link `"*"` value.
5. **Trim extract** to first N words that keep it under `MAX_BASIC_DESCRIPTION_LENGTH` (1000 chars).
6. Return JSON:
   ```json
   {
     "name": "<<converted title>>",
     "extract": "<<converted + trimmed extract>>",
     "text": "<<converted text>>",
     "links": ["<<converted link 1>>", "<<converted link 2>>", ...]
   }
   ```

### Step 3: Mount the router in `src/index.ts`

- Import `initialSearchRouter` from `./routes/time-info/initial-search`
- Add `app.route(PATHS.TIME_INFO.INITIAL_SEARCH, initialSearchRouter)` alongside the other time-info routes.

### Step 4: Update `event-store.ts` (frontend)

- Add type:
  ```ts
  type WikiInfo = {
    name: string
    extract: string
    text: string
    links: string[]
  }
  ```
- Add state: `wikiInfo` (`ref<WikiInfo | null>`, default `null`), `wikiLoading` (`ref<boolean>`, default `false`)
- Add action `getInfo(name: string): Promise<WikiInfo | null>`:
  1. Set `wikiLoading = true`, clear messages.
  2. POST to `/time-info/initial-search` with `{ name }`.
  3. On non-OK response: set `errorMessage` from response JSON `error` field, return `null`.
  4. On success: parse response as `WikiInfo`, store in `wikiInfo`, return it.
  5. Always set `wikiLoading = false` in finally block.
- Export `wikiInfo`, `wikiLoading`, `getInfo`.

### Step 5: Update `NewEventView.vue`

**Phase 1 — Search only (initial state):**
- Show only the Name input field.
- Button text: "Search Wikipedia" (`data-testid="search-wikipedia-action"`).
- Button disabled unless name is non-empty and non-whitespace-only.
- On click: call `eventStore.getInfo(name.value)`.
- Show loading indicator while `eventStore.wikiLoading` is true.
- On failure: show error message ("Nothing found").

**Phase 2 — Expanded form (after successful search):**
- Track `infoLoaded` (boolean ref, set to `true` when `getInfo` succeeds).
- Auto-fill `name` with `wikiInfo.name`, `basicDescription` with `wikiInfo.extract`.
- Show all existing form fields (basicDescription, startTimestamp, endTimestamp, referenceUrl).
- Button changes to "Create Event" (`data-testid="create-event-action"`).
- Below the form, show:
  - **Text preview**: first 500 words of `wikiInfo.text` in a bordered container (`data-testid="wiki-text-preview"`).
  - **Links list**: `wikiInfo.links` as a `<ul>` (`data-testid="wiki-links-list"`).
- User can still edit the name and re-click "Search Wikipedia" to search again (resets to phase 1 flow).

### Step 6: Update e2e tests

- Update existing new-event tests to account for the two-phase flow.
- Add test: search for a known Wikipedia term, verify form expands with pre-filled fields.
- Add test: search for gibberish, verify "nothing found" error message.

### Step 7: Verify

- `npm run dev-open-sign-up` and manually test.
- `npx playwright test -x`

## Pitfalls

1. **Wikipedia API response shape** — The page ID under `pages` is dynamic (e.g., `"19007"`). Must use `Object.keys()` / `Object.values()` to find the page entry. Check for `"-1"` key specifically for "not found".
2. **Extract trimming edge case** — If even the first word exceeds the max length, return it truncated.
3. **Race conditions** — If the user searches twice quickly, disable the button during loading to prevent overlapping requests.
4. **Large link lists** — Some Wikipedia pages have hundreds of links. Consider a scrollable container or cap.
5. **`html-to-text` import** — The package exports `convert()`. Usage: `import { convert } from 'html-to-text'`. Verify it works in the Hono/Wrangler runtime (it's pure JS, should be fine).
6. **Server-side fetch** — Hono on Wrangler has global `fetch`. If running locally with Node, ensure `fetch` is available (Node 18+ has it globally).
7. **`encodeURIComponent`** — Names with special characters must be encoded in the Wikipedia URLs.
8. **Error propagation** — If Wikipedia is down or slow, the backend should return a clear error to the frontend, not hang.
