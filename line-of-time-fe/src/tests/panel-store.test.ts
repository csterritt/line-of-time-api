// ====================================
// Tests for panel-store.ts
// To run: cd line-of-time-fe && bun test src/tests/panel-store.test.ts
// ====================================

import { describe, it, expect, beforeEach } from 'bun:test'
import { setActivePinia, createPinia } from 'pinia'
import { usePanelStore } from '../stores/panel-store'
import type { EventResponse } from '../stores/event-store'
import { dateInputToTimestamp } from '../utils/timestamp'

const makeEvent = (name: string, startTimestamp = 0): EventResponse => ({
  id: name,
  name,
  basicDescription: `${name} description`,
  startTimestamp,
  endTimestamp: null,
  referenceUrl: '',
  relatedEventIds: [],
  eventType: null,
  createdAt: '',
  updatedAt: '',
})

describe('usePanelStore initial state', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts with two structures', () => {
    const store = usePanelStore()
    expect(store.structures.length).toBe(2)
  })

  it('first structure is a LensStore with type lens', () => {
    const store = usePanelStore()
    expect(store.structures[0]!.type).toBe('lens')
  })

  it('second structure is a TimelineStore with type timeline', () => {
    const store = usePanelStore()
    expect(store.structures[1]!.type).toBe('timeline')
  })

  it('first LensStore has index 0', () => {
    const store = usePanelStore()
    const lens = store.structures[0]!
    expect(lens.index).toBe(0)
  })

  it('first TimelineStore has index 1', () => {
    const store = usePanelStore()
    const timeline = store.structures[1]!
    expect(timeline.index).toBe(1)
  })

  it('first LensStore has null parent', () => {
    const store = usePanelStore()
    const lens = store.structures[0]!
    expect(lens.type).toBe('lens')
    if (lens.type === 'lens') {
      expect(lens.parentLens).toBeNull()
    }
  })

  it('first LensStore child is the first TimelineStore', () => {
    const store = usePanelStore()
    const lens = store.structures[0]!
    const timeline = store.structures[1]!
    expect(lens.type).toBe('lens')
    expect(timeline.type).toBe('timeline')
    if (lens.type === 'lens' && timeline.type === 'timeline') {
      expect(lens.childTimeline).toBe(timeline)
    }
  })

  it('first TimelineStore parent is the first LensStore', () => {
    const store = usePanelStore()
    const lens = store.structures[0]!
    const timeline = store.structures[1]!
    expect(timeline.type).toBe('timeline')
    if (timeline.type === 'timeline' && lens.type === 'lens') {
      expect(timeline.parentLens).toBe(lens)
    }
  })

  it('first LensStore starts with empty events list', () => {
    const store = usePanelStore()
    const lens = store.structures[0]!
    expect(lens.type).toBe('lens')
    if (lens.type === 'lens') {
      expect(lens.events.value).toEqual([])
    }
  })
})

describe('usePanelStore setAllEvents', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('sets the first LensStore events to all provided events', () => {
    const store = usePanelStore()
    const events = [makeEvent('Battle of Hastings', 100), makeEvent('Moon Landing', 200)]
    store.setAllEvents(events)
    const lens = store.structures[0]!
    expect(lens.type).toBe('lens')
    if (lens.type === 'lens') {
      expect(lens.events.value).toEqual(events)
    }
  })
})

describe('usePanelStore addLensPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('adds two more structures (LensStore + TimelineStore)', () => {
    const store = usePanelStore()
    store.addLensPanel()
    expect(store.structures.length).toBe(4)
  })

  it('new LensStore is at index 2', () => {
    const store = usePanelStore()
    store.addLensPanel()
    const newLens = store.structures[2]!
    expect(newLens.type).toBe('lens')
    expect(newLens.index).toBe(2)
  })

  it('new TimelineStore is at index 3', () => {
    const store = usePanelStore()
    store.addLensPanel()
    const newTimeline = store.structures[3]!
    expect(newTimeline.type).toBe('timeline')
    expect(newTimeline.index).toBe(3)
  })

  it('new LensStore parent is the first LensStore', () => {
    const store = usePanelStore()
    store.addLensPanel()
    const firstLens = store.structures[0]!
    const newLens = store.structures[2]!
    expect(newLens.type).toBe('lens')
    if (newLens.type === 'lens') {
      expect(newLens.parentLens).toBe(firstLens)
    }
  })

  it('new LensStore child is the new TimelineStore', () => {
    const store = usePanelStore()
    store.addLensPanel()
    const newLens = store.structures[2]!
    const newTimeline = store.structures[3]!
    expect(newLens.type).toBe('lens')
    expect(newTimeline.type).toBe('timeline')
    if (newLens.type === 'lens' && newTimeline.type === 'timeline') {
      expect(newLens.childTimeline).toBe(newTimeline)
    }
  })

  it('new TimelineStore parent is the new LensStore', () => {
    const store = usePanelStore()
    store.addLensPanel()
    const newLens = store.structures[2]!
    const newTimeline = store.structures[3]!
    expect(newTimeline.type).toBe('timeline')
    if (newTimeline.type === 'timeline' && newLens.type === 'lens') {
      expect(newTimeline.parentLens).toBe(newLens)
    }
  })

  it('new LensStore starts with empty events list', () => {
    const store = usePanelStore()
    store.addLensPanel()
    const newLens = store.structures[2]!
    expect(newLens.type).toBe('lens')
    if (newLens.type === 'lens') {
      expect(newLens.events.value).toEqual([])
    }
  })

  it('new LensStore eventMap is built from parent events', () => {
    const store = usePanelStore()
    const events = [makeEvent('Battle of Hastings', 100), makeEvent('Moon Landing', 200)]
    store.setAllEvents(events)
    store.addLensPanel()
    const newLens = store.structures[2]!
    expect(newLens.type).toBe('lens')
    if (newLens.type === 'lens') {
      expect(newLens.eventMap.value.has('Battle of Hastings')).toBe(true)
      expect(newLens.eventMap.value.has('Moon Landing')).toBe(true)
      expect(newLens.eventMap.value.get('Battle of Hastings')).toEqual(events[0])
    }
  })
})

describe('LensStore addEvent and removeEvent', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('addEvent adds event object to lens events by name', () => {
    const store = usePanelStore()
    const events = [makeEvent('Battle of Hastings', 100), makeEvent('Moon Landing', 200)]
    store.setAllEvents(events)
    store.addLensPanel()
    const newLens = store.structures[2]!
    expect(newLens.type).toBe('lens')
    if (newLens.type === 'lens') {
      newLens.addEvent('Battle of Hastings')
      expect(newLens.events.value.length).toBe(1)
      expect(newLens.events.value[0]!.name).toBe('Battle of Hastings')
    }
  })

  it('addEvent does nothing if event name not in eventMap', () => {
    const store = usePanelStore()
    store.addLensPanel()
    const newLens = store.structures[2]!
    expect(newLens.type).toBe('lens')
    if (newLens.type === 'lens') {
      newLens.addEvent('Unknown Event')
      expect(newLens.events.value.length).toBe(0)
    }
  })

  it('removeEvent removes event from lens events by name', () => {
    const store = usePanelStore()
    const events = [makeEvent('Battle of Hastings', 100), makeEvent('Moon Landing', 200)]
    store.setAllEvents(events)
    store.addLensPanel()
    const newLens = store.structures[2]!
    expect(newLens.type).toBe('lens')
    if (newLens.type === 'lens') {
      newLens.addEvent('Battle of Hastings')
      newLens.addEvent('Moon Landing')
      expect(newLens.events.value.length).toBe(2)
      newLens.removeEvent('Battle of Hastings')
      expect(newLens.events.value.length).toBe(1)
      expect(newLens.events.value[0]!.name).toBe('Moon Landing')
    }
  })

  it('removeEvent does nothing if event not in list', () => {
    const store = usePanelStore()
    store.addLensPanel()
    const newLens = store.structures[2]!
    expect(newLens.type).toBe('lens')
    if (newLens.type === 'lens') {
      newLens.removeEvent('Nonexistent')
      expect(newLens.events.value.length).toBe(0)
    }
  })
})

describe('LensStore nameList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('first LensStore starts with empty nameList', () => {
    const store = usePanelStore()
    const lens = store.structures[0]!
    expect(lens.type).toBe('lens')
    if (lens.type === 'lens') {
      expect(lens.nameList.value).toEqual([])
    }
  })

  it('first LensStore nameList contains all event names after setAllEvents', () => {
    const store = usePanelStore()
    const events = [makeEvent('Battle of Hastings', 100), makeEvent('Moon Landing', 200)]
    store.setAllEvents(events)
    const lens = store.structures[0]!
    expect(lens.type).toBe('lens')
    if (lens.type === 'lens') {
      expect(lens.nameList.value).toEqual(['Battle of Hastings', 'Moon Landing'])
    }
  })

  it('new LensStore nameList is built from parent events', () => {
    const store = usePanelStore()
    const events = [makeEvent('Battle of Hastings', 100), makeEvent('Moon Landing', 200)]
    store.setAllEvents(events)
    store.addLensPanel()
    const newLens = store.structures[2]!
    expect(newLens.type).toBe('lens')
    if (newLens.type === 'lens') {
      expect(newLens.nameList.value).toEqual(['Battle of Hastings', 'Moon Landing'])
    }
  })

  it('nameList removes event name when addEvent is called', () => {
    const store = usePanelStore()
    const events = [makeEvent('Battle of Hastings', 100), makeEvent('Moon Landing', 200)]
    store.setAllEvents(events)
    store.addLensPanel()
    const newLens = store.structures[2]!
    expect(newLens.type).toBe('lens')
    if (newLens.type === 'lens') {
      newLens.addEvent('Battle of Hastings')
      expect(newLens.nameList.value).toEqual(['Moon Landing'])
    }
  })

  it('nameList adds event name back when removeEvent is called', () => {
    const store = usePanelStore()
    const events = [makeEvent('Battle of Hastings', 100), makeEvent('Moon Landing', 200)]
    store.setAllEvents(events)
    store.addLensPanel()
    const newLens = store.structures[2]!
    expect(newLens.type).toBe('lens')
    if (newLens.type === 'lens') {
      newLens.addEvent('Battle of Hastings')
      newLens.removeEvent('Battle of Hastings')
      expect(newLens.nameList.value).toEqual(['Battle of Hastings', 'Moon Landing'])
    }
  })

  it('nameList updates when parent lens events change', () => {
    const store = usePanelStore()
    const events = [makeEvent('Battle of Hastings', 100), makeEvent('Moon Landing', 200)]
    store.setAllEvents(events)
    store.addLensPanel()
    const firstLens = store.structures[0]!
    const newLens = store.structures[2]!
    expect(firstLens.type).toBe('lens')
    expect(newLens.type).toBe('lens')
    if (firstLens.type === 'lens' && newLens.type === 'lens') {
      firstLens.addEvent('Battle of Hastings')
      expect(newLens.nameList.value).toEqual(['Battle of Hastings', 'Moon Landing'])
    }
  })
})

describe('usePanelStore removeLensPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('removes both the lens and its child timeline from structures', () => {
    const store = usePanelStore()
    store.addLensPanel()
    expect(store.structures.length).toBe(4)
    const newLens = store.structures[2]!
    expect(newLens.type).toBe('lens')
    if (newLens.type === 'lens') {
      store.removeLensPanel(newLens.index)
    }
    expect(store.structures.length).toBe(2)
  })

  it('the remaining structures are the original timeline and first lens', () => {
    const store = usePanelStore()
    store.addLensPanel()
    const firstLens = store.structures[0]!
    const firstTimeline = store.structures[1]!
    const newLens = store.structures[2]!
    expect(newLens.type).toBe('lens')
    if (newLens.type === 'lens') {
      store.removeLensPanel(newLens.index)
    }
    expect(store.structures[0]).toBe(firstLens)
    expect(store.structures[1]).toBe(firstTimeline)
  })

  it('does not remove anything for the first lens (index 0)', () => {
    const store = usePanelStore()
    store.removeLensPanel(0)
    expect(store.structures.length).toBe(2)
  })
})

describe('LensStore isLast', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('first lens isLast is true when it is the only lens', () => {
    const store = usePanelStore()
    const firstLens = store.structures[0]!
    expect(firstLens.type).toBe('lens')
    if (firstLens.type === 'lens') {
      expect(firstLens.isLast.value).toBe(true)
    }
  })

  it('first lens isLast becomes false after addLensPanel', () => {
    const store = usePanelStore()
    store.addLensPanel()
    const firstLens = store.structures[0]!
    expect(firstLens.type).toBe('lens')
    if (firstLens.type === 'lens') {
      expect(firstLens.isLast.value).toBe(false)
    }
  })

  it('new lens isLast is true after addLensPanel', () => {
    const store = usePanelStore()
    store.addLensPanel()
    const newLens = store.structures[2]!
    expect(newLens.type).toBe('lens')
    if (newLens.type === 'lens') {
      expect(newLens.isLast.value).toBe(true)
    }
  })

  it('first lens isLast is true again after removeLensPanel', () => {
    const store = usePanelStore()
    store.addLensPanel()
    const firstLens = store.structures[0]!
    const newLens = store.structures[2]!
    expect(newLens.type).toBe('lens')
    if (newLens.type === 'lens') {
      store.removeLensPanel(newLens.index)
    }
    expect(firstLens.type).toBe('lens')
    if (firstLens.type === 'lens') {
      expect(firstLens.isLast.value).toBe(true)
    }
  })

  it('with three lenses, only the last has isLast true', () => {
    const store = usePanelStore()
    store.addLensPanel()
    store.addLensPanel()
    const firstLens = store.structures[0]!
    const secondLens = store.structures[2]!
    const thirdLens = store.structures[4]!
    expect(firstLens.type).toBe('lens')
    expect(secondLens.type).toBe('lens')
    expect(thirdLens.type).toBe('lens')
    if (firstLens.type === 'lens' && secondLens.type === 'lens' && thirdLens.type === 'lens') {
      expect(firstLens.isLast.value).toBe(false)
      expect(secondLens.isLast.value).toBe(false)
      expect(thirdLens.isLast.value).toBe(true)
    }
  })
})

describe('TimelineStore timestamps', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('first TimelineStore has default start/end timestamps', () => {
    const store = usePanelStore()
    const timeline = store.structures[1]!
    expect(timeline.type).toBe('timeline')
    if (timeline.type === 'timeline') {
      expect(typeof timeline.startTimestamp.value).toBe('number')
      expect(typeof timeline.endTimestamp.value).toBe('number')
    }
  })

  it('first TimelineStore resets start and end timestamps to today when events are empty', () => {
    const store = usePanelStore()
    store.setAllEvents([])
    const timeline = store.structures[1]!
    expect(timeline.type).toBe('timeline')
    if (timeline.type === 'timeline') {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const todayTs = dateInputToTimestamp(
        `${String(year).padStart(4, '0')}-${month}-${day}`
      )
      expect(timeline.startTimestamp.value).toBe(todayTs)
      expect(timeline.endTimestamp.value).toBe(todayTs)
    }
  })

  it('new TimelineStore start and end timestamps are set to today', async () => {
    const store = usePanelStore()
    store.addLensPanel()
    const newTimeline = store.structures[3]!
    expect(newTimeline.type).toBe('timeline')
    if (newTimeline.type === 'timeline') {
      const start = newTimeline.startTimestamp.value
      const end = newTimeline.endTimestamp.value
      expect(start).toBe(end)
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const todayTs = dateInputToTimestamp(`${String(year).padStart(4, '0')}-${month}-${day}`)
      expect(start).toBe(todayTs)
    }
  })
})
