# SPA Setup Plan

## Goal

Set up a Hono app that:

1. Serves ordinary HTML paths (existing routes)
2. Serves Vue 3 SPA routes under `/ui/*` from `./public/ui/index.html`
3. Correctly handles static assets (CSS, JS, images) in `./public` and `./public/assets`
4. Correctly handles static assets (CSS, JS, images) in the SPA directory

## Implementation Steps

### Step 1: Add serveStatic import

Add to `src/index.ts`:

```typescript
import { serveStatic } from 'hono/serve-static'
```

### Step 2: Add SPA serving middleware

Add after all API routes but BEFORE the 404 handler:

```typescript
// Serve static assets from /ui/* (files with extensions)
app.use('/ui/*', async (c, next) => {
  const path = c.req.path
  // If path has a file extension, try to serve the actual file
  if (path.match(/\.[^/]+$/)) {
    return serveStatic({
      root: './public',
      getContent: async (filePath) => {
        const file = await fetch(`file://${filePath}`)
        if (!file.ok) return null
        return file
      },
    })(c, next)
  }
  // Otherwise continue to SPA handler
  await next()
})

// Serve SPA index.html for all other /ui/* routes
app.get('/ui/*', async (c) => {
  const file = await fetch('file://./public/ui/index.html')
  if (!file.ok) {
    return c.notFound()
  }
  return new Response(file.body, {
    headers: {
      'content-type': 'text/html',
    },
  })
})
```

### Step 3: Verify file structure

Ensure this directory structure exists:

```
public/
└── ui/
    ├── index.html
    ├── app.js
    ├── style.css
    └── assets/
        └── ...
```

## Pitfalls

1. **Order matters**: SPA routes must be AFTER API routes but BEFORE 404 handler. If 404 comes first, SPA routes will 404.

2. **File extension detection**: The regex `/\.[^/]+$/` detects file extensions. Some SPAs use dot-paths (rare) - adjust if needed.

3. **Trailing slash**: `/ui` vs `/ui/` - handle both by adding:

   ```typescript
   app.get('/ui', (c) => c.redirect('/ui/'))
   ```

4. **getContent required**: Hono's serveStatic now requires `getContent` function. File path fetching differs between Node/Bun/Cloudflare Workers.

5. **Cache headers**: Consider adding cache headers for static assets but NOT for index.html (SPAs need fresh HTML).

6. **Cloudflare Workers**: `fetch('file://...')` won't work in CF Workers. Since this is a workers app, use this instead:
   ```typescript
   import { readFile } from 'node:fs/promises' // Node/Bun only
   // OR use Cloudflare's KV/Assets for production
   ```

## Next Steps After Plan

1. Confirm framework and directory structure
2. Implement the middleware
3. Test static file serving works
4. Test SPA deep linking works (e.g., `/ui/about` serves index.html)
