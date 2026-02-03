# SPA Route Setup for /ui/*

## Goal
Serve all routes under `/ui/*` with `./public/ui/index.html` (SPA), while keeping all other routes as server-rendered HTML.

## Assumptions
- `./public/ui/index.html` exists
- Cloudflare Workers asset binding (`ASSETS`) is already configured in wrangler.jsonc
- Existing HTML routes (sign-in, sign-up, profile, etc.) remain unchanged

---

## The Answer
Add a `/ui/*` catch-all route in the Hono app that intercepts all SPA paths and serves `index.html` via the `ASSETS` binding. Static assets within `/ui/` (JS, CSS, images) will still be served by Cloudflare's asset handling since `run_worker_first: false`.

---

## The Plan

### Option B (Preferred - Minimal Change)

1. **Add `/ui/*` catch-all route** in `src/index.ts` before the 404 handler:
   ```ts
   // SPA catch-all: serve /ui/index.html for all /ui/* routes
   app.get('/ui/*', async (c) => {
     const asset = await c.env.ASSETS.fetch(new Request('https://dummy/ui/index.html'))
     return new Response(asset.body, {
       headers: { 'Content-Type': 'text/html' },
     })
   })
   ```

2. **Verify `ASSETS` binding** in `src/local-types.ts` includes the binding type (should already exist).

3. **Test**:
   - Visit `/ui` → should serve SPA
   - Visit `/ui/timeline` → should serve SPA (same index.html)
   - Visit `/ui/settings/profile` → should serve SPA
   - Visit `/sign-in` → should serve existing server-rendered page
   - Static assets like `/ui/app.js` → should be served directly by Cloudflare assets

### Option A (Fallback - If Option B Fails)

If static assets under `/ui/` aren't being served correctly:

1. Change `wrangler.jsonc`:
   ```jsonc
   "assets": {
     "binding": "ASSETS",
     "directory": "./public",
     "run_worker_first": true,  // Changed from false
   }
   ```

2. Add explicit static asset serving for non-SPA paths or use `serveStatic` middleware from Hono.

---

## Pitfalls

1. **Route order matters** — The `/ui/*` catch-all must come *before* the 404 handler but *after* any specific `/ui/...` API routes if you add them later.

2. **Static asset conflicts** — If SPA has assets like `/ui/app.js`, ensure they're served as files, not caught by the wildcard. With `run_worker_first: false`, Cloudflare serves existing files first, so this should work. If not, switch to Option A.

3. **Trailing slash** — `/ui` vs `/ui/` may behave differently. Consider adding a redirect or handling both:
   ```ts
   app.get('/ui', (c) => c.redirect('/ui/'))
   ```

4. **ASSETS.fetch URL** — The URL passed to `ASSETS.fetch` must be a valid URL. Using a dummy host (`https://dummy/...`) works because only the path matters.

5. **Content-Type header** — Explicitly set `Content-Type: text/html` to ensure browsers render it correctly.

---

## Implementation Order

- [ ] Add `/ui/*` route to `src/index.ts`
- [ ] Verify `ASSETS` binding type in `local-types.ts`
- [ ] Test SPA routes manually
- [ ] Test that existing HTML routes still work
- [ ] Test that static assets under `/ui/` are served correctly
