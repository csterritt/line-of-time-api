# Panel Store Code Walkthrough

*2026-03-03T18:22:01Z by Showboat 0.6.1*
<!-- showboat-id: a8c42122-d4c1-4fc8-9077-77905b5b3219 -->

This walkthrough provides a comprehensive analysis of the panel store implementation in line-of-time-fe/src/stores/panel-store.ts. The panel store manages a hierarchical structure of lenses and timelines that form the core data model for the timeline visualization application.

The store implements a tree-like structure where each lens contains events and can have a child timeline, and each timeline belongs to a parent lens. This creates a flexible system for organizing and filtering events across different time periods and contexts.

## Type Definitions and Interfaces

```bash
sed -n '6,15p' line-of-time-fe/src/stores/panel-store.ts
```

```output
export type LensStore = {
  type: 'lens'
  index: number
  parentLens: LensStore | null
  childTimeline: TimelineStore | null
  events: Ref<EventResponse[]>
  eventMap: Ref<Map<string, EventResponse>>
  addEvent: (name: string) => void
  removeEvent: (name: string) => void
}
```

The LensStore type defines the core structure for event filtering panels. Each lens has:

- A 'type' discriminator for TypeScript pattern matching

- An 'index' for ordering and identification

- A 'parentLens' reference for hierarchical navigation (null for root)

- A 'childTimeline' reference for the associated timeline view

- 'events' and 'eventMap' for managing event collections with efficient lookup

- Methods for adding and removing events from the lens

```bash
sed -n '17,23p' line-of-time-fe/src/stores/panel-store.ts
```

```output
export type TimelineStore = {
  type: 'timeline'
  index: number
  parentLens: LensStore
  startTimestamp: Ref<number>
  endTimestamp: Ref<number>
}
```

The TimelineStore type is simpler, representing time-bound views:

- Also has a 'type' discriminator and 'index' for ordering

- A required 'parentLens' reference (timelines always have a parent)

- Reactive timestamp bounds for the time window

```bash
sed -n '25p' line-of-time-fe/src/stores/panel-store.ts
```

```output
type Structure = LensStore | TimelineStore
```

The Structure union type allows treating both lens and timeline stores uniformly in arrays and operations, enabling flexible tree traversal and manipulation.

## Utility Functions

```bash
sed -n '27,33p' line-of-time-fe/src/stores/panel-store.ts
```

```output
const todayTimestamp = (): number => {
  const now = new Date()
  const yyyy = now.getFullYear().toString().padStart(4, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return dateInputToTimestamp(`${yyyy}-${mm}-${dd}`)
}
```

The todayTimestamp utility function creates a timestamp for the current date at midnight:

- Gets the current date and formats it as YYYY-MM-DD

- Uses padStart() to ensure consistent 2-digit month and day formatting

- Converts the formatted date string to a timestamp using dateInputToTimestamp utility

This function is used to set default time bounds for new timelines, typically defaulting to today's date for non-root timelines.

## Factory Functions

### makeLensStore Function

```bash
sed -n '35,62p' line-of-time-fe/src/stores/panel-store.ts
```

```output
const makeLensStore = (index: number, parentLens: LensStore | null): LensStore => {
  const events = ref<EventResponse[]>([])
  const eventMap = ref<Map<string, EventResponse>>(new Map())

  const store: LensStore = markRaw({
    type: 'lens',
    index,
    parentLens,
    childTimeline: null,
    events,
    eventMap,
    addEvent(name: string) {
      const evt = eventMap.value.get(name)
      if (!evt) {
        return
      }

      if (!events.value.find((e) => e.name === name)) {
        events.value = [...events.value, evt]
      }
    },
    removeEvent(name: string) {
      events.value = events.value.filter((e) => e.name !== name)
    },
  })

  return store
}
```

The makeLensStore function creates new lens instances with the following key characteristics:

- Creates reactive refs for events array and eventMap for efficient event management

- Uses markRaw() to prevent Vue from making the store object reactive (optimization)

- addEvent method: Safely adds events by checking eventMap first, prevents duplicates

- removeEvent method: Filters events array to remove specified event by name

### makeTimelineStore Function

```bash
sed -n '64,76p' line-of-time-fe/src/stores/panel-store.ts
```

```output
const makeTimelineStore = (index: number, parentLens: LensStore): TimelineStore => {
  const isFirst = index === 1
  const startTimestamp = ref(isFirst ? -99999999999 : todayTimestamp())
  const endTimestamp = ref(isFirst ? 99999999999 : todayTimestamp())

  return markRaw({
    type: 'timeline',
    index,
    parentLens,
    startTimestamp,
    endTimestamp,
  })
}
```

The makeTimelineStore function creates timeline instances with intelligent default time bounds:

- Checks if this is the first timeline (index === 1) for special handling

- First timeline gets maximum range (-99999999999 to 99999999999) for comprehensive view

- Subsequent timelines default to today's date for both start and end

- Also uses markRaw() for performance optimization

## Main Store Definition

```bash
sed -n '78,88p' line-of-time-fe/src/stores/panel-store.ts
```

```output
export const usePanelStore = defineStore('panel-store', () => {
  const firstLens = makeLensStore(0, null)
  const firstTimeline = makeTimelineStore(1, firstLens)
  firstLens.childTimeline = firstTimeline

  const structures = shallowRef<Structure[]>([firstLens, firstTimeline])

  const setAllEvents = (allEvents: EventResponse[]) => {
    firstLens.events.value = allEvents
    firstLens.eventMap.value = new Map(allEvents.map((e) => [e.name, e]))
  }
```

The usePanelStore is the main Pinia store that orchestrates the entire panel system:

- Creates the initial root lens (index 0, no parent) and its timeline (index 1)

- Establishes the parent-child relationship by setting firstLens.childTimeline

- Uses shallowRef for the structures array to prevent deep reactivity (performance)

- setAllEvents method initializes the root lens with all available events and creates a lookup map

## Public Methods

### addLensPanel Method

```bash
sed -n '90,104p' line-of-time-fe/src/stores/panel-store.ts
```

```output
  const addLensPanel = () => {
    const currentStructures = structures.value
    const newIndex = currentStructures.length
    const lastLens =
      [...currentStructures].reverse().find((s): s is LensStore => s.type === 'lens') ?? firstLens
    const newLens = makeLensStore(newIndex, lastLens)

    const parentEvents = lastLens.events.value
    newLens.eventMap.value = new Map(parentEvents.map((e) => [e.name, e]))

    const newTimeline = makeTimelineStore(newIndex + 1, newLens)
    newLens.childTimeline = newTimeline

    structures.value = [...currentStructures, newLens, newTimeline]
  }
```

The addLensPanel method dynamically extends the panel hierarchy:

- Calculates new index based on current structures length

- Finds the most recent lens to serve as parent (reverse search with type guard)

- Inherits parent lens events by copying them to new lens's eventMap

- Creates corresponding timeline and establishes bidirectional relationship

- Updates structures array with new lens and timeline pair

```bash
sed -n '106,111p' line-of-time-fe/src/stores/panel-store.ts
```

```output
  return {
    structures,
    setAllEvents,
    addLensPanel,
  }
})
```

The store exports three public members:

- structures: The reactive array containing all lens and timeline objects

- setAllEvents: Method to populate the root lens with all available events

- addLensPanel: Method to dynamically add new lens-timeline pairs to the hierarchy

## Summary and Key Architectural Patterns

This panel store implementation demonstrates several sophisticated architectural patterns:

**Hierarchical Tree Structure**: Lenses and timelines form a parent-child tree enabling nested filtering and time-based views

**Performance Optimizations**: Strategic use of markRaw() and shallowRef() to prevent unnecessary reactivity overhead

**TypeScript Discriminated Unions**: Type discriminator fields enable type-safe pattern matching between lens and timeline objects

**Event Inheritance Pattern**: Child lenses inherit events from parent lenses, enabling progressive filtering

**Bidirectional References**: Lenses reference child timelines and timelines reference parent lenses for navigation

**Factory Pattern**: Consistent object creation through factory functions ensures proper initialization and relationships

**Efficient Event Management**: Dual storage with array for ordering and Map for O(1) lookup provides optimal performance

This architecture enables a flexible, performant system for managing complex timeline visualizations with hierarchical filtering capabilities.
