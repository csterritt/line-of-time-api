# Plan: Add `isLast` boolean to LensStore

## Goal
Each `LensStore` needs a reactive `isLast` boolean that is `true` when it is the
last lens panel in the `structures` list, and `false` otherwise.

## Assumptions
- "last lens panel" means the `LensStore` with the highest index currently in `structures`
- `isLast` must update reactively when panels are added or removed
- No database schema changes required

## Pitfalls
- `markRaw` is used on each store object — `isLast` must be a `Ref<boolean>` so
  it is reactive even inside a `markRaw` object
- When `removeLensPanel` is called, the previously second-to-last lens becomes last,
  so its `isLast` ref must be updated

## Steps
1. Add `isLast: Ref<boolean>` to the `LensStore` type
2. Pass `isLast` into `makeLensStore` and store it as a `ref<boolean>`
3. Write a helper `updateIsLast(structures)` that iterates structures, finds the
   last `LensStore`, and sets `isLast.value` correctly on all lens stores
4. Call `updateIsLast` at the end of `addLensPanel` and `removeLensPanel`, and
   once after initial creation

## Tests (Red/Green TDD)
- initial state: first (and only) lens has `isLast === true`
- after `addLensPanel`: first lens has `isLast === false`, new lens has `isLast === true`
- after `removeLensPanel`: first lens has `isLast === true` again
- with 3 lens panels: only the last one has `isLast === true`
