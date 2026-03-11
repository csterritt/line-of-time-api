# Plan: SVG Connector Lines in Timeline Separator Column

## Questions and Ambiguities

These items in the spec are unclear or ambiguous. Please clarify before implementation begins.

1. **Horizontal offset for overlapping connectors**: When multiple events have start-to-end connectors whose vertical ranges overlap in the separator column, should the vertical lines be drawn at different horizontal offsets to avoid visual overlap? Or is stacking (drawing on top of each other) acceptable? The separator column is currently 24px wide (`w-6`), so there is room for a few offset positions.

2. **Color cycling scope**: The spec says colors cycle "for each subsequent event." Does this mean only events that have an end timestamp (and thus produce connector lines), or all events including point-in-time events that won't have connectors? This affects which color index is assigned to which event.

3. **Horizontal line length**: The spec says "a small horizontal line inside the start row." Should this span the full width of the separator column, half of it, or some fixed pixel amount? Same question for the end row horizontal line.

Plan question answers:

1. **Horizontal offset for overlapping connectors**: Yes, when vertical ranges overlap in the separator column, the vertical lines should be drawn at different horizontal offsets to avoid visual overlap. Stacking is acceptable as a last resort. The separator column is currently 24px wide (`w-6`), so there is room for a few offset positions.

2. **Color cycling scope**: Only events that have an end timestamp (and thus produce connector lines) should be considered for color cycling. Point-in-time events that won't have connectors should not affect the color index.

3. **Horizontal line length**: The spec says "a small horizontal line inside the row." This should span roughly half the separator column width (e.g., from center to right edge for start, center to left edge... or both from center outward). Exact visual will be tuned. The start of the "a small horizontal line inside the row." should be at the right edge of the row, and the end of the line should be whatever offset is appropriate due to overlap. Vertically, the line should start in the middle of the row, but offset up or down if there are multiple connectors in the same row.

## Assumptions (pending answers above)

- SVG stroke width: ~2px.

## Pitfalls

- **DOM measurement timing**: SVG positions depend on rendered row heights. Must use `nextTick` after Vue renders, and re-draw on window resize or data changes.
- **Row identity**: Need a reliable way to map each event's start/end `TimelineRow` entries back to specific DOM separator cells. Set the 'id' of the DOM separator cell to be `id-start-{{ the event ID }}`. for the start, and `id-end-{{ the event ID }}` for the end.
- **Reactivity**: Connector lines must re-draw when filters change, events are added/removed, or the panel resizes.
- **Multiple timelines**: Each `TimelineDisplay` instance manages its own connectors independently; the SVG overlay must be scoped to its own grid.

## Implementation Plan

### Step 1: Generate the 8 pastel colors

- Create a utility (e.g., `src/utils/pastel-colors.ts`) that exports an array of 8 OKLCH color strings.
- Use evenly spaced hues (0, 45, 90, 135, 180, 225, 270, 315 degrees), with fixed lightness (~0.85) and chroma (~0.08) for pastel shading.
- Export a helper `connectorColor(index: number): string` that returns `colors[index % 8]`.

### Step 2: Track which events need connectors

- In `TimelineDisplay.vue`, add a computed property `eventsWithConnectors` that filters `filteredEvents` to only those whose `endTimestamp` is non-null and whose end row is within the filtered range (already handled by existing `timelineRows` logic).
- Build a map: `eventId → { colorIndex, startRowIndex, endRowIndex }` by scanning `timelineRows` for matching start/end entries.

### Step 3: Add SVG overlay container

- Wrap the existing event-list grid in a `position: relative` container.
- Add an absolutely-positioned `<svg>` element that covers the full grid area, with `pointer-events: none` so it doesn't block clicks.
- The SVG should have `width` and `height` matching the grid's scroll dimensions.

### Step 4: Measure DOM positions and draw lines

- After render (`onMounted` + `nextTick`, and `watch` on `timelineRows`), query all `[data-testid="timeline-separator"]` elements.
- For each connector event, look up the separator cell at `startRowIndex` and `endRowIndex`.
- Compute:
  - **Start horizontal line**: from (xMid, yStartCenter) to (xRight, yStartCenter)
  - **Vertical line**: from (xMid, yStartCenter) to (xMid, yEndCenter)
  - **End horizontal line**: from (xMid, yEndCenter) to (xRight, yEndCenter)
- Render `<line>` elements with the appropriate pastel color and stroke width.

### Step 5: Handle reactivity and resize

- Use a `ResizeObserver` on the grid container to re-measure and re-draw when dimensions change.
- Watch `timelineRows` to re-draw when filter or event data changes.
- Clean up observer in `onBeforeUnmount`.

## Test Plan (Red/Green TDD)

### New tests (new spec file: `e2e-tests/general/13-timeline-connectors.spec.ts`)

1. **Connector SVG exists when events have end timestamps**: After seeding events with end dates, verify an SVG element exists inside the event-list area.
2. **Connector line count matches events with end timestamps**: Count the number of connector groups (each group = 3 `<line>` elements) and verify it equals the number of seeded events that have end timestamps.
3. **Connector lines use pastel colors**: For each connector group, verify the `stroke` attribute is a valid OKLCH/color string and that the three lines in a group share the same color.
4. **Colors cycle through 8 values**: If there are more events with connectors, verify that the 9th event reuses the 1st color.
5. **No connector lines for events without end timestamps**: Verify that point-in-time events do not produce any connector `<line>` elements.
6. **Connectors re-draw after filter change**: Apply a filter that excludes some events, verify connector count updates accordingly.

### Modifications to existing tests

- **`09-event-list-layout.spec.ts`**: The `separator column exists for each timeline row` test should still pass as-is. No changes expected, but verify after implementation.
- **`12-lens-panel-behavior.spec.ts`**: No changes expected; connectors are scoped per timeline instance.

### Unit tests (in `line-of-time-fe/src/tests/`)

1. **`pastel-colors.test.ts`**: Test that `connectorColor` returns 8 distinct colors and cycles correctly at index 8+.
2. **`connector-mapping.test.ts`**: Test the computed mapping from `timelineRows` to connector data (startRowIndex, endRowIndex, colorIndex) with various event configurations.
