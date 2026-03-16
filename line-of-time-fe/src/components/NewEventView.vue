<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEventStore } from '@/stores/event-store'
import type { EventInput, CategorizationResult } from '@/stores/event-store'
import { dateInputToTimestamp } from '@/utils/timestamp'

// const basicDescriptionMax = 1000 // PRODUCTION:UNCOMMENT
const basicDescriptionMax = 1002 // PRODUCTION:REMOVE

const router = useRouter()
const eventStore = useEventStore()

type DateInputs = {
  year: string
  month: string
  day: string
}

const emptyDateInputs = (): DateInputs => ({ year: '', month: '', day: '' })

const splitDateString = (dateStr: string): DateInputs => {
  if (!dateStr) {
    return emptyDateInputs()
  }
  const [year = '', month = '', day = ''] = dateStr.split('-')
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

const getStartDate = (cat: CategorizationResult): DateInputs => {
  if (cat.type === 'person') {
    return splitDateString(cat['birth-date'])
  }
  if (cat.type === 'one-time-event' || cat.type === 'bounded-event') {
    return splitDateString(cat['start-date'])
  }
  return emptyDateInputs()
}

const getEndDate = (cat: CategorizationResult): DateInputs => {
  if (cat.type === 'person' && cat['death-date']) {
    return splitDateString(cat['death-date'])
  }
  if (cat.type === 'bounded-event') {
    return splitDateString(cat['end-date'])
  }
  return emptyDateInputs()
}

onMounted(() => {
  if (!eventStore.wikiInfo) {
    router.replace('/search')
    return
  }

  if (
    eventStore.wikiInfo.categorization.type === 'redirect' &&
    eventStore.wikiInfo.links.length > 0
  ) {
    const firstLink = eventStore.wikiInfo.links[0]
    eventStore.wikiInfo = null
    router.replace('/search?name=' + encodeURIComponent(firstLink!))
  }
})

const validCategorizationTypes = ['person', 'one-time-event', 'bounded-event', 'other'] as const
type CategorizationSelectType = (typeof validCategorizationTypes)[number]

const rawCategorizationType = eventStore.wikiInfo?.categorization?.type ?? 'other'
const isTypeChangeable = rawCategorizationType !== 'redirect' && rawCategorizationType !== 'disambiguation'
const initialCategorizationType: CategorizationSelectType =
  validCategorizationTypes.includes(rawCategorizationType as CategorizationSelectType)
    ? (rawCategorizationType as CategorizationSelectType)
    : 'other'

const name = computed(() => eventStore.wikiInfo?.name ?? '')
const categorizationType = ref<CategorizationSelectType>(initialCategorizationType)
const referenceUrl = computed(() =>
  eventStore.wikiInfo
    ? `https://en.wikipedia.org/wiki/${encodeURIComponent(eventStore.wikiInfo.name)}`
    : ''
)

const categorization = eventStore.wikiInfo?.categorization
const basicDescription = ref(eventStore.wikiInfo?.extract ?? '')
const startInputs = ref<DateInputs>(
  categorization ? getStartDate(categorization) : emptyDateInputs()
)
const endInputs = ref<DateInputs>(categorization ? getEndDate(categorization) : emptyDateInputs())

const handleSearchAgain = () => {
  eventStore.wikiInfo = null
  eventStore.clearMessages()
  router.push('/search')
}

const handleSubmit = async () => {
  eventStore.clearMessages()

  const startTimestamp = dateInputsToTimestamp(startInputs.value)
  if (startTimestamp == null) {
    return
  }

  const eventType = categorizationType.value === 'person' ? 'person' : 'event'

  const eventData: EventInput = {
    name: name.value,
    basicDescription: basicDescription.value,
    startTimestamp,
    referenceUrl: referenceUrl.value,
    eventType,
  }

  const endTimestamp = dateInputsToTimestamp(endInputs.value)
  if (endTimestamp != null) {
    eventData.endTimestamp = endTimestamp
  }

  const success = await eventStore.createNewEvent(eventData)
  if (success) {
    eventStore.wikiInfo = null
    router.push('/')
  }
}
</script>

<template>
  <div v-if="eventStore.wikiInfo" class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title text-2xl">Add a New Event</h2>

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

      <div class="flex flex-row gap-4 items-end">
        <div class="form-control flex-1">
          <label class="label">
            <span class="label-text">Name</span>
          </label>
          <div class="input input-bordered w-full flex items-center" data-testid="name-display">
            {{ name }}
          </div>
        </div>
        <div class="form-control">
          <label class="label">
            <span class="label-text">Type</span>
          </label>
          <select
            v-model="categorizationType"
            class="select select-bordered"
            data-testid="type-select"
            :disabled="!isTypeChangeable"
          >
            <option value="person">person</option>
            <option value="one-time-event">one-time-event</option>
            <option value="bounded-event">bounded-event</option>
            <option value="other">other</option>
          </select>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4 mt-4">
        <div class="form-control">
          <label class="label" for="basic-description-input">
            <span class="label-text">Basic Description</span>
          </label>
          <textarea
            id="basic-description-input"
            v-model="basicDescription"
            class="textarea textarea-bordered w-full"
            required
            :maxlength="basicDescriptionMax"
            data-testid="basic-description-input"
          ></textarea>
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text">Start Date (year required)</span>
          </label>
          <div class="flex flex-row gap-2 items-end" data-testid="start-timestamp-input">
            <label class="form-control mr-2">
              <span class="label-text text-xs mb-1 mr-2">Year</span>
              <input
                v-model="startInputs.year"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                class="input input-bordered input-sm w-20"
                required
                data-testid="start-year-input"
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
                data-testid="start-month-input"
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
                data-testid="start-day-input"
              />
            </label>
          </div>
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text">End Date (optional)</span>
          </label>
          <div class="flex flex-row gap-2 items-end" data-testid="end-timestamp-input">
            <label class="form-control mr-2">
              <span class="label-text text-xs mb-1 mr-2">Year</span>
              <input
                v-model="endInputs.year"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                class="input input-bordered input-sm w-20"
                data-testid="end-year-input"
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
                data-testid="end-month-input"
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
                data-testid="end-day-input"
              />
            </label>
          </div>
        </div>

        <div class="form-control">
          <label class="label" for="reference-url-input">
            <span class="label-text">Reference URL</span>
          </label>
          <input
            id="reference-url-input"
            type="url"
            class="input input-bordered w-full"
            :value="referenceUrl"
            readonly
            data-testid="reference-url-input"
          />
        </div>

        <div class="form-control mt-6 flex flex-row gap-2">
          <button type="submit" class="btn btn-primary" data-testid="create-event-action">
            Create Event
          </button>
          <button
            type="button"
            class="btn btn-secondary"
            data-testid="search-again-action"
            @click="handleSearchAgain"
          >
            Search again
          </button>
        </div>
      </form>

      <div class="mt-6 space-y-4">
        <div class="h-[25vh] overflow-y-auto" data-testid="wiki-links-list">
          <h3 class="font-bold text-lg mb-2">Related Links</h3>
          <ul class="list-disc list-inside">
            <li v-for="(link, index) in eventStore.wikiInfo.links" :key="index">
              <router-link
                :to="'/search?name=' + encodeURIComponent(link)"
                class="link link-primary"
                data-testid="related-link"
              >
                {{ link }}
              </router-link>
            </li>
          </ul>
        </div>

        <div class="border border-base-300 rounded-lg p-4" data-testid="wiki-page">
          <h3 class="font-bold text-lg mb-2">Wikipedia Page</h3>
          <div class="wiki-content" v-html="eventStore.wikiInfo.htmlText"></div>
        </div>
      </div>
    </div>
  </div>
</template>
