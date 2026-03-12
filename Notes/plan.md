# Refactoring Plan for TimelineDisplay.vue

## Analysis

TimelineDisplay.vue is ~586 lines. The `<script>` section (~420 lines) contains:

- **Pure utility functions**: `timestampToFilterInputs`, `parsePositiveInteger`, `toTimestampWithDefaults`, `computeEventMinMax` (near-duplicate of `getEventBounds` in panel-store), `computeLaneAssignments`, `endDescription`
- **Per-instance filter state**: `originalStart/End`, `filterStartInputs/EndInputs`, `appliedStart/End`
- **Filter actions**: `initializeFilterBounds`, `applyMinFilter`, `applyMaxFilter`, `resetMin`, `resetMax`
- **Computed data**: `filteredEvents`, `timelineRows`, `eventsWithConnectors`, `connectorMap`, `rangeIsMoreThanOneYear`, `formatEventDate`
- **DOM-dependent connector drawing**: `drawConnectors`, ResizeObserver lifecycle, `connectorLines`, `svgWidth/Height`, template refs
- **Types**: `FilterInputs`, `TimelineEntry`, `TimelineRow`, `ConnectorInfo`, `ConnectorLine`

The `<template>` section (~165 lines) contains:
- Filter controls (min/max year/month/day forms with Go/Reset buttons)
- Timeline grid (date cells, separators, event rows)
- SVG connector overlay
- "Add Lens Panel" button

## Plan

### Step 1: Export `getEventBounds` from panel-store.ts

Consolidate `computeEventMinMax` (from TimelineDisplay.vue) with the existing `getEventBounds` (in panel-store.ts) by exporting `getEventBounds`.

### Step 2: Create `useTimelineDisplay` composable

Create `src/composables/useTimelineDisplay.ts` with all pure logic and per-instance state:
- Types: `FilterInputs`, `TimelineEntry`, `TimelineRow`, `ConnectorInfo`
- Pure functions: `timestampToFilterInputs`, `parsePositiveInteger`, `toTimestampWithDefaults`, `computeLaneAssignments`
- State refs: `originalStart`, `originalEnd`, `filterStartInputs`, `filterEndInputs`, `appliedStart`, `appliedEnd`
- Computed: `rangeIsMoreThanOneYear`, `filteredEvents`, `timelineRows`, `eventsWithConnectors`, `connectorMap`, `formatEventDate`
- Actions: `initializeFilterBounds`, `applyMinFilter`, `applyMaxFilter`, `resetMin`, `resetMax`
- Helper: `endDescription`
- Reuse exported `getEventBounds` from panel-store

### Step 3: Extract TimelineFilterControls.vue

New component for the min/max date filter forms. Receives filter state and actions from the composable via props/emits.

### Step 4: Slim down TimelineDisplay.vue

Reduce to a component that:
- Uses `useTimelineDisplay` composable
- Composes `TimelineFilterControls` for the filter UI
- Keeps the grid + connector SVG + "Add Lens Panel" button

### Step 5: Tests

- Unit tests for `useTimelineDisplay` composable (filter logic, row computation, connector map)
- All existing e2e tests must still pass (no behavioral changes)

## Assumptions

- No database schema changes needed (this is purely frontend refactoring)
- The refactoring is behavior-preserving — no UI or functionality changes
- `computeEventMinMax` can be consolidated with `getEventBounds` since they do the same thing

## Pitfalls

- **Per-instance state**: Filter state must be per-timeline, not global. Expanding `TimelineStore` handles this correctly.
- **DOM coupling**: Connector drawing requires `getBoundingClientRect` — must stay in a component, not the store.
- **Reactivity**: Moving refs into `markRaw` objects (like `TimelineStore`) means we need to be careful that Vue tracks changes properly. The existing pattern already uses `Ref` inside `markRaw` objects, so this should work.
- **data-testid stability**: All existing `data-testid` attributes must remain on the same elements to avoid breaking e2e tests.
