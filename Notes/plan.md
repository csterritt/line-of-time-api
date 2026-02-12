# Plan: Fix flash messages not showing on /ui routes

## Problem

After changing the post-sign-in redirect from `/private` (server-rendered) to `/ui` (Vue SPA),
flash messages like "Welcome! You have been signed in successfully." no longer appear.

**Root cause**: The server sets `MESSAGE_FOUND` and `ERROR_FOUND` as httpOnly cookies via
`redirectWithMessage()`. The old `/private` route was server-rendered by `useLayout()`, which
read these cookies server-side and rendered alert divs. The `/ui` route serves a static Vue SPA
HTML file without reading cookies, and since cookies are httpOnly, the Vue client-side JS can't
read them either.

## Assumptions

- The redirect changes from `/private` to `/ui` are correct and should stay
- Flash messages must be visible on the `/ui` page after redirect
- The `verifyAlert` calls were incorrectly removed from tests — they should be restored

## Pitfalls

- Cookies are httpOnly, so the fix must be server-side (inject into HTML before serving)
- The CSP sandbox includes `allow-scripts` only in `ALLOW_SCRIPTS_SECURE_HEADERS`, need to
  ensure the injected script is allowed
- Must clear the cookies after reading them (one-time flash behavior)
- The injected script hash must match CSP if script-src is restricted

## Plan

### Server-side fix (src/index.ts)

1. In the `/ui/*` catch-all handler, read `MESSAGE_FOUND` and `ERROR_FOUND` cookies from the request
2. If either cookie is present, inject a `<script>` tag into the HTML that sets
   `window.__FLASH_MESSAGE__` and/or `window.__FLASH_ERROR__`
3. Clear the cookies by setting them to empty with immediate expiry in the response
4. Serve the modified HTML

### Vue SPA fix (line-of-time-fe)

5. In `App.vue`, read `window.__FLASH_MESSAGE__` and `window.__FLASH_ERROR__` on mount
6. Pass them as props to `AppLayout`
7. Clear the window globals after reading (so they don't persist on SPA navigation)

### Test fixes

8. Restore `verifyAlert` calls that were removed from tests:
   - `e2e-tests/sign-in/02-can-sign-in-with-known-email.spec.ts`
   - `e2e-tests/sign-in/05-sign-out-successfully.spec.ts`
   - `e2e-tests/sign-up/04-can-validate-email.spec.ts`
   - `e2e-tests/sign-up/06-can-resend-verification-email.spec.ts`
   - `e2e-tests/reset-password/03-complete-password-reset-flow.spec.ts`
   - `e2e-tests/profile/02-can-change-password.spec.ts`
   - `e2e-tests/support/workflow-helpers.ts`

### Verify

9. Start server with `npm run dev-open-sign-up`
10. Run `npx playwright test -x` and fix failures one at a time
