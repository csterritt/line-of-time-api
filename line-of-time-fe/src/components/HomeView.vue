<script setup lang="ts">
import { computed, watch } from 'vue'
import { useUserInfoStore } from '@/stores/user-info'
import { useEventStore } from '@/stores/event-store'
import {
  timestampToYear,
  timestampToYearMonth,
  timestampToDateInput,
  dateInputToTimestamp,
  DAYS_PER_YEAR,
} from '@/utils/timestamp'

const userInfo = useUserInfoStore()
const eventStore = useEventStore()

watch(
  () => userInfo.isSignedIn,
  (signedIn) => {
    if (signedIn) {
      eventStore.initializeEvents()
    }
  },
  { immediate: true }
)

const rangeIsMoreThanOneYear = computed(() => {
  const start = eventStore.filterStart
  const end = eventStore.filterEnd
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

const minDateInputValue = computed(() => {
  return eventStore.filterStart != null ? timestampToDateInput(eventStore.filterStart) : ''
})

const maxDateInputValue = computed(() => {
  return eventStore.filterEnd != null ? timestampToDateInput(eventStore.filterEnd) : ''
})

const onMinDateChange = (event: Event) => {
  const val = (event.target as HTMLInputElement).value
  if (!val) {
    return
  }
  const ts = dateInputToTimestamp(val)
  eventStore.filterStart = ts
  eventStore.fetchEvents(ts, eventStore.filterEnd ?? undefined)
}

const onMaxDateChange = (event: Event) => {
  const val = (event.target as HTMLInputElement).value
  if (!val) {
    return
  }
  const ts = dateInputToTimestamp(val)
  eventStore.filterEnd = ts
  eventStore.fetchEvents(eventStore.filterStart ?? undefined, ts)
}

const resetMin = () => {
  eventStore.filterStart = eventStore.minTimestamp
  eventStore.fetchEvents(eventStore.filterStart ?? undefined, eventStore.filterEnd ?? undefined)
}

const resetMax = () => {
  eventStore.filterEnd = eventStore.maxTimestamp
  eventStore.fetchEvents(eventStore.filterStart ?? undefined, eventStore.filterEnd ?? undefined)
}
</script>

<template>
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title text-2xl">Home</h2>

      <div
        v-if="eventStore.successMessage"
        class="alert alert-success"
        data-testid="success-message"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6 shrink-0 stroke-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{{ eventStore.successMessage }}</span>
      </div>

      <p v-if="userInfo.isSignedIn" data-testid="welcome-message">Welcome {{ userInfo.name }}</p>
      <p v-else data-testid="sign-in-prompt">Sign in for more options</p>

      <div v-if="userInfo.isSignedIn" class="mt-4">
        <RouterLink to="/search" class="btn btn-primary" data-testid="add-event-action">
          Add a new event
        </RouterLink>
      </div>

      <div v-if="userInfo.isSignedIn" class="mt-6">
        <h3 class="text-lg font-semibold mb-3">Events</h3>

        <div
          v-if="eventStore.minTimestamp != null && eventStore.maxTimestamp != null"
          class="flex flex-wrap gap-4 mb-4 items-end"
          data-testid="filter-controls"
        >
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium" for="filter-min-date">From</label>
            <div class="flex gap-2 items-center">
              <input
                id="filter-min-date"
                type="date"
                class="input input-bordered input-sm"
                :value="minDateInputValue"
                data-testid="filter-min-date"
                @change="onMinDateChange"
              />
              <button
                class="btn btn-sm btn-outline"
                data-testid="reset-min-action"
                @click="resetMin"
              >
                Reset
              </button>
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium" for="filter-max-date">To</label>
            <div class="flex gap-2 items-center">
              <input
                id="filter-max-date"
                type="date"
                class="input input-bordered input-sm"
                :value="maxDateInputValue"
                data-testid="filter-max-date"
                @change="onMaxDateChange"
              />
              <button
                class="btn btn-sm btn-outline"
                data-testid="reset-max-action"
                @click="resetMax"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div v-if="eventStore.events.length > 0" class="grid grid-cols-[auto_auto_1fr] gap-y-2" data-testid="event-list">
          <template
            v-for="evt in eventStore.events"
            :key="evt.id"
          >
            <div class="font-mono text-sm self-center" data-testid="event-item" :data-event-id="evt.id">
              <div class="font-mono text-sm" data-testid="event-date">
                <div data-testid="event-start-date">{{ formatEventDate(evt.startTimestamp) }}{{ evt.endTimestamp != null ? ' -' : '' }}</div>
                <div v-if="evt.endTimestamp != null" class="ml-2" data-testid="event-end-date">{{ formatEventDate(evt.endTimestamp) }}</div>
              </div>
            </div>
            <div class="divider divider-horizontal mx-2"></div>
            <div class="min-w-0 self-center">
              <span class="font-bold" data-testid="event-name">{{ evt.name }}</span>
              <div
                class="truncate text-sm"
                :title="evt.basicDescription"
                data-testid="event-description"
              >{{ evt.basicDescription }}</div>
            </div>
          </template>
        </div>
        <p v-else data-testid="no-events-message">No events yet</p>
      </div>
    </div>
  </div>
</template>
