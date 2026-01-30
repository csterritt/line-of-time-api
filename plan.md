# Plan: Implement POST /time-info/search Endpoint

## Assumptions

- Authentication is **not required** for the search endpoint (public, like GET /events)
- Search is **case-insensitive**
- Results ordered by `startTimestamp`
- Body limit is 4kb in production, so 1000-byte search is fine
- Whitespace-only queries are rejected
- SQL injection is prevented via Drizzle ORM parameterized queries

---

## The Answer

Create a new POST endpoint at `/time-info/search` that:
- Accepts JSON body with `search` string (1–1000 bytes, non-whitespace-only)
- Queries `event` table with case-insensitive `LIKE '%search%'` on `name`, `basicDescription`, `longerDescription`
- Returns up to 200 results with `id`, `name`, `basicDescription`, ordered by `startTimestamp`
- Returns empty array `[]` if no matches

---

## The Plan

### Step 1: Add TIME_INFO path constants to `src/constants.ts`

Add constants for all `/time-info/*` paths to centralize route definitions.

### Step 2: Create `src/routes/time-info/search.ts`

- New Hono router with POST `/` handler
- Validate `search` param: string, 1–1000 bytes, not whitespace-only
- Use Drizzle `like` + `or` + `sql` for case-insensitive search on three fields
- Limit 200 results, order by `startTimestamp`
- Return `{ id, name, basicDescription }[]`

### Step 3: Register search route in `src/index.ts`

- Import `searchRouter` from `./routes/time-info/search`
- Add `app.route('/time-info/search', searchRouter)` (use constant)
- Update existing route registrations to use constants

### Step 4: Update existing time-info routes to use constants

- Update `src/index.ts` route registrations to use `PATHS.TIME_INFO.*`

### Step 5: Update existing e2e-tests/time-info tests

- Replace hardcoded `BASE_URL` and `/time-info` strings with `BASE_URLS` from test-data
- Use `testWithDatabase` wrapper where appropriate
- Use `submitSignInForm` helper instead of manual form filling

### Step 6: Create `e2e-tests/time-info/06-search-events.spec.ts`

Test cases:
- Empty search returns 400
- Whitespace-only search returns 400
- Search > 1000 bytes returns 400
- Valid search returns matching results (case-insensitive)
- Partial matches work (LIKE behavior)
- No matches returns empty array
- Limit of 200 results enforced
- Results ordered by startTimestamp
- Does not require authentication

---

## Pitfalls

- **SQL injection** — Drizzle ORM parameterizes queries; `%` wildcards added in code, not concatenated raw
- **Byte vs character length** — Use `Buffer.byteLength(search)` for UTF-8 multi-byte chars
- **Case-insensitive LIKE** — SQLite LIKE is case-insensitive for ASCII; use `LOWER()` for full Unicode support
- **Empty/whitespace strings** — Must explicitly reject `""` and whitespace-only strings
- **Performance** — LIKE with leading `%` can't use indexes; acceptable for 200-result limit
