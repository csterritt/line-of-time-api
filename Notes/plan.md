# Plan: Add nameList to LensStore

## Assumptions

- No database schema changes are needed.
- `nameList` is derived from the parent lens's events (i.e. the events available to pick from, not the ones already selected).
- For the first LensStore (no parent), `nameList` is built from `setAllEvents` data.
- `nameList` replaces the computed `availableEvents` in `LensDisplay.vue`.

## Answer

Add a reactive `nameList: Ref<string[]>` to each `LensStore` that stays in sync with the parent lens's events minus the events already selected in this lens. Replace the computed `availableEvents` in `LensDisplay.vue` with `store.nameList.value`.

## Plan

1. **Red**: Add failing unit tests for `nameList` behavior:
   - First lens `nameList` starts empty.
   - After `setAllEvents`, first lens `nameList` contains all event names.
   - New lens `nameList` is built from parent events.
   - `nameList` updates when an event is added to the lens (removes from nameList).
   - `nameList` updates when an event is removed from the lens (adds back to nameList).
2. **Green**: Implement in `panel-store.ts`:
   - Add `nameList: Ref<string[]>` to `LensStore` type.
   - In `makeLensStore`, compute `nameList` reactively as parent events names minus current lens events.
   - In `setAllEvents`, update first lens `nameList`.
   - In `addLensPanel`, seed new lens `nameList` from parent's events.
   - Keep `nameList` in sync via `addEvent`/`removeEvent`.
3. **Refactor**: Update `LensDisplay.vue` to use `store.nameList.value` in the datalist instead of computed `availableEvents`.
4. Run all unit tests (`bun test`).
5. Run all e2e tests (`npx playwright test`).

## Pitfalls

- `nameList` must stay reactive; use `watchEffect` or compute it inside `addEvent`/`removeEvent`.
- First lens has no parent, so its `nameList` must be seeded from `setAllEvents`.
- When parent lens events change (user adds/removes), child lens `nameList` must also update.
