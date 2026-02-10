# Plan: Add AI categorization experiment to initial search

## Assumptions

- The Cloudflare Workers AI binding needs to be added to `wrangler.jsonc` and the `Bindings` type
- The `env.AI.run()` API is used with model names prefixed by `@cf/` for Cloudflare Workers AI
- The function loops through all models, logging each result (experiment — no tests)
- The AI call is fire-and-forget; it does not block or alter the search response

## Files to Create / Modify

| File                                     | Action                                                    |
| ---------------------------------------- | --------------------------------------------------------- |
| `src/lib/ai-search.ts`                   | **Create** — `aiCategorizationAndSearch` function         |
| `src/routes/time-info/initial-search.ts` | **Modify** — call `aiCategorizationAndSearch` after GET 2 |
| `src/local-types.ts`                     | **Modify** — add `AI` to `Bindings` interface             |
| `wrangler.jsonc`                         | **Modify** — add `[ai]` binding                           |

## Implementation Steps

### Step 1: Add AI binding to `wrangler.jsonc`

- Add `"ai": { "binding": "AI" }` to the config

### Step 2: Add `AI` to `Bindings` type

- Add `AI: Ai` to the `Bindings` interface in `local-types.ts`

### Step 3: Create `src/lib/ai-search.ts`

- Define model list with max input sizes
- Build prompt with categorization instructions
- Loop through models, truncate `rawText` to each model's max input size, prepend prompt, call `env.AI.run()`, log model name and result

### Step 4: Call from `initial-search.ts`

- After GET 2 parse succeeds, call `aiCategorizationAndSearch(c.env, rawText)`
- Do not await or block the response (or await if we want to see logs before response)

## Pitfalls

1. **AI binding not configured** — Must add to both `wrangler.jsonc` and `Bindings` type or it will be undefined at runtime
2. **Model name format** — Cloudflare Workers AI models use `@cf/` prefix in the `AI.run()` call
3. **Token vs character limits** — The max input sizes are in characters, not tokens; this is an approximation
4. **Rate limits** — Calling 5 models in sequence may be slow or hit rate limits; this is acceptable for an experiment
5. **Prompt length** — The prompt itself takes up space; must account for it when truncating rawText
