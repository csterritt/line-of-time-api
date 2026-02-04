# Plan: Fix Vue Router "No match found" issue

## Problem
Routes `/ui/` and `/ui/about` show no content. Console shows:
- `[Vue Router warn]: No match found with location with path "/"`
- `[Vue Router warn]: No match found with location with path "/about"`

## Root Cause
In `vite.config.ts`, `base: '/ui/'` is set. This means Vue Router's `createWebHistory(import.meta.env.BASE_URL)` uses `/ui/` as the base. When a user visits `/ui/about`, Vue Router internally strips the base and looks for a route matching `/about`.

However, `src/router/index.ts` defines routes as `/ui` and `/ui/about` — these will never match because the router already stripped `/ui/`.

## Fix
Change route paths in `src/router/index.ts`:
- `/ui` → `/`
- `/ui/about` → `/about`

## Steps
1. Edit `src/router/index.ts` to fix route paths
2. Check for any `<RouterLink>` or `router.push()` calls that hardcode `/ui/...` paths and update them
3. Rebuild and verify pages load correctly

## Pitfalls
- **Hardcoded links**: Any `<RouterLink to="/ui/about">` must become `<RouterLink to="/about">`
- **Future routes**: All new routes should omit the `/ui` prefix (the base handles it)
