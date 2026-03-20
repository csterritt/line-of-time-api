import { computed, ref, watch } from 'vue'

import type { EventResponse } from '../stores/event-store'
import type { TimelineStore } from '../stores/panel-store'
import { getEventBounds } from '../stores/panel-store'
import {
  dateInputToTimestamp,
  timestampToDateInput,
  timestampToYear,
  timestampToYearMonth,
  isTimestampBC,
  DAYS_PER_YEAR,
} from '../utils/timestamp'
import { connectorColor } from '../utils/pastel-colors'

export type Era = 'AD' | 'BC'

export type FilterInputs = {
  year: string
  month: string
  day: string
  era: Era
}

export type TimelineEntry = {
  timestamp: number
  dateLabel: string
  type: 'start' | 'end'
  event: EventResponse
}

export type TimelineRow = TimelineEntry & {
  isFirstInGroup: boolean
}

export type ConnectorInfo = {
  eventId: string
  colorIndex: number
  startRowIndex: number
  endRowIndex: number
}

export type ConnectorLine = {
  eventId: string
  color: string
  startX: number
  startY: number
  endX: number
  endY: number
}

export const parsePositiveInteger = (value: string): number | null => {
  if (!/^\d+$/.test(value)) {
    return null
  }
  const parsed = parseInt(value, 10)
  if (parsed <= 0) {
    return null
  }
  return parsed
}

export const timestampToFilterInputs = (timestamp: number): FilterInputs => {
  const [year = '', month = '', day = ''] = timestampToDateInput(timestamp).split('-')
  const bc = isTimestampBC(timestamp)
  return { year, month, day, era: bc ? 'BC' : 'AD' }
}

export const toTimestampWithDefaults = (
  inputs: FilterInputs
): { timestamp: number; normalized: FilterInputs } | null => {
  const year = parsePositiveInteger(inputs.year)
  if (year == null) {
    return null
  }

  const month = inputs.month.trim() === '' ? 1 : parsePositiveInteger(inputs.month)
  if (month == null || month > 12) {
    return null
  }

  const day = inputs.day.trim() === '' ? 1 : parsePositiveInteger(inputs.day)
  if (day == null || day > 31) {
    return null
  }

  const era: Era = inputs.era ?? 'AD'
  const astronomicalYear = era === 'BC' ? 1 - year : year

  const monthStr = String(month).padStart(2, '0')
  const dayStr = String(day).padStart(2, '0')
  const yearStr = String(Math.abs(astronomicalYear)).padStart(4, '0')
  const yearPrefix = astronomicalYear < 0 ? '-' : ''
  const timestamp = dateInputToTimestamp(`${yearPrefix}${yearStr}-${monthStr}-${dayStr}`)

  return {
    timestamp,
    normalized: {
      year: inputs.year,
      month: String(month),
      day: String(day),
      era,
    },
  }
}

export const endDescription = (evt: EventResponse): string => {
  return evt.eventType === 'person' ? `Death of ${evt.name}` : `End of ${evt.name}`
}

export const computeLaneAssignments = (connectors: ConnectorInfo[]): Map<string, number> => {
  const lanes = new Map<string, number>()
  const sorted = [...connectors].sort((a, b) => a.startRowIndex - b.startRowIndex)

  const activeLaneEnds: number[] = []

  for (const conn of sorted) {
    let assignedLane = -1
    for (let i = 0; i < activeLaneEnds.length; i++) {
      if (activeLaneEnds[i]! <= conn.startRowIndex) {
        assignedLane = i
        break
      }
    }

    if (assignedLane === -1) {
      assignedLane = activeLaneEnds.length
      activeLaneEnds.push(0)
    }

    activeLaneEnds[assignedLane] = conn.endRowIndex
    lanes.set(conn.eventId, assignedLane)
  }

  return lanes
}

export const useTimelineDisplay = (store: TimelineStore) => {
  const parentEvents = computed(() => store.parentLens.events.value)

  const originalStart = ref(store.startTimestamp.value)
  const originalEnd = ref(store.endTimestamp.value)
  const filterStartInputs = ref<FilterInputs>(
    timestampToFilterInputs(store.startTimestamp.value)
  )
  const filterEndInputs = ref<FilterInputs>(timestampToFilterInputs(store.endTimestamp.value))
  const appliedStart = ref(store.startTimestamp.value)
  const appliedEnd = ref(store.endTimestamp.value)

  const initializeFilterBounds = () => {
    const events = parentEvents.value
    if (events.length === 0) {
      return
    }
    const { minTimestamp, maxTimestamp } = getEventBounds(events)
    if (minTimestamp == null || maxTimestamp == null) {
      return
    }
    originalStart.value = minTimestamp
    originalEnd.value = maxTimestamp
    appliedStart.value = minTimestamp
    appliedEnd.value = maxTimestamp
    filterStartInputs.value = timestampToFilterInputs(minTimestamp)
    filterEndInputs.value = timestampToFilterInputs(maxTimestamp)
  }

  watch(parentEvents, () => {
    initializeFilterBounds()
  })

  const rangeIsMoreThanOneYear = computed(() => {
    return appliedEnd.value - appliedStart.value > DAYS_PER_YEAR
  })

  const applyMinFilter = () => {
    const parsed = toTimestampWithDefaults(filterStartInputs.value)
    if (parsed == null) {
      return
    }
    appliedStart.value = parsed.timestamp
    filterStartInputs.value = parsed.normalized
    store.startTimestamp.value = parsed.timestamp
  }

  const applyMaxFilter = () => {
    const parsed = toTimestampWithDefaults(filterEndInputs.value)
    if (parsed == null) {
      return
    }
    appliedEnd.value = parsed.timestamp
    filterEndInputs.value = parsed.normalized
    store.endTimestamp.value = parsed.timestamp
  }

  const resetMin = () => {
    appliedStart.value = originalStart.value
    filterStartInputs.value = timestampToFilterInputs(originalStart.value)
    store.startTimestamp.value = originalStart.value
  }

  const resetMax = () => {
    appliedEnd.value = originalEnd.value
    filterEndInputs.value = timestampToFilterInputs(originalEnd.value)
    store.endTimestamp.value = originalEnd.value
  }

  const formatEventDate = (timestamp: number): string => {
    if (rangeIsMoreThanOneYear.value) {
      return timestampToYear(timestamp)
    }
    return timestampToYearMonth(timestamp)
  }

  const filteredEvents = computed(() => {
    return parentEvents.value.filter(
      (evt) => evt.startTimestamp >= appliedStart.value && evt.startTimestamp <= appliedEnd.value
    )
  })

  const timelineRows = computed((): TimelineRow[] => {
    const entries: TimelineEntry[] = []

    for (const evt of filteredEvents.value) {
      entries.push({
        timestamp: evt.startTimestamp,
        dateLabel: formatEventDate(evt.startTimestamp),
        type: 'start',
        event: evt,
      })
      if (evt.endTimestamp != null && evt.endTimestamp <= appliedEnd.value) {
        entries.push({
          timestamp: evt.endTimestamp,
          dateLabel: formatEventDate(evt.endTimestamp),
          type: 'end',
          event: evt,
        })
      }
    }

    entries.sort((a, b) => {
      if (a.timestamp !== b.timestamp) {
        return a.timestamp - b.timestamp
      }
      return a.type === 'start' ? -1 : 1
    })

    const rows: TimelineRow[] = []
    let lastDateLabel = ''
    for (const entry of entries) {
      const isFirstInGroup = entry.dateLabel !== lastDateLabel
      if (isFirstInGroup) {
        lastDateLabel = entry.dateLabel
      }
      rows.push({ ...entry, isFirstInGroup })
    }

    return rows
  })

  const eventsWithConnectors = computed(() => {
    return filteredEvents.value.filter(
      (evt) => evt.endTimestamp != null && evt.endTimestamp <= appliedEnd.value
    )
  })

  const connectorMap = computed((): ConnectorInfo[] => {
    const rows = timelineRows.value
    const result: ConnectorInfo[] = []
    let colorIndex = 0

    for (const evt of eventsWithConnectors.value) {
      const startIdx = rows.findIndex((r) => r.event.id === evt.id && r.type === 'start')
      const endIdx = rows.findIndex((r) => r.event.id === evt.id && r.type === 'end')
      if (startIdx >= 0 && endIdx >= 0) {
        result.push({
          eventId: evt.id,
          colorIndex,
          startRowIndex: startIdx,
          endRowIndex: endIdx,
        })
        colorIndex++
      }
    }

    return result
  })

  const connectorLines = ref<ConnectorLine[]>([])
  const svgWidth = ref(0)
  const svgHeight = ref(0)

  const drawConnectors = (grid: HTMLElement) => {
    const connectors = connectorMap.value
    if (connectors.length === 0) {
      connectorLines.value = []
      svgWidth.value = 0
      svgHeight.value = 0
      return
    }

    svgWidth.value = grid.scrollWidth
    svgHeight.value = grid.scrollHeight

    const laneAssignments = computeLaneAssignments(connectors)
    const separatorWidth = 24
    const offsetStep = 5
    const lines: ConnectorLine[] = []

    for (const conn of connectors) {
      const startSep = grid.querySelector(
        `[data-connector-id="start-${conn.eventId}"]`
      ) as HTMLElement | null
      const endSep = grid.querySelector(
        `[data-connector-id="end-${conn.eventId}"]`
      ) as HTMLElement | null

      if (!startSep || !endSep) {
        continue
      }

      const gridRect = grid.getBoundingClientRect()
      const startRect = startSep.getBoundingClientRect()
      const endRect = endSep.getBoundingClientRect()

      const lane = laneAssignments.get(conn.eventId) ?? 0
      const xOffset = separatorWidth - 4 - lane * offsetStep
      const xMid = startRect.left - gridRect.left + Math.max(xOffset, 4)
      const xRight = startRect.right - gridRect.left - 2

      const yStartCenter = startRect.top - gridRect.top + startRect.height / 2
      const yEndCenter = endRect.top - gridRect.top + endRect.height / 2

      const color = connectorColor(conn.colorIndex)

      lines.push({
        eventId: conn.eventId,
        color,
        startX: xMid,
        startY: yStartCenter,
        endX: xRight,
        endY: yStartCenter,
      })

      lines.push({
        eventId: conn.eventId,
        color,
        startX: xMid,
        startY: yStartCenter,
        endX: xMid,
        endY: yEndCenter,
      })

      lines.push({
        eventId: conn.eventId,
        color,
        startX: xMid,
        startY: yEndCenter,
        endX: xRight,
        endY: yEndCenter,
      })
    }

    connectorLines.value = lines
  }

  return {
    parentEvents,
    originalStart,
    originalEnd,
    filterStartInputs,
    filterEndInputs,
    appliedStart,
    appliedEnd,
    initializeFilterBounds,
    rangeIsMoreThanOneYear,
    applyMinFilter,
    applyMaxFilter,
    resetMin,
    resetMax,
    formatEventDate,
    filteredEvents,
    timelineRows,
    eventsWithConnectors,
    connectorMap,
    connectorLines,
    svgWidth,
    svgHeight,
    drawConnectors,
  }
}
