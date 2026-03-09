# Plan: Lens Panel Close Button

## Feature
Add a close button to the top right corner of the Lens panel. Clicking it closes both the Lens panel and its child Timeline panel.

## Assumptions
- No database schema changes needed.
- "Close" means removing the Lens + its child Timeline from the panel store structures array.
- The first Timeline panel (index 1, no parent Lens) is never removed.
- Only non-first Lens panels have a close button.

## Plan

### 1. Plan tests (Red)
- E2E test in `e2e-tests/general/12-lens-panel-behavior.spec.ts`: after adding a lens, clicking close button removes both lens and its timeline.
- E2E test: close button has `data-testid="close-lens-panel-action"`.
- Unit test in `line-of-time-fe/src/tests/panel-store.test.ts`: `removeLensPanel(index)` removes the lens and its child timeline from structures.

### 2. Implement `removeLensPanel` in panel-store.ts
- Add `removeLensPanel(lensIndex: number)` action that filters out the LensStore at the given index and its `childTimeline`.
- Expose it from the store return value.

### 3. Update LensDisplay.vue
- Add a close button (×) in the top-right corner of the card header.
- Use `data-testid="close-lens-panel-action"`.
- On click, call `panelStore.removeLensPanel(store.index)`.
- Import `usePanelStore`.

### 4. Run tests (Green)
- Run unit tests, fix failures.
- Run E2E tests, fix failures.

## Pitfalls
- Removing mid-array lens/timeline must not break index references for other panels.
- The first Lens (index 0, hidden) must not be removable.

