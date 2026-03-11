<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'

import type { EventResponse } from '@/stores/event-store'
import { usePanelStore, type TimelineStore } from '@/stores/panel-store'
import {
  dateInputToTimestamp,
  timestampToDateInput,
  timestampToYear,
  timestampToYearMonth,
  DAYS_PER_YEAR,
} from '@/utils/timestamp'
import { connectorColor } from '@/utils/pastel-colors'

const props = defineProps<{
  store: TimelineStore
}>()

const panelStore = usePanelStore()

type FilterInputs = {
  year: string
  month: string
  day: string
}

const timestampToFilterInputs = (timestamp: number): FilterInputs => {
  const [year = '', month = '', day = ''] = timestampToDateInput(timestamp).split('-')
  return { year, month, day }
}

const parsePositiveInteger = (value: string): number | null => {
  if (!/^\d+$/.test(value)) {
    return null
  }
  const parsed = parseInt(value, 10)
  if (parsed <= 0) {
    return null
  }
  return parsed
}

const toTimestampWithDefaults = (
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

  const monthStr = String(month).padStart(2, '0')
  const dayStr = String(day).padStart(2, '0')
  const timestamp = dateInputToTimestamp(`${inputs.year.padStart(4, '0')}-${monthStr}-${dayStr}`)

  return {
    timestamp,
    normalized: {
      year: inputs.year,
      month: String(month),
      day: String(day),
    },
  }
}

const computeEventMinMax = (
  events: EventResponse[]
): { minTimestamp: number | null; maxTimestamp: number | null } => {
  if (events.length === 0) {
    return { minTimestamp: null, maxTimestamp: null }
  }

  let minTimestamp = events[0]!.startTimestamp
  let maxTimestamp = events[0]!.endTimestamp ?? events[0]!.startTimestamp

  for (const event of events) {
    if (event.startTimestamp < minTimestamp) {
      minTimestamp = event.startTimestamp
    }
    const eventMax = event.endTimestamp ?? event.startTimestamp
    if (eventMax > maxTimestamp) {
      maxTimestamp = eventMax
    }
  }

  return { minTimestamp, maxTimestamp }
}

const parentEvents = computed(() => props.store.parentLens.events.value)

const originalStart = ref(props.store.startTimestamp.value)
const originalEnd = ref(props.store.endTimestamp.value)
const filterStartInputs = ref<FilterInputs>(
  timestampToFilterInputs(props.store.startTimestamp.value)
)
const filterEndInputs = ref<FilterInputs>(timestampToFilterInputs(props.store.endTimestamp.value))
const appliedStart = ref(props.store.startTimestamp.value)
const appliedEnd = ref(props.store.endTimestamp.value)

const initializeFilterBounds = () => {
  const events = parentEvents.value
  if (events.length === 0) {
    return
  }
  const { minTimestamp, maxTimestamp } = computeEventMinMax(events)
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
  props.store.startTimestamp.value = parsed.timestamp
}

const applyMaxFilter = () => {
  const parsed = toTimestampWithDefaults(filterEndInputs.value)
  if (parsed == null) {
    return
  }
  appliedEnd.value = parsed.timestamp
  filterEndInputs.value = parsed.normalized
  props.store.endTimestamp.value = parsed.timestamp
}

const resetMin = () => {
  appliedStart.value = originalStart.value
  filterStartInputs.value = timestampToFilterInputs(originalStart.value)
  props.store.startTimestamp.value = originalStart.value
}

const resetMax = () => {
  appliedEnd.value = originalEnd.value
  filterEndInputs.value = timestampToFilterInputs(originalEnd.value)
  props.store.endTimestamp.value = originalEnd.value
}

const formatEventDate = (timestamp: number): string => {
  if (rangeIsMoreThanOneYear.value) {
    return timestampToYear(timestamp)
  }
  return timestampToYearMonth(timestamp)
}

type TimelineEntry = {
  timestamp: number
  dateLabel: string
  type: 'start' | 'end'
  event: EventResponse
}

type TimelineRow = TimelineEntry & {
  isFirstInGroup: boolean
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

const endDescription = (evt: EventResponse): string => {
  return evt.eventType === 'person' ? `Death of ${evt.name}` : `End of ${evt.name}`
}

type ConnectorInfo = {
  eventId: string
  colorIndex: number
  startRowIndex: number
  endRowIndex: number
}

const eventsWithConnectors = computed(() => {
  return filteredEvents.value.filter(
    (evt) =>
      evt.endTimestamp != null && evt.endTimestamp <= appliedEnd.value
  )
})

const connectorMap = computed((): ConnectorInfo[] => {
  const rows = timelineRows.value
  const result: ConnectorInfo[] = []
  let colorIndex = 0

  for (const evt of eventsWithConnectors.value) {
    const startIdx = rows.findIndex(
      (r) => r.event.id === evt.id && r.type === 'start'
    )
    const endIdx = rows.findIndex(
      (r) => r.event.id === evt.id && r.type === 'end'
    )
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

type ConnectorLine = {
  eventId: string
  color: string
  startX: number
  startY: number
  endX: number
  endY: number
}

const connectorLines = ref<ConnectorLine[]>([])
const svgWidth = ref(0)
const svgHeight = ref(0)
const gridRef = ref<HTMLElement | null>(null)
const gridWrapperRef = ref<HTMLElement | null>(null)

const computeOverlapOffsets = (
  connectors: ConnectorInfo[]
): Map<string, number> => {
  const offsets = new Map<string, number>()
  const sorted = [...connectors].sort(
    (a, b) => a.startRowIndex - b.startRowIndex
  )

  for (let i = 0; i < sorted.length; i++) {
    let offset = 0
    for (let j = 0; j < i; j++) {
      const prev = sorted[j]!
      const curr = sorted[i]!
      if (prev.endRowIndex > curr.startRowIndex) {
        offset++
      }
    }
    offsets.set(sorted[i]!.eventId, offset)
  }

  return offsets
}

const drawConnectors = () => {
  const grid = gridRef.value
  if (!grid) {
    return
  }

  const connectors = connectorMap.value
  if (connectors.length === 0) {
    connectorLines.value = []
    svgWidth.value = 0
    svgHeight.value = 0
    return
  }

  svgWidth.value = grid.scrollWidth
  svgHeight.value = grid.scrollHeight

  const overlapOffsets = computeOverlapOffsets(connectors)
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

    const overlap = overlapOffsets.get(conn.eventId) ?? 0
    const xOffset = separatorWidth - 4 - overlap * offsetStep
    const xMid = startRect.left - gridRect.left + Math.max(xOffset, 4)
    const xRight = startRect.right - gridRect.left - 2

    const yStartCenter =
      startRect.top - gridRect.top + startRect.height / 2
    const yEndCenter =
      endRect.top - gridRect.top + endRect.height / 2

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

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  initializeFilterBounds()

  nextTick(() => {
    drawConnectors()
  })

  const wrapper = gridWrapperRef.value
  if (wrapper) {
    resizeObserver = new ResizeObserver(() => {
      drawConnectors()
    })
    resizeObserver.observe(wrapper)
  }
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})

watch(timelineRows, () => {
  nextTick(() => {
    drawConnectors()
  })
})
</script>

<template>
  <div class="flex flex-row items-start gap-4 w-[66vw] shrink-0">
    <div class="card bg-base-100 shadow-xl flex-grow h-full">
      <div class="card-body">
        <h2 class="card-title mb-4">Timeline</h2>
        <div class="mb-4 grid gap-3 lg:grid-cols-2" data-testid="filter-controls">
          <form class="grid grid-cols-4 items-end gap-2" @submit.prevent="applyMinFilter">
            <label class="form-control">
              <span class="label-text text-xs mb-1">Min year</span>
              <input
                v-model="filterStartInputs.year"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                class="input input-bordered input-sm w-20"
                data-testid="filter-min-year"
              />
            </label>
            <label class="form-control">
              <span class="label-text text-xs mb-1">Min month</span>
              <input
                v-model="filterStartInputs.month"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                class="input input-bordered input-sm w-16"
                data-testid="filter-min-month"
              />
            </label>
            <label class="form-control">
              <span class="label-text text-xs mb-1">Min day</span>
              <input
                v-model="filterStartInputs.day"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                class="input input-bordered input-sm w-16"
                data-testid="filter-min-day"
              />
            </label>
            <button class="btn btn-outline btn-sm" data-testid="filter-min-go-action" type="submit">
              Go
            </button>
          </form>
          <div class="flex items-end">
            <button class="btn btn-outline btn-sm" data-testid="reset-min-action" @click="resetMin">
              Reset min
            </button>
          </div>
          <form class="grid grid-cols-4 items-end gap-2" @submit.prevent="applyMaxFilter">
            <label class="form-control">
              <span class="label-text text-xs mb-1">Max year</span>
              <input
                v-model="filterEndInputs.year"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                class="input input-bordered input-sm w-20"
                data-testid="filter-max-year"
              />
            </label>
            <label class="form-control">
              <span class="label-text text-xs mb-1">Max month</span>
              <input
                v-model="filterEndInputs.month"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                class="input input-bordered input-sm w-16"
                data-testid="filter-max-month"
              />
            </label>
            <label class="form-control">
              <span class="label-text text-xs mb-1">Max day</span>
              <input
                v-model="filterEndInputs.day"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                class="input input-bordered input-sm w-16"
                data-testid="filter-max-day"
              />
            </label>
            <button class="btn btn-outline btn-sm" data-testid="filter-max-go-action" type="submit">
              Go
            </button>
          </form>
          <div class="flex items-end">
            <button class="btn btn-outline btn-sm" data-testid="reset-max-action" @click="resetMax">
              Reset max
            </button>
          </div>
        </div>
        <div v-if="timelineRows.length > 0" ref="gridWrapperRef" class="relative">
          <div
            ref="gridRef"
            class="grid grid-cols-[auto_auto_1fr] gap-y-2"
            data-testid="event-list"
          >
            <template v-for="(row, idx) in timelineRows" :key="`${row.event.id}-${row.type}-${idx}`">
              <div class="font-mono text-sm text-right" data-testid="timeline-date-cell">
                <span v-if="row.isFirstInGroup">{{ row.dateLabel }}</span>
              </div>
              <div
                class="w-6 border-l border-base-300 mx-2"
                data-testid="timeline-separator"
                :data-connector-id="`${row.type}-${row.event.id}`"
              ></div>
              <div class="min-w-0 self-center" data-testid="timeline-row">
                <template v-if="row.type === 'start'">
                  <span class="font-bold" data-testid="event-name">{{ row.event.name }}</span>
                  <div
                    class="truncate text-sm"
                    :title="row.event.basicDescription"
                    data-testid="event-description"
                  >
                    {{ row.event.basicDescription }}
                  </div>
                </template>
                <template v-else>
                  <em data-testid="event-end-description">{{ endDescription(row.event) }}</em>
                </template>
              </div>
            </template>
          </div>
          <svg
            v-if="connectorLines.length > 0"
            :width="svgWidth"
            :height="svgHeight"
            class="absolute top-0 left-0 pointer-events-none"
            data-testid="connector-svg"
          >
            <line
              v-for="(line, lineIdx) in connectorLines"
              :key="lineIdx"
              :x1="line.startX"
              :y1="line.startY"
              :x2="line.endX"
              :y2="line.endY"
              :stroke="line.color"
              stroke-width="2"
              :data-connector-event="line.eventId"
              data-testid="connector-line"
            />
          </svg>
        </div>
        <p v-else data-testid="no-events-message">No events yet</p>
      </div>
    </div>

    <button
      v-if="store.parentLens.isLast.value"
      class="btn btn-circle btn-secondary flex-shrink-0 mt-2"
      @click="panelStore.addLensPanel()"
      title="Add Lens Panel"
      data-testid="add-lens-panel-action"
    >
      +
    </button>
  </div>
</template>
