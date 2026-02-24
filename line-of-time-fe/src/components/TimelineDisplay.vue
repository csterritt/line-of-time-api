<script setup lang="ts">
import { computed } from 'vue'
import type { EventResponse } from '@/stores/event-store'
import {
  timestampToYear,
  timestampToYearMonth,
  DAYS_PER_YEAR,
} from '@/utils/timestamp'

const props = defineProps<{
  events: EventResponse[]
  filterStart: number | null
  filterEnd: number | null
}>()

const rangeIsMoreThanOneYear = computed(() => {
  const start = props.filterStart
  const end = props.filterEnd
  if (start == null || end == null) {
    return true
  }
  return end - start > DAYS_PER_YEAR
})

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

  for (const evt of props.events) {
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
</template>
