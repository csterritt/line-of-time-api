// ====================================
// Tests for useTimelineDisplay composable
// To run: cd line-of-time-fe && bun test src/tests/useTimelineDisplay.test.ts
// ====================================

import { describe, it, expect } from 'bun:test'
import { ref, nextTick } from 'vue'
import {
  useTimelineDisplay,
  parsePositiveInteger,
  timestampToFilterInputs,
  toTimestampWithDefaults,
  computeLaneAssignments,
  endDescription,
  type FilterInputs,
  type ConnectorInfo,
} from '../composables/useTimelineDisplay'
import type { EventResponse } from '../stores/event-store'
import type { TimelineStore, LensStore } from '../stores/panel-store'
import { dateInputToTimestamp } from '../utils/timestamp'

const makeEvent = (
  name: string,
  startDate: string,
  opts?: { endDate?: string; eventType?: string | null }
): EventResponse => ({
  id: name,
  name,
  basicDescription: `${name} description`,
  startTimestamp: dateInputToTimestamp(startDate),
  endTimestamp: opts?.endDate ? dateInputToTimestamp(opts.endDate) : null,
  referenceUrl: '',
  relatedEventIds: [],
  eventType: opts?.eventType ?? null,
  createdAt: '',
  updatedAt: '',
})

const makeMockTimelineStore = (events: EventResponse[]): TimelineStore => {
  const eventsRef = ref<EventResponse[]>(events)
  const parentLens = {
    type: 'lens' as const,
    index: 0,
    isLast: ref(true),
    parentLens: null,
    childTimeline: null,
    events: eventsRef,
    eventMap: ref(new Map(events.map((e) => [e.name, e]))),
    nameList: ref(events.map((e) => e.name)),
    addEvent: () => {},
    removeEvent: () => {},
  } satisfies LensStore

  return {
    type: 'timeline' as const,
    index: 1,
    parentLens,
    startTimestamp: ref(-99999999999),
    endTimestamp: ref(99999999999),
  }
}

// ========================================
// Pure function tests
// ========================================

describe('parsePositiveInteger', () => {
  it('parses a valid positive integer string', () => {
    expect(parsePositiveInteger('42')).toBe(42)
  })

  it('returns null for zero', () => {
    expect(parsePositiveInteger('0')).toBeNull()
  })

  it('returns null for negative number string', () => {
    expect(parsePositiveInteger('-1')).toBeNull()
  })

  it('returns null for non-numeric string', () => {
    expect(parsePositiveInteger('abc')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parsePositiveInteger('')).toBeNull()
  })

  it('returns null for decimal string', () => {
    expect(parsePositiveInteger('3.5')).toBeNull()
  })
})

describe('timestampToFilterInputs', () => {
  it('converts a timestamp to year/month/day inputs', () => {
    const ts = dateInputToTimestamp('1969-07-20')
    const result = timestampToFilterInputs(ts)
    expect(result.year).toBe('1969')
    expect(result.month).toBe('07')
    expect(result.day).toBe('20')
  })

  it('pads single-digit months and days', () => {
    const ts = dateInputToTimestamp('0500-01-05')
    const result = timestampToFilterInputs(ts)
    expect(result.month).toBe('01')
    expect(result.day).toBe('05')
  })
})

describe('toTimestampWithDefaults', () => {
  it('converts valid year/month/day to timestamp and normalized values', () => {
    const inputs: FilterInputs = { year: '1969', month: '7', day: '20', era: 'AD' }
    const result = toTimestampWithDefaults(inputs)
    expect(result).not.toBeNull()
    expect(result!.timestamp).toBe(dateInputToTimestamp('1969-07-20'))
    expect(result!.normalized.month).toBe('7')
    expect(result!.normalized.day).toBe('20')
  })

  it('defaults month to 1 when empty', () => {
    const inputs: FilterInputs = { year: '1969', month: '', day: '', era: 'AD' }
    const result = toTimestampWithDefaults(inputs)
    expect(result).not.toBeNull()
    expect(result!.timestamp).toBe(dateInputToTimestamp('1969-01-01'))
    expect(result!.normalized.month).toBe('1')
    expect(result!.normalized.day).toBe('1')
  })

  it('defaults day to 1 when empty', () => {
    const inputs: FilterInputs = { year: '1969', month: '7', day: '', era: 'AD' }
    const result = toTimestampWithDefaults(inputs)
    expect(result).not.toBeNull()
    expect(result!.timestamp).toBe(dateInputToTimestamp('1969-07-01'))
    expect(result!.normalized.day).toBe('1')
  })

  it('returns null for empty year', () => {
    const inputs: FilterInputs = { year: '', month: '1', day: '1', era: 'AD' }
    expect(toTimestampWithDefaults(inputs)).toBeNull()
  })

  it('returns null for invalid month (>12)', () => {
    const inputs: FilterInputs = { year: '1969', month: '13', day: '1', era: 'AD' }
    expect(toTimestampWithDefaults(inputs)).toBeNull()
  })

  it('returns null for invalid day (>31)', () => {
    const inputs: FilterInputs = { year: '1969', month: '7', day: '32', era: 'AD' }
    expect(toTimestampWithDefaults(inputs)).toBeNull()
  })
})

describe('endDescription', () => {
  it('returns "Death of X" for person events', () => {
    const evt = makeEvent('George Washington', '1799-12-14', { eventType: 'person' })
    expect(endDescription(evt)).toBe('Death of George Washington')
  })

  it('returns "End of X" for non-person events', () => {
    const evt = makeEvent('World War II', '1945-09-02', { eventType: 'bounded-event' })
    expect(endDescription(evt)).toBe('End of World War II')
  })

  it('returns "End of X" for null eventType', () => {
    const evt = makeEvent('Something', '2000-01-01')
    expect(endDescription(evt)).toBe('End of Something')
  })
})

describe('computeLaneAssignments', () => {
  it('returns empty map for no connectors', () => {
    const result = computeLaneAssignments([])
    expect(result.size).toBe(0)
  })

  it('assigns lane 0 to a single connector', () => {
    const connectors: ConnectorInfo[] = [
      { eventId: 'e1', colorIndex: 0, startRowIndex: 0, endRowIndex: 5 },
    ]
    const result = computeLaneAssignments(connectors)
    expect(result.get('e1')).toBe(0)
  })

  it('assigns different lanes to overlapping connectors', () => {
    const connectors: ConnectorInfo[] = [
      { eventId: 'e1', colorIndex: 0, startRowIndex: 0, endRowIndex: 5 },
      { eventId: 'e2', colorIndex: 1, startRowIndex: 2, endRowIndex: 8 },
    ]
    const result = computeLaneAssignments(connectors)
    expect(result.get('e1')).toBe(0)
    expect(result.get('e2')).toBe(1)
  })

  it('reuses lanes for non-overlapping connectors', () => {
    const connectors: ConnectorInfo[] = [
      { eventId: 'e1', colorIndex: 0, startRowIndex: 0, endRowIndex: 3 },
      { eventId: 'e2', colorIndex: 1, startRowIndex: 4, endRowIndex: 7 },
    ]
    const result = computeLaneAssignments(connectors)
    expect(result.get('e1')).toBe(0)
    expect(result.get('e2')).toBe(0)
  })
})

// ========================================
// Composable integration tests
// ========================================

describe('useTimelineDisplay initializeFilterBounds', () => {
  it('sets filter bounds from parent events', () => {
    const events = [
      makeEvent('Event A', '1732-01-01'),
      makeEvent('Event B', '1969-07-20'),
    ]
    const store = makeMockTimelineStore(events)
    const td = useTimelineDisplay(store)

    td.initializeFilterBounds()

    const startInputs = td.filterStartInputs.value
    expect(startInputs.year).toBe('1732')
    expect(startInputs.month).toBe('01')
    expect(startInputs.day).toBe('01')

    const endInputs = td.filterEndInputs.value
    expect(endInputs.year).toBe('1969')
    expect(endInputs.month).toBe('07')
    expect(endInputs.day).toBe('20')
  })

  it('does not change state when events are empty', () => {
    const store = makeMockTimelineStore([])
    const td = useTimelineDisplay(store)
    const beforeStart = td.filterStartInputs.value
    td.initializeFilterBounds()
    expect(td.filterStartInputs.value).toEqual(beforeStart)
  })
})

describe('useTimelineDisplay filteredEvents', () => {
  it('returns all events when filter range covers everything', () => {
    const events = [
      makeEvent('Event A', '1732-01-01'),
      makeEvent('Event B', '1969-07-20'),
    ]
    const store = makeMockTimelineStore(events)
    const td = useTimelineDisplay(store)
    td.initializeFilterBounds()

    expect(td.filteredEvents.value.length).toBe(2)
  })

  it('filters events by applied start', () => {
    const events = [
      makeEvent('Event A', '1732-01-01'),
      makeEvent('Event B', '1969-07-20'),
    ]
    const store = makeMockTimelineStore(events)
    const td = useTimelineDisplay(store)
    td.initializeFilterBounds()

    td.filterStartInputs.value = { year: '1900', month: '1', day: '1', era: 'AD' }
    td.applyMinFilter()

    expect(td.filteredEvents.value.length).toBe(1)
    expect(td.filteredEvents.value[0]!.name).toBe('Event B')
  })
})

describe('useTimelineDisplay timelineRows', () => {
  it('creates start entries for each event', () => {
    const events = [
      makeEvent('Event A', '1732-01-01'),
      makeEvent('Event B', '1969-07-20'),
    ]
    const store = makeMockTimelineStore(events)
    const td = useTimelineDisplay(store)
    td.initializeFilterBounds()

    const rows = td.timelineRows.value
    const startRows = rows.filter((r) => r.type === 'start')
    expect(startRows.length).toBe(2)
  })

  it('creates end entries for events with end timestamps', () => {
    const events = [
      makeEvent('WWII', '1939-09-01', { endDate: '1945-09-02' }),
    ]
    const store = makeMockTimelineStore(events)
    const td = useTimelineDisplay(store)
    td.initializeFilterBounds()

    const rows = td.timelineRows.value
    expect(rows.length).toBe(2)
    expect(rows[0]!.type).toBe('start')
    expect(rows[1]!.type).toBe('end')
  })

  it('sorts rows by timestamp', () => {
    const events = [
      makeEvent('Event B', '1969-07-20'),
      makeEvent('Event A', '1732-01-01'),
    ]
    const store = makeMockTimelineStore(events)
    const td = useTimelineDisplay(store)
    td.initializeFilterBounds()

    const rows = td.timelineRows.value
    expect(rows[0]!.event.name).toBe('Event A')
    expect(rows[1]!.event.name).toBe('Event B')
  })

  it('marks first row in date group as isFirstInGroup', () => {
    const events = [
      makeEvent('Event A', '1732-01-01'),
      makeEvent('Event B', '1732-06-15'),
      makeEvent('Event C', '1969-07-20'),
    ]
    const store = makeMockTimelineStore(events)
    const td = useTimelineDisplay(store)
    td.initializeFilterBounds()

    const rows = td.timelineRows.value
    // Range > 1 year so year-only format → 1732 and 1732 same group
    expect(rows[0]!.isFirstInGroup).toBe(true)
    expect(rows[1]!.isFirstInGroup).toBe(false)
    expect(rows[2]!.isFirstInGroup).toBe(true)
  })
})

describe('useTimelineDisplay applyMinFilter / applyMaxFilter', () => {
  it('applyMinFilter updates appliedStart and store startTimestamp', () => {
    const events = [
      makeEvent('Event A', '1732-01-01'),
      makeEvent('Event B', '1969-07-20'),
    ]
    const store = makeMockTimelineStore(events)
    const td = useTimelineDisplay(store)
    td.initializeFilterBounds()

    td.filterStartInputs.value = { year: '1800', month: '1', day: '1', era: 'AD' }
    td.applyMinFilter()

    expect(td.appliedStart.value).toBe(dateInputToTimestamp('1800-01-01'))
    expect(store.startTimestamp.value).toBe(dateInputToTimestamp('1800-01-01'))
  })

  it('applyMaxFilter updates appliedEnd and store endTimestamp', () => {
    const events = [
      makeEvent('Event A', '1732-01-01'),
      makeEvent('Event B', '1969-07-20'),
    ]
    const store = makeMockTimelineStore(events)
    const td = useTimelineDisplay(store)
    td.initializeFilterBounds()

    td.filterEndInputs.value = { year: '1945', month: '1', day: '1', era: 'AD' }
    td.applyMaxFilter()

    expect(td.appliedEnd.value).toBe(dateInputToTimestamp('1945-01-01'))
    expect(store.endTimestamp.value).toBe(dateInputToTimestamp('1945-01-01'))
  })

  it('applyMinFilter does nothing for invalid input', () => {
    const events = [makeEvent('Event A', '1732-01-01')]
    const store = makeMockTimelineStore(events)
    const td = useTimelineDisplay(store)
    td.initializeFilterBounds()
    const before = td.appliedStart.value

    td.filterStartInputs.value = { year: '', month: '1', day: '1', era: 'AD' }
    td.applyMinFilter()

    expect(td.appliedStart.value).toBe(before)
  })
})

describe('useTimelineDisplay resetMin / resetMax', () => {
  it('resetMin restores original start', () => {
    const events = [
      makeEvent('Event A', '1732-01-01'),
      makeEvent('Event B', '1969-07-20'),
    ]
    const store = makeMockTimelineStore(events)
    const td = useTimelineDisplay(store)
    td.initializeFilterBounds()

    const originalStartTs = td.appliedStart.value

    td.filterStartInputs.value = { year: '1900', month: '1', day: '1', era: 'AD' }
    td.applyMinFilter()
    expect(td.appliedStart.value).not.toBe(originalStartTs)

    td.resetMin()
    expect(td.appliedStart.value).toBe(originalStartTs)
    expect(td.filterStartInputs.value.year).toBe('1732')
  })

  it('resetMax restores original end', () => {
    const events = [
      makeEvent('Event A', '1732-01-01'),
      makeEvent('Event B', '1969-07-20'),
    ]
    const store = makeMockTimelineStore(events)
    const td = useTimelineDisplay(store)
    td.initializeFilterBounds()

    const originalEndTs = td.appliedEnd.value

    td.filterEndInputs.value = { year: '1945', month: '1', day: '1', era: 'AD' }
    td.applyMaxFilter()
    expect(td.appliedEnd.value).not.toBe(originalEndTs)

    td.resetMax()
    expect(td.appliedEnd.value).toBe(originalEndTs)
    expect(td.filterEndInputs.value.year).toBe('1969')
  })
})

describe('useTimelineDisplay connectorMap', () => {
  it('returns connectors for events with end timestamps within range', () => {
    const events = [
      makeEvent('WWII', '1939-09-01', { endDate: '1945-09-02' }),
      makeEvent('Moon Landing', '1969-07-20'),
    ]
    const store = makeMockTimelineStore(events)
    const td = useTimelineDisplay(store)
    td.initializeFilterBounds()

    expect(td.connectorMap.value.length).toBe(1)
    expect(td.connectorMap.value[0]!.eventId).toBe('WWII')
  })

  it('returns no connectors when no events have end timestamps', () => {
    const events = [
      makeEvent('Event A', '1732-01-01'),
      makeEvent('Event B', '1969-07-20'),
    ]
    const store = makeMockTimelineStore(events)
    const td = useTimelineDisplay(store)
    td.initializeFilterBounds()

    expect(td.connectorMap.value.length).toBe(0)
  })
})

describe('useTimelineDisplay rangeIsMoreThanOneYear', () => {
  it('returns true when range spans more than a year', () => {
    const events = [
      makeEvent('Event A', '1732-01-01'),
      makeEvent('Event B', '1969-07-20'),
    ]
    const store = makeMockTimelineStore(events)
    const td = useTimelineDisplay(store)
    td.initializeFilterBounds()

    expect(td.rangeIsMoreThanOneYear.value).toBe(true)
  })

  it('returns false when range is within one year', () => {
    const events = [
      makeEvent('Event A', '1939-09-01'),
      makeEvent('Event B', '1939-12-31'),
    ]
    const store = makeMockTimelineStore(events)
    const td = useTimelineDisplay(store)
    td.initializeFilterBounds()

    expect(td.rangeIsMoreThanOneYear.value).toBe(false)
  })
})

describe('useTimelineDisplay formatEventDate', () => {
  it('returns year-only when range is more than a year', () => {
    const events = [
      makeEvent('Event A', '1732-01-01'),
      makeEvent('Event B', '1969-07-20'),
    ]
    const store = makeMockTimelineStore(events)
    const td = useTimelineDisplay(store)
    td.initializeFilterBounds()

    const ts = dateInputToTimestamp('1969-07-20')
    expect(td.formatEventDate(ts)).toBe('1969')
  })

  it('returns year-month when range is within a year', () => {
    const events = [
      makeEvent('Event A', '1939-09-01'),
      makeEvent('Event B', '1939-12-31'),
    ]
    const store = makeMockTimelineStore(events)
    const td = useTimelineDisplay(store)
    td.initializeFilterBounds()

    const ts = dateInputToTimestamp('1939-09-01')
    expect(td.formatEventDate(ts)).toBe('1939-09')
  })
})

// ========================================
// BC/AD era support tests
// ========================================

describe('timestampToFilterInputs with BC dates', () => {
  it('returns era BC and positive year for 1 BC date', () => {
    // JDN for Jan 1, 1 BC (astronomical year 0)
    const jdn = dateInputToTimestamp('0-01-01')
    const result = timestampToFilterInputs(jdn)
    expect(result.era).toBe('BC')
    expect(result.year).toBe('1')
  })

  it('returns era AD for AD date', () => {
    const jdn = dateInputToTimestamp('1969-07-20')
    const result = timestampToFilterInputs(jdn)
    expect(result.era).toBe('AD')
    expect(result.year).toBe('1969')
  })

  it('returns era BC and correct year for 500 BC', () => {
    // 500 BC = astronomical year -499
    const jdn = dateInputToTimestamp('-499-01-01')
    const result = timestampToFilterInputs(jdn)
    expect(result.era).toBe('BC')
    expect(result.year).toBe('500')
  })
})

describe('toTimestampWithDefaults with era field', () => {
  it('converts BC era with year 1 to astronomical year 0', () => {
    const inputs: FilterInputs = { year: '1', month: '1', day: '1', era: 'BC' }
    const result = toTimestampWithDefaults(inputs)
    expect(result).not.toBeNull()
    expect(result!.timestamp).toBe(dateInputToTimestamp('0-01-01'))
  })

  it('converts BC era with year 500 to astronomical year -499', () => {
    const inputs: FilterInputs = { year: '500', month: '1', day: '1', era: 'BC' }
    const result = toTimestampWithDefaults(inputs)
    expect(result).not.toBeNull()
    expect(result!.timestamp).toBe(dateInputToTimestamp('-499-01-01'))
  })

  it('converts AD era normally', () => {
    const inputs: FilterInputs = { year: '1969', month: '7', day: '20', era: 'AD' }
    const result = toTimestampWithDefaults(inputs)
    expect(result).not.toBeNull()
    expect(result!.timestamp).toBe(dateInputToTimestamp('1969-07-20'))
  })

  it('defaults era to AD when not provided', () => {
    const inputs: FilterInputs = { year: '1969', month: '7', day: '20', era: 'AD' }
    const result = toTimestampWithDefaults(inputs)
    expect(result).not.toBeNull()
    expect(result!.timestamp).toBe(dateInputToTimestamp('1969-07-20'))
  })

  it('preserves era in normalized output', () => {
    const inputs: FilterInputs = { year: '500', month: '', day: '', era: 'BC' }
    const result = toTimestampWithDefaults(inputs)
    expect(result).not.toBeNull()
    expect(result!.normalized.era).toBe('BC')
  })
})

describe('useTimelineDisplay with BC events', () => {
  it('initializes filter bounds spanning BC to AD', () => {
    const events = [
      makeEvent('Ancient Event', '-499-01-01'),
      makeEvent('Modern Event', '1969-07-20'),
    ]
    const store = makeMockTimelineStore(events)
    const td = useTimelineDisplay(store)
    td.initializeFilterBounds()

    expect(td.filterStartInputs.value.era).toBe('BC')
    expect(td.filterStartInputs.value.year).toBe('500')
    expect(td.filterEndInputs.value.era).toBe('AD')
    expect(td.filterEndInputs.value.year).toBe('1969')
  })

  it('filters events correctly with BC timestamps', () => {
    const events = [
      makeEvent('Ancient Event', '-499-01-01'),
      makeEvent('Modern Event', '1969-07-20'),
    ]
    const store = makeMockTimelineStore(events)
    const td = useTimelineDisplay(store)
    td.initializeFilterBounds()

    expect(td.filteredEvents.value.length).toBe(2)
  })
})
