<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useUserInfoStore } from '@/stores/user-info'
import { useEventStore } from '@/stores/event-store'
import type { EventResponse } from '@/stores/event-store'
import TimelineDisplay from './TimelineDisplay.vue'
import {
  timestampToDateInput,
  dateInputToTimestamp,
} from '@/utils/timestamp'

const userInfo = useUserInfoStore()
const eventStore = useEventStore()

onMounted(() => {
  eventStore.initializeEvents()
})

const minDateInputValue = computed(() => {
  return eventStore.filterStart != null ? timestampToDateInput(eventStore.filterStart) : ''
})

const maxDateInputValue = computed(() => {
  return eventStore.filterEnd != null ? timestampToDateInput(eventStore.filterEnd) : ''
})

const onMinDateChange = (evt: Event) => {
  const val = (evt.target as HTMLInputElement).value
  if (!val) {
    return
  }
  const ts = dateInputToTimestamp(val)
  eventStore.filterStart = ts
  eventStore.fetchEvents(ts, eventStore.filterEnd ?? undefined)
}

const onMaxDateChange = (evt: Event) => {
  const val = (evt.target as HTMLInputElement).value
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

      <div v-if="userInfo.isSignedIn" class="mt-2">
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
      </div>

      <div class="mt-6">
        <h3 class="text-lg font-semibold mb-3">Timeline</h3>

        <TimelineDisplay
          :events="eventStore.events"
          :filter-start="eventStore.filterStart"
          :filter-end="eventStore.filterEnd"
        />
      </div>
    </div>
  </div>
</template>
