# Replace About Button with Sign In / Sign Out in AppLayout Navbar

## Goal
Remove the "About" button from the Vue app navbar and replace it with a conditional "Sign In" / "Sign Out" button matching the behavior in `build-layout.tsx`. The button should link to `/auth/sign-in` when not signed in, and POST to `/auth/sign-out` when signed in.

## Assumptions
- The `user-info` store already provides `isSignedIn`, `name`, and `fetchUserInfo`
- Sign-in is at `/auth/sign-in` (from `PATHS.AUTH.SIGN_IN`)
- Sign-out is at `/auth/sign-out` via POST (from `build-layout.tsx`)
- After sign-out, the user should be redirected (the server handles the redirect on POST to `/auth/sign-out`)
- The About page and route can remain — we're only removing the navbar link to it
- `AppLayout.vue` needs access to the `user-info` store, so `fetchUserInfo` should be called there (on mount) rather than in `HomeView.vue`, to avoid duplicate calls

## Files to Modify

1. **`line-of-time-fe/src/components/AppLayout.vue`** — Remove About link, add Sign In / Sign Out button using user-info store
2. **`line-of-time-fe/src/components/HomeView.vue`** — Remove `onMounted` / `fetchUserInfo` call (moved to AppLayout)
3. **`e2e-tests/general/02-home-view.spec.ts`** — Expand with tests for Sign In / Sign Out button behavior

## Implementation Steps

### 1. Update `AppLayout.vue`

- Import `onMounted` from `vue` and `useUserInfoStore` from `@/stores/user-info`
- Call `fetchUserInfo` in `onMounted`
- Remove the About `RouterLink` from `navbar-end`
- When `userInfo.isSignedIn` is false: show `<a href="/auth/sign-in">` with `class="btn btn-primary"` and `data-testid="sign-in-action"`, text "Sign in"
- When `userInfo.isSignedIn` is true: show a `<form method="post" action="/auth/sign-out">` with a `<button>` with `class="btn btn-outline btn-sm"` and `data-testid="sign-out-action"`, text "Sign out"

### 2. Update `HomeView.vue`

- Remove `import { onMounted } from 'vue'`
- Remove the `onMounted(() => { userInfo.fetchUserInfo() })` block
- Keep the `useUserInfoStore` import and usage for the welcome/sign-in-prompt display (the store is now populated by AppLayout)

### 3. Update e2e tests (`e2e-tests/general/02-home-view.spec.ts`)

Add/modify tests:

**Test 1 (existing, update): shows sign-in prompt and Sign In button when not signed in**
- Navigate to `/ui/`
- Verify `sign-in-prompt` text visible
- Verify `sign-in-action` button visible
- Verify `sign-out-action` NOT visible

**Test 2 (existing, update): shows welcome message and Sign Out button when signed in**
- Sign in as KNOWN_USER via `/auth/sign-in`
- Navigate to `/ui/`
- Verify `welcome-message` visible with "Welcome FredF"
- Verify `sign-out-action` button visible
- Verify `sign-in-action` NOT visible

**Test 3 (new): clicking Sign In navigates to sign-in page**
- Navigate to `/ui/`
- Click `sign-in-action`
- Verify on sign-in page (use `verifyOnSignInPage`)

**Test 4 (new): full sign-in flow from /ui/ shows welcome and Sign Out**
- Navigate to `/ui/`
- Click `sign-in-action` to go to sign-in page
- Sign in as KNOWN_USER
- Navigate back to `/ui/`
- Verify `welcome-message` contains "Welcome FredF"
- Verify `sign-out-action` visible

### 4. Verify
- Run unit tests: `cd line-of-time-fe && npx vitest run`
- Start server: `npm run dev-open-sign-up`
- Run e2e tests: `npx playwright test e2e-tests/general/02-home-view.spec.ts -x`

## Pitfalls

1. **Sign-out mechanism** — `build-layout.tsx` uses `<form method="post" action="/auth/sign-out">`. The Vue app should do the same — a real form POST, not a fetch call — so the server can handle the redirect properly.
2. **fetchUserInfo location** — Moving `fetchUserInfo` from `HomeView` to `AppLayout` ensures it runs on every page, not just the home page. This is needed so the navbar always reflects sign-in state.
3. **About route** — We're only removing the navbar link; the `/about` route and `AboutView.vue` component remain in place.
4. **data-testid consistency** — Must use `sign-in-action` and `sign-out-action` to match the existing `build-layout.tsx` test IDs.
