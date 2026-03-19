<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useEventStore } from '@/stores/event-store'
import { useUserInfoStore } from '@/stores/user-info'
import type { EventInput } from '@/stores/event-store'
import { dateInputToTimestamp, timestampToYmd } from '@/utils/timestamp'

// const basicDescriptionMax = 1000 // PRODUCTION:UNCOMMENT
const basicDescriptionMax = 1002 // PRODUCTION:REMOVE

const router = useRouter()
const route = useRoute()
const eventStore = useEventStore()
const userInfo = useUserInfoStore()

type DateInputs = {
  year: string
  month: string
  day: string
}

const emptyDateInputs = (): DateInputs => ({ year: '', month: '', day: '' })

const timestampToDateInputs = (ts: number | null): DateInputs => {
  if (ts == null) {
    return emptyDateInputs()
  }
  const ymd = timestampToYmd(ts)
  const [year = '', month = '', day = ''] = ymd.split('-')
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

const dateInputsToTimestamp = (inputs: DateInputs): number | null => {
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
  return dateInputToTimestamp(`${inputs.year.padStart(4, '0')}-${monthStr}-${dayStr}`)
}

const eventId = route.params.id as string

const name = ref('')
const basicDescription = ref('')
const referenceUrl = ref('')
const eventType = ref<string | null>(null)
const startInputs = ref<DateInputs>(emptyDateInputs())
const endInputs = ref<DateInputs>(emptyDateInputs())
const notFound = ref(false)

onMounted(async () => {
  if (!userInfo.isAdmin) {
    router.replace('/')
    return
  }

  if (eventStore.allEvents.length === 0) {
    await eventStore.loadAllEvents()
  }

  const event = eventStore.allEvents.find((e) => e.id === eventId)
  if (!event) {
    notFound.value = true
    return
  }

  name.value = event.name
  basicDescription.value = event.basicDescription
  referenceUrl.value = event.referenceUrl
  eventType.value = event.eventType
  startInputs.value = timestampToDateInputs(event.startTimestamp)
  endInputs.value = timestampToDateInputs(event.endTimestamp)
})

const handleSubmit = async () => {
  eventStore.clearMessages()

  const startTimestamp = dateInputsToTimestamp(startInputs.value)
  if (startTimestamp == null) {
    return
  }

  const eventData: EventInput = {
    name: name.value,
    basicDescription: basicDescription.value,
    startTimestamp,
    referenceUrl: referenceUrl.value,
    eventType: eventType.value,
  }

  const endTimestamp = dateInputsToTimestamp(endInputs.value)
  if (endTimestamp != null) {
    eventData.endTimestamp = endTimestamp
  }

  const success = await eventStore.editEvent(eventId, eventData)
  if (success) {
    router.push('/')
  }
}

const handleCancel = () => {
  eventStore.clearMessages()
  router.push('/')
}
</script>

<template>
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title text-2xl">Edit Event</h2>

      <div v-if="notFound" class="alert alert-error" data-testid="not-found-message">
        <span>Event not found.</span>
      </div>

      <div v-else>
        <div v-if="eventStore.errorMessage" class="alert alert-error" data-testid="error-message">
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
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{{ eventStore.errorMessage }}</span>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4 mt-4">
          <div class="form-control">
            <label class="label" for="edit-name-input">
              <span class="label-text">Name</span>
            </label>
            <input
              id="edit-name-input"
              v-model="name"
              type="text"
              class="input input-bordered w-full"
              required
              data-testid="edit-name-input"
            />
          </div>

          <div class="form-control">
            <label class="label" for="edit-basic-description-input">
              <span class="label-text">Basic Description</span>
            </label>
            <textarea
              id="edit-basic-description-input"
              v-model="basicDescription"
              class="textarea textarea-bordered w-full"
              required
              :maxlength="basicDescriptionMax"
              data-testid="edit-basic-description-input"
            ></textarea>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Start Date (year required)</span>
            </label>
            <div class="flex flex-row gap-2 items-end" data-testid="edit-start-timestamp-input">
              <label class="form-control mr-2">
                <span class="label-text text-xs mb-1 mr-2">Year</span>
                <input
                  v-model="startInputs.year"
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  class="input input-bordered input-sm w-20"
                  required
                  data-testid="edit-start-year-input"
                />
              </label>
              <label class="form-control mr-2">
                <span class="label-text text-xs mb-1 mr-2">Month</span>
                <input
                  v-model="startInputs.month"
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  class="input input-bordered input-sm w-16"
                  data-testid="edit-start-month-input"
                />
              </label>
              <label class="form-control">
                <span class="label-text text-xs mb-1 mr-2">Day</span>
                <input
                  v-model="startInputs.day"
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  class="input input-bordered input-sm w-16"
                  data-testid="edit-start-day-input"
                />
              </label>
            </div>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">End Date (optional)</span>
            </label>
            <div class="flex flex-row gap-2 items-end" data-testid="edit-end-timestamp-input">
              <label class="form-control mr-2">
                <span class="label-text text-xs mb-1 mr-2">Year</span>
                <input
                  v-model="endInputs.year"
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  class="input input-bordered input-sm w-20"
                  data-testid="edit-end-year-input"
                />
              </label>
              <label class="form-control mr-2">
                <span class="label-text text-xs mb-1 mr-2">Month</span>
                <input
                  v-model="endInputs.month"
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  class="input input-bordered input-sm w-16"
                  data-testid="edit-end-month-input"
                />
              </label>
              <label class="form-control">
                <span class="label-text text-xs mb-1 mr-2">Day</span>
                <input
                  v-model="endInputs.day"
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  class="input input-bordered input-sm w-16"
                  data-testid="edit-end-day-input"
                />
              </label>
            </div>
          </div>

          <div class="form-control">
            <label class="label" for="edit-reference-url-input">
              <span class="label-text">Reference URL</span>
            </label>
            <input
              id="edit-reference-url-input"
              v-model="referenceUrl"
              type="url"
              class="input input-bordered w-full"
              required
              data-testid="edit-reference-url-input"
            />
          </div>

          <div class="form-control">
            <label class="label" for="edit-type-select">
              <span class="label-text">Type</span>
            </label>
            <select
              id="edit-type-select"
              v-model="eventType"
              class="select select-bordered"
              data-testid="edit-type-select"
            >
              <option :value="null">none</option>
              <option value="person">person</option>
              <option value="event">event</option>
            </select>
          </div>

          <div class="form-control mt-6 flex flex-row gap-2">
            <button type="submit" class="btn btn-primary" data-testid="save-event-action">
              Save Event
            </button>
            <button
              type="button"
              class="btn btn-secondary"
              data-testid="cancel-edit-action"
              @click="handleCancel"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
