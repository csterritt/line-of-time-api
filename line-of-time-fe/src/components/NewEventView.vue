<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEventStore } from '@/stores/event-store'
import type { EventInput, CategorizationResult } from '@/stores/event-store'

// const basicDescriptionMax = 1000 // PRODUCTION:UNCOMMENT
const basicDescriptionMax = 1002

const router = useRouter()
const eventStore = useEventStore()

const getStartDate = (cat: CategorizationResult): string => {
  if (cat.type === 'person') {
    return cat['birth-date']
  }
  if (cat.type === 'one-time-event' || cat.type === 'bounded-event') {
    return cat['start-date']
  }
  return ''
}

const getEndDate = (cat: CategorizationResult): string => {
  if (cat.type === 'person' && cat['death-date']) {
    return cat['death-date']
  }
  if (cat.type === 'bounded-event') {
    return cat['end-date']
  }
  return ''
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
    router.replace('/search?name=' + encodeURIComponent(firstLink))
  }
})

const name = computed(() => eventStore.wikiInfo?.name ?? '')
const categorizationType = computed(
  () => eventStore.wikiInfo?.categorization?.type ?? 'other'
)
const referenceUrl = computed(() =>
  eventStore.wikiInfo
    ? `https://en.wikipedia.org/wiki/${encodeURIComponent(eventStore.wikiInfo.name)}`
    : ''
)

const categorization = eventStore.wikiInfo?.categorization
const basicDescription = ref(eventStore.wikiInfo?.extract ?? '')
const startTimestamp = ref(categorization ? getStartDate(categorization) : '')
const endTimestamp = ref(categorization ? getEndDate(categorization) : '')

const handleSearchAgain = () => {
  eventStore.wikiInfo = null
  eventStore.clearMessages()
  router.push('/search')
}

const handleSubmit = async () => {
  eventStore.clearMessages()

  const eventData: EventInput = {
    name: name.value,
    basicDescription: basicDescription.value,
    startTimestamp: startTimestamp.value,
    referenceUrls: [referenceUrl.value],
  }

  if (endTimestamp.value) {
    eventData.endTimestamp = endTimestamp.value
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
          <div
            class="input input-bordered w-full flex items-center"
            data-testid="name-display"
          >{{ name }}</div>
        </div>
        <div class="form-control">
          <label class="label">
            <span class="label-text">Type</span>
          </label>
          <div
            class="input input-bordered flex items-center"
            data-testid="type-display"
          >{{ categorizationType }}</div>
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
          <label class="label" for="start-timestamp-input">
            <span class="label-text">Start Date</span>
          </label>
          <input
            id="start-timestamp-input"
            v-model="startTimestamp"
            type="date"
            class="input input-bordered w-full"
            required
            data-testid="start-timestamp-input"
          />
        </div>

        <div class="form-control">
          <label class="label" for="end-timestamp-input">
            <span class="label-text">End Date (optional)</span>
          </label>
          <input
            id="end-timestamp-input"
            v-model="endTimestamp"
            type="date"
            class="input input-bordered w-full"
            data-testid="end-timestamp-input"
          />
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

        <div
          class="border border-base-300 rounded-lg p-4"
          data-testid="wiki-page"
        >
          <h3 class="font-bold text-lg mb-2">Wikipedia Page</h3>
          <div class="wiki-content" v-html="eventStore.wikiInfo.htmlText"></div>
        </div>
      </div>
    </div>
  </div>
</template>
