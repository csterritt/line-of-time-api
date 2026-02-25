# Plan: Implement Display Panels (Timeline and Lens)

## Assumptions
- We are working in `line-of-time-fe/src`.
- A 'Panel' is a TypeScript type, `TimelinePanel` or `LensPanel`.
- `panel-store.ts` will manage the `displayList` state.
- `TimelineDisplay.vue` already exists but will be updated to accept a `TimelinePanel` object and display the events for its timestamp range, plus a '+' button to add a new `LensPanel`.
- `LensDisplay.vue` will be created to accept a `LensPanel` object, displaying a list of events and a dropdown to add more, plus a '+' button to add a new `TimelinePanel`.
- `HomeView.vue` will iterate over `displayList` and render the appropriate display component in a horizontally scrolling container.
- We will use DaisyUI for styling as per guidelines.

## The Plan
1. **Create `panel-store.ts`**:
   - Define types: `TimelinePanel` (`{ type: 'timeline', startTimestamp: number, endTimestamp: number }`) and `LensPanel` (`{ type: 'lens', eventNames: string[] }`).
   - Define type: `Panel = TimelinePanel | LensPanel`.
   - Create a Pinia store with `displayList: Panel[]`.
   - Initialize `displayList` with a single `TimelinePanel` having min/max possible timestamps.
   - Add actions to append a new `TimelinePanel` or `LensPanel`.

2. **Update `TimelineDisplay.vue`**:
   - Change props to accept a `panel` of type `TimelinePanel`.
   - Update it to fetch/derive events based on its `startTimestamp` and `endTimestamp`.
   - Wrap the display in a DaisyUI card, setting width to 2/3 of the page.
   - Add a circular secondary button with a "+" to the right of the card, which adds a new `LensPanel` to the `displayList`.

3. **Create `LensDisplay.vue`**:
   - Create the component accepting a `panel` of type `LensPanel`.
   - Display the list of `eventNames` in a DaisyUI card (2/3 width).
   - Add a dropdown at the end of the list with all known event names (autocomplete/type-to-search).
   - Add a remove button next to each event name.
   - Add a circular secondary button with a "+" to the right of the card, which adds a new `TimelinePanel` to the `displayList`.

4. **Update `HomeView.vue`**:
   - Remove the old single-timeline logic.
   - Render a horizontally scrolling container.
   - Iterate through `displayList` from `panel-store`, rendering `TimelineDisplay` or `LensDisplay` dynamically.

5. **Update/Add E2E Tests**:
   - Update existing timeline tests if the DOM structure or data-testids change.
   - Add new tests for adding LensPanels and TimelinePanels, and adding/removing events in LensPanel.

## Pitfalls
- Managing state for multiple `TimelineDisplay` components: Currently `eventStore.events` is a single list. We either need to fetch events specifically for each `TimelinePanel` without mutating a single global state, or rely on a shared cache in `eventStore`. The prompt says "They are sent by the TimelinePanel to the event-store to get the events that occurred between those timestamps", which implies we might want a new method in `eventStore` to just fetch and return events, rather than mutating `events.value`.
- Horizontal scrolling layout with cards and "+" buttons requires careful CSS flexbox configuration to ensure it expands correctly without wrapping.
