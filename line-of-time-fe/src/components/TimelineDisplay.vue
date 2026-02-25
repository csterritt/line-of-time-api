<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'

import type { EventResponse } from '@/stores/event-store'
import { usePanelStore, type TimelinePanel } from '@/stores/panel-store'
import { useUserInfoStore } from '@/stores/user-info'
import {
  dateInputToTimestamp,
  timestampToDateInput,
  timestampToYear,
  timestampToYearMonth,
  DAYS_PER_YEAR,
} from '@/utils/timestamp'

const props = defineProps<{
  panel: TimelinePanel
}>()

const panelStore = usePanelStore()
const userInfo = useUserInfoStore()

const PANEL_DEFAULT_MIN = -99999999999
const PANEL_DEFAULT_MAX = 99999999999

const localEvents = ref<EventResponse[]>([])
const originalStart = ref(props.panel.startTimestamp)
const originalEnd = ref(props.panel.endTimestamp)
const filterStart = ref(timestampToDateInput(props.panel.startTimestamp))
const filterEnd = ref(timestampToDateInput(props.panel.endTimestamp))

const parseStart = computed(() => dateInputToTimestamp(filterStart.value))
const parseEnd = computed(() => dateInputToTimestamp(filterEnd.value))

const computeEventMinMax = (
  events: EventResponse[],
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

const fetchEventsForPanel = async () => {
  const s = parseStart.value
  const e = parseEnd.value
  try {
    const response = await fetch(`/time-info/events/${s}/${e}`)
    if (response.ok) {
      localEvents.value = (await response.json()) as EventResponse[]
    } else {
      localEvents.value = []
    }
  } catch {
    localEvents.value = []
  }
}

const initializeFilterBounds = async () => {
  const panelUsesDefaultBounds =
    props.panel.startTimestamp === PANEL_DEFAULT_MIN &&
    props.panel.endTimestamp === PANEL_DEFAULT_MAX

  if (!panelUsesDefaultBounds) {
    await fetchEventsForPanel()
    return
  }

  try {
    const response = await fetch(`/time-info/events/${PANEL_DEFAULT_MIN}/${PANEL_DEFAULT_MAX}`)
    if (!response.ok) {
      await fetchEventsForPanel()
      return
    }

    const allEvents = (await response.json()) as EventResponse[]
    const { minTimestamp, maxTimestamp } = computeEventMinMax(allEvents)

    if (minTimestamp == null || maxTimestamp == null) {
      await fetchEventsForPanel()
      return
    }

    originalStart.value = minTimestamp
    originalEnd.value = maxTimestamp
    filterStart.value = timestampToDateInput(minTimestamp)
    filterEnd.value = timestampToDateInput(maxTimestamp)
    await fetchEventsForPanel()
  } catch {
    await fetchEventsForPanel()
  }
}

onMounted(() => {
  initializeFilterBounds()
})

watch(() => props.panel, fetchEventsForPanel, { deep: true })

watch(
  () => [props.panel.startTimestamp, props.panel.endTimestamp],
  ([nextStart, nextEnd]) => {
    if (nextStart === PANEL_DEFAULT_MIN && nextEnd === PANEL_DEFAULT_MAX) {
      return
    }

    originalStart.value = nextStart
    originalEnd.value = nextEnd
    filterStart.value = timestampToDateInput(nextStart)
    filterEnd.value = timestampToDateInput(nextEnd)
    fetchEventsForPanel()
  },
)

const rangeIsMoreThanOneYear = computed(() => {
  const start = parseStart.value
  const end = parseEnd.value
  if (start == null || end == null) {
    return true
  }
  return end - start > DAYS_PER_YEAR
})

const applyFilter = () => {
  fetchEventsForPanel()
}

const resetMin = () => {
  filterStart.value = timestampToDateInput(originalStart.value)
  fetchEventsForPanel()
}

const resetMax = () => {
  filterEnd.value = timestampToDateInput(originalEnd.value)
  fetchEventsForPanel()
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

const timelineRows = computed((): TimelineRow[] => {
  const entries: TimelineEntry[] = []

  for (const evt of localEvents.value) {
    entries.push({
      timestamp: evt.startTimestamp,
      dateLabel: formatEventDate(evt.startTimestamp),
      type: 'start',
      event: evt,
    })
    if (evt.endTimestamp != null) {
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
</script>

<template>
  <div class="flex flex-row items-center gap-4 w-[66vw] shrink-0">
    <div class="card bg-base-100 shadow-xl flex-grow h-full overflow-y-auto max-h-[calc(100vh-8rem)]">
      <div class="card-body">
        <h2 class="card-title mb-4">Timeline</h2>
        <div
          v-if="userInfo.isSignedIn && timelineRows.length > 0"
          class="mb-4 flex flex-wrap items-end gap-2"
          data-testid="filter-controls"
        >
          <label class="form-control">
            <span class="label-text text-xs">Min date</span>
            <input
              v-model="filterStart"
              type="date"
              class="input input-bordered input-sm"
              data-testid="filter-min-date"
              @change="applyFilter"
            />
          </label>
          <button
            class="btn btn-outline btn-sm"
            data-testid="reset-min-action"
            @click="resetMin"
          >
            Reset min
          </button>
          <label class="form-control">
            <span class="label-text text-xs">Max date</span>
            <input
              v-model="filterEnd"
              type="date"
              class="input input-bordered input-sm"
              data-testid="filter-max-date"
              @change="applyFilter"
            />
          </label>
          <button
            class="btn btn-outline btn-sm"
            data-testid="reset-max-action"
            @click="resetMax"
          >
            Reset max
          </button>
        </div>
        <div
          v-if="timelineRows.length > 0"
          class="grid grid-cols-[auto_auto_1fr] gap-y-2"
          data-testid="event-list"
        >
          <template
            v-for="(row, idx) in timelineRows"
            :key="`${row.event.id}-${row.type}-${idx}`"
          >
            <div
              class="font-mono text-sm self-center pr-2"
              data-testid="timeline-date-cell"
            >
              <span v-if="row.isFirstInGroup">{{ row.dateLabel }}</span>
            </div>
            <div class="divider divider-horizontal mx-2"></div>
            <div class="min-w-0 self-center" data-testid="timeline-row">
              <template v-if="row.type === 'start'">
                <span class="font-bold" data-testid="event-name">{{ row.event.name }}</span>
                <div
                  class="truncate text-sm"
                  :title="row.event.basicDescription"
                  data-testid="event-description"
                >{{ row.event.basicDescription }}</div>
              </template>
              <template v-else>
                <em data-testid="event-end-description">{{ endDescription(row.event) }}</em>
              </template>
            </div>
          </template>
        </div>
        <p v-else data-testid="no-events-message">No events yet</p>
      </div>
    </div>
    
    <button 
      class="btn btn-circle btn-secondary flex-shrink-0"
      @click="panelStore.addLensPanel()"
      title="Add Lens Panel"
      data-testid="add-lens-panel-button"
    >
      +
    </button>
  </div>
</template>

