<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'

import { usePanelStore, type TimelineStore } from '@/stores/panel-store'
import {
  useTimelineDisplay,
  endDescription,
} from '@/composables/useTimelineDisplay'
import TimelineFilterControls from './TimelineFilterControls.vue'

const props = defineProps<{
  store: TimelineStore
}>()

const panelStore = usePanelStore()

const {
  filterStartInputs,
  filterEndInputs,
  initializeFilterBounds,
  applyMinFilter,
  applyMaxFilter,
  resetMin,
  resetMax,
  timelineRows,
  connectorMap,
  connectorLines,
  svgWidth,
  svgHeight,
  drawConnectors,
} = useTimelineDisplay(props.store)

const gridRef = ref<HTMLElement | null>(null)
const gridWrapperRef = ref<HTMLElement | null>(null)

const redraw = () => {
  const grid = gridRef.value
  if (grid) {
    drawConnectors(grid)
  }
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  initializeFilterBounds()

  nextTick(() => {
    redraw()
  })

  const wrapper = gridWrapperRef.value
  if (wrapper) {
    resizeObserver = new ResizeObserver(() => {
      redraw()
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
    redraw()
  })
})
</script>

<template>
  <div class="flex flex-row items-start gap-4 w-[66vw] shrink-0">
    <div class="card bg-base-100 shadow-xl flex-grow h-full">
      <div class="card-body">
        <h2 class="card-title mb-4">Timeline</h2>
        <TimelineFilterControls
          :filter-start-inputs="filterStartInputs"
          :filter-end-inputs="filterEndInputs"
          @apply-min="applyMinFilter"
          @apply-max="applyMaxFilter"
          @reset-min="resetMin"
          @reset-max="resetMax"
        />
        <div v-if="timelineRows.length > 0" ref="gridWrapperRef" class="relative">
          <div
            ref="gridRef"
            class="grid grid-cols-[auto_auto_1fr] gap-y-2"
            data-testid="event-list"
          >
            <template
              v-for="(row, idx) in timelineRows"
              :key="`${row.event.id}-${row.type}-${idx}`"
            >
              <div class="font-mono text-sm text-right" data-testid="timeline-date-cell">
                <span v-if="row.isFirstInGroup">{{ row.dateLabel }}</span>
              </div>
              <div
                class="w-8 border-l border-base-300 mx-2"
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
              stroke-width="4"
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
