# Plan: Fix Slow Timeline Page Load

## Assumptions
- No database schema changes are needed.
- The slowness is cumulative: each request in the load chain runs through the Better Auth middleware, which creates a new `betterAuth()` instance and does a `getSession()` DB lookup — even for static assets that never need auth.
- Individual requests appear fast, but 4-6 serial auth-checked requests compound to several seconds.

## Answer
The `setupBetterAuthMiddleware` in `src/routes/auth/better-auth-handler.ts` runs `createAuth()` + `auth.api.getSession()` on **every** request via `app.use('*', ...)`, including static asset requests (`/ui/assets/*`). Additionally, `/ui` redirects to `/ui/` causing an extra round trip through the middleware. Fixing these two issues eliminates the unnecessary auth overhead.

## Plan
1. Plan/update tests for the performance fix (Red/Green TDD).
2. Modify `setupBetterAuthMiddleware` to skip auth for static asset paths (`/ui/assets/*`).
3. Eliminate the `/ui` → `/ui/` redirect in `src/index.ts` — serve `index.html` directly for `/ui`.
4. Run all tests in `e2e-tests` and `tests` directories.

## Pitfalls
- Skipping auth middleware for asset paths must not inadvertently skip auth for API paths that need it.
- Removing the redirect must not break SPA routing (Vue Router uses `base: '/ui/'`).
- Any tests that depend on the redirect behavior may need updating.
