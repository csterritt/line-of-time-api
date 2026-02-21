# Implementation Plan

## Goal
Refactor `initial-search.ts` to extract a `getWikipediaEvent` function, and create a CLI script that uses it.

## Steps

### 1. Refactor `src/routes/time-info/initial-search.ts`
- Extract all Wikipedia fetching + processing logic into a new exported function `getWikipediaEvent(name: string, env: Bindings, options: { useAi: boolean }): Promise<...>`
- The POST handler calls `getWikipediaEvent(name, c.env, { useAi: true })`
- `getWikipediaEvent` calls `aiCategorizationAndSearch` only when `options.useAi` is true; otherwise `categorization` is `null` (or omitted)
- Keep all existing types, helpers, and mock logic inside the file

### 2. Create `scripts/get-wikipedia-event.ts`
- Takes `name` from `process.argv[2]`
- Calls `getWikipediaEvent(name, ...)` with `useAi: false`
- Prints result to console as JSON
- Since scripts run outside Cloudflare Workers, `env.AI` is not available — pass a stub/null env (AI won't be called when `useAi: false`)

### 3. Tests
- Existing tests in `07-initial-search-utility-links.spec.ts` should continue to pass unchanged (POST endpoint behavior is identical)
- No new test file needed unless behavior changes — the refactor is internal

## Pitfalls
- The `Bindings` type requires `AI: Ai` — the script must handle the case where env is not a real Cloudflare env (safe since `useAi: false` skips AI)
- Mock data imports (`PRODUCTION:REMOVE`) must remain in `initial-search.ts` since they're used by the POST handler
- The script uses `bun` (consistent with other scripts in the `scripts/` directory)
