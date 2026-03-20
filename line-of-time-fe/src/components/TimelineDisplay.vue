<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'

import { usePanelStore, type TimelineStore } from '@/stores/panel-store'
import { useTimelineDisplay, endDescription } from '@/composables/useTimelineDisplay'
import { isTimestampBC } from '@/utils/timestamp'
import { useUserInfoStore } from '@/stores/user-info'
import TimelineFilterControls from './TimelineFilterControls.vue'

const props = defineProps<{
  store: TimelineStore
}>()

const panelStore = usePanelStore()
const userInfo = useUserInfoStore()
const router = useRouter()

const {
  filterStartInputs,
  filterEndInputs,
  initializeFilterBounds,
  applyMinFilter,
  applyMaxFilter,
  resetMin,
  resetMax,
  timelineRows,
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
              <div
                :class="[
                  'font-mono text-sm text-right',
                  isTimestampBC(row.timestamp) ? 'bg-base-200 italic' : '',
                ]"
                data-testid="timeline-date-cell"
              >
                <span v-if="row.isFirstInGroup">{{ row.dateLabel }}</span>
              </div>
              <div
                class="w-8 border-l border-base-300 mx-2"
                data-testid="timeline-separator"
                :data-connector-id="`${row.type}-${row.event.id}`"
              ></div>
              <div class="min-w-0 self-center flex flex-row items-center gap-2" data-testid="timeline-row">
                <div class="min-w-0 flex-1">
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
                <button
                  v-if="userInfo.isAdmin && row.type === 'start'"
                  class="btn btn-ghost btn-xs"
                  :title="'Edit ' + row.event.name"
                  :data-testid="'edit-event-' + row.event.id + '-action'"
                  @click="router.push('/edit-event/' + row.event.id)"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M15.232 5.232l3.536 3.536M9 11l-4 4v4h4l4-4-4-4zm6.232-5.768a2 2 0 012.828 2.828L12 14H8v-4l6.232-6.232z"
                    />
                  </svg>
                </button>
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
