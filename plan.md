# Plan: AI Categorization Display, Date Prefill, Redirect & Testing

## Assumptions

- The AI categorization result should be returned from the backend API and displayed on the frontend
- For e2e tests, we mock the AI at the server level via a test route (same pattern as SMTP mock), not via Playwright `page.route()`
- The "redirect" type means the Wikipedia page is a redirect; we follow the first link automatically
- The name display changes from `<input readonly>` to a styled `<div>` — existing tests checking `readonly` on name-input will need updating

## Files to Create / Modify

| File | Action |
| --- | --- |
| `src/lib/ai-search.ts` | **Modify** — return typed `CategorizationResult`, robust JSON parsing |
| `src/routes/time-info/initial-search.ts` | **Modify** — include `categorization` in API response |
| `src/routes/test/ai-mock.ts` | **Create** — test route to set/reset AI mock response |
| `src/index.ts` | **Modify** — register AI mock test route |
| `line-of-time-fe/src/stores/event-store.ts` | **Modify** — add `categorization` to `WikiInfo` type |
| `line-of-time-fe/src/components/NewEventView.vue` | **Modify** — name as div, type display, date prefill, redirect handling |
| `e2e-tests/support/db-helpers.ts` | **Modify** — add `setAiMock` / `resetAiMock` helpers |
| `e2e-tests/general/04-new-event.spec.ts` | **Modify** — update name-input readonly test, add categorization tests |

## Implementation Steps

### Step 1: Harden `aiCategorizationAndSearch`
- Define `CategorizationResult` discriminated union type
- Return `CategorizationResult` instead of `void`
- Parse AI response JSON robustly (strip markdown fences, handle `choices[0].message.content`, try/catch)
- Validate the parsed object matches one of the known shapes
- Fall back to `{ type: "other" }` on any failure

### Step 2: Update `initial-search.ts`
- Capture the return value of `aiCategorizationAndSearch`
- Include `categorization` field in the JSON response

### Step 3: Create AI mock test route
- `POST /test/ai-mock/set` — stores a mock categorization result in module-level variable
- `POST /test/ai-mock/reset` — clears the mock
- Export `getAiMockResult()` for use in `ai-search.ts`
- In `ai-search.ts`, check for mock before calling real AI

### Step 4: Register AI mock route in `index.ts`
- Import and mount under test routes guard

### Step 5: Update frontend `WikiInfo` type
- Add `categorization` field to `WikiInfo` in `event-store.ts`

### Step 6: Update `NewEventView.vue`
- Replace name `<input readonly>` with a styled `<div>` using same classes
- Add type display next to name: `Type: <<type>>`
- Prefill `startTimestamp` from `start-date` or `birth-date`
- Prefill `endTimestamp` from `end-date` or `death-date`
- If type is `redirect`, auto-navigate to `/search?name=<first link>`

### Step 7: Add e2e test helpers
- `setAiMock(categorization)` and `resetAiMock()` in `db-helpers.ts`

### Step 8: Update existing tests
- Test checking `name-input` `readonly` attribute → check it's a div with text content instead
- Test checking `name-input` `inputValue()` → use `textContent()` instead

### Step 9: Write new e2e tests
- **Person categorization**: mock returns person type, verify type displayed, birth/death dates prefilled
- **One-time event**: mock returns one-time-event, verify start date prefilled
- **Bounded event**: mock returns bounded-event, verify start/end dates prefilled
- **Redirect**: mock returns redirect type, verify auto-navigation to first link's search
- **Other/fallback**: mock returns other, verify no dates prefilled

### Step 10: Run tests, fix failures iteratively

## Pitfalls

1. **Existing tests break** — The name field changes from `<input>` to `<div>`, so any test using `.inputValue()` on `name-input` will fail. Must update to `.textContent()`.
2. **AI JSON parsing** — LLMs often wrap JSON in markdown fences or add reasoning text. Must strip these robustly.
3. **Redirect loops** — If a redirect page's first link also redirects, could loop. Should limit redirect depth or just do one level.
4. **Mock leaking between tests** — Must `resetAiMock()` in `afterEach` to avoid test pollution.
5. **Date format** — AI returns `YYYY-MM-DD` which matches HTML date input format, but must verify this works with the existing date-to-timestamp logic.
6. **Race condition on redirect** — The redirect navigation happens in `onMounted`; must ensure `wikiInfo` and `categorization` are set before the component mounts.
