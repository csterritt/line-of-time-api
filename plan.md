# Plan: Mock Wikipedia for Utility Link Filtering Tests

## Assumptions

- The `utilityLinkPattern` regex in `initial-search.ts` is already implemented and filters links like `Wikipedia:Help`, `Category:Foo`, `Template:Infobox`, `Portal:X`, etc.
- We follow the same mock pattern used for AI (module-level variable + test route to set/reset).
- The AI mock is already wired up; we continue to use it alongside the new wiki mock.
- Test fixture JSON files live in `test-data/pages/` and contain trimmed real Wikipedia API responses.

## Files to Create / Modify

| File | Action |
| --- | --- |
| `test-data/pages/george-washington-query.json` | **Create** — trimmed Wikipedia query API response |
| `test-data/pages/george-washington-parse.json` | **Create** — trimmed Wikipedia parse API response (15 normal + 24 utility links) |
| `src/routes/test/wiki-mock.ts` | **Create** — test route to set/reset wiki mock data (keyed by page name) |
| `src/routes/time-info/initial-search.ts` | **Modify** — check wiki mock before fetching from Wikipedia |
| `src/index.ts` | **Modify** — register wiki-mock test route |
| `e2e-tests/support/db-helpers.ts` | **Modify** — add `setWikiMock` / `resetWikiMock` helpers |
| `e2e-tests/time-info/07-initial-search-utility-links.spec.ts` | **Modify** — load fixture files and use wiki mock instead of live Wikipedia |

## Implementation Steps

### Step 1: Create test fixture files
- `test-data/pages/george-washington-query.json` — trimmed query response with extract
- `test-data/pages/george-washington-parse.json` — trimmed parse response with 15 normal links + 24 utility links (Wikipedia:, Template:, Help:, Category:, Portal:)

### Step 2: Create `src/routes/test/wiki-mock.ts`
- Module-level `Map<string, { query: object; parse: object }>` keyed by page name
- `POST /set` — accepts `{ name, query, parse }` and stores it
- `POST /reset` — clears all mocks
- Export `getWikiMockData(name)` for use in `initial-search.ts`

### Step 3: Modify `initial-search.ts`
- Import `getWikiMockData` (with `// PRODUCTION:REMOVE` annotation)
- Before each Wikipedia fetch, check if mock data exists for the requested name
- If mock data exists, use it instead of fetching

### Step 4: Register wiki-mock route in `index.ts`
- Import and mount at `/test/wiki-mock` inside the test routes guard

### Step 5: Add `setWikiMock` / `resetWikiMock` to `db-helpers.ts`

### Step 6: Update test `07-initial-search-utility-links.spec.ts`
- Load fixture JSON files from `test-data/pages/`
- In `beforeEach`: call `setWikiMock` with fixture data + `setAiMock`
- In `afterEach`: call `resetWikiMock` + `resetAiMock`
- Test verifies no returned link matches `utilityLinkPattern`
- Test verifies returned links include expected normal links
- Test verifies returned link count matches expected (15 normal, 0 utility)

### Step 7: Run tests, fix failures

## Pitfalls

1. **Fixture staleness** — The fixture data is a snapshot. If the Wikipedia API response shape changes, fixtures need updating. Unlikely since the MediaWiki API is stable.
2. **Mock leaking between tests** — Must `resetWikiMock()` in `afterEach`.
3. **Name matching** — The mock is keyed by the trimmed name from the request body. Must match exactly what the test sends.
4. **PRODUCTION:REMOVE annotations** — The wiki mock import and check in `initial-search.ts` must be annotated so they're stripped in production builds.
