# Update HomeView to Show User Welcome / Sign-In Message

## Goal
Replace the counter-based mock content in `HomeView.vue` with a dynamic welcome message based on the `user-info` Pinia store. Remove the counter store entirely.

## Assumptions
- The `user-info` store (`line-of-time-fe/src/stores/user-info.ts`) already exists and works
- The Vue app is served at `/ui/` by the Hono backend
- E2e tests use Playwright and run against `http://localhost:3000`
- The `KNOWN_USER` test user (name: `FredF`) can be signed in via the existing `submitSignInForm` helper
- The `/ui/` page needs `fetchUserInfo` called on mount to populate the store

## Files to Modify

1. **`line-of-time-fe/src/components/HomeView.vue`** — Replace counter content with user-info-based welcome/sign-in message
2. **`line-of-time-fe/src/stores/counter.ts`** — Delete this file

## Files to Create

1. **`e2e-tests/general/02-home-view.spec.ts`** — E2e tests for the `/ui/` home page

## Implementation Steps

### 1. Update `HomeView.vue`

- Remove `useCounterStore` import and usage
- Import `useUserInfoStore` and call `fetchUserInfo` via `onMounted`
- Show `"Welcome <name>"` (with `data-testid="welcome-message"`) when `isSignedIn` is true
- Show `"Sign in for more options"` (with `data-testid="sign-in-prompt"`) when `isSignedIn` is false
- Remove the count display, double count display, and increment button

### 2. Delete `counter.ts`

- Remove `line-of-time-fe/src/stores/counter.ts`

### 3. Create e2e tests (`e2e-tests/general/02-home-view.spec.ts`)

Tests should use the existing support helpers (`clearDatabase`, `seedDatabase`, `submitSignInForm`, etc.) and the `BASE_URLS`/`TEST_USERS` test data.

**Test 1: shows sign-in prompt when not signed in**
- Clear and seed database
- Navigate to `http://localhost:3000/ui/`
- Verify `data-testid="sign-in-prompt"` is visible with text "Sign in for more options"
- Verify `data-testid="welcome-message"` is NOT visible

**Test 2: shows welcome message when signed in**
- Clear and seed database
- Navigate to sign-in page, sign in as `KNOWN_USER`
- Navigate to `http://localhost:3000/ui/`
- Verify `data-testid="welcome-message"` is visible with text "Welcome FredF"
- Verify `data-testid="sign-in-prompt"` is NOT visible

### 4. Verify
- Run unit tests: `cd line-of-time-fe && npx vitest run`
- Start server: `npm run dev-open-sign-up`
- Run e2e tests: `npx playwright test e2e-tests/general/02-home-view.spec.ts`

## Pitfalls

1. **`fetchUserInfo` timing** — Must call `fetchUserInfo` in `onMounted` so the store is populated before rendering; use `v-if`/`v-else` on `isSignedIn` to handle the reactive update
2. **Cookie forwarding** — `fetch('/auth/user-signed-in')` from the Vue app must include credentials (same-origin cookies) so the backend sees the session; `fetch` defaults to `same-origin` credentials which should work since the Vue app is served from the same origin
3. **Counter store references** — Must ensure no other file imports `counter.ts` after deletion
4. **Test isolation** — E2e tests must clear/seed the database in `beforeEach` to avoid cross-test pollution
