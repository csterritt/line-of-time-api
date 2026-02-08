<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useEventStore } from '@/stores/event-store'
import type { EventInput } from '@/stores/event-store'

// const nameMax = 500 // PRODUCTION:UNCOMMENT
const nameMax = 502

// const basicDescriptionMax = 1000 // PRODUCTION:UNCOMMENT
const basicDescriptionMax = 1002

const textPreviewWordLimit = 500

const router = useRouter()
const eventStore = useEventStore()

const name = ref('')
const basicDescription = ref('')
const startTimestamp = ref('')
const endTimestamp = ref('')
const referenceUrl = ref('')
const infoLoaded = ref(false)

const nameIsValid = computed(() => name.value.trim().length > 0)

const firstNWords = (text: string, n: number): string => {
  const words = text.split(/\s+/).filter((w) => w.length > 0)
  return words.slice(0, n).join(' ')
}

const textPreview = computed(() => {
  if (!eventStore.wikiInfo) {
    return ''
  }
  return firstNWords(eventStore.wikiInfo.text, textPreviewWordLimit)
})

const handleSearch = async () => {
  eventStore.clearMessages()
  infoLoaded.value = false

  const result = await eventStore.getInfo(name.value)
  if (result) {
    name.value = result.name
    basicDescription.value = result.extract
    referenceUrl.value = `https://en.wikipedia.org/wiki/${encodeURIComponent(result.name)}`
    infoLoaded.value = true
  }
}

const handleSubmit = async () => {
  eventStore.clearMessages()

  const eventData: EventInput = {
    name: name.value,
    basicDescription: basicDescription.value,
    startTimestamp: Math.floor(new Date(startTimestamp.value).getTime() / 1000),
    referenceUrls: [referenceUrl.value],
  }

  if (endTimestamp.value) {
    eventData.endTimestamp = Math.floor(new Date(endTimestamp.value).getTime() / 1000)
  }

  const success = await eventStore.createNewEvent(eventData)
  if (success) {
    router.push('/')
  }
}
</script>

<template>
  <div class="card bg-base-100 shadow-xl">
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

      <div class="form-control">
        <label class="label" for="name-input">
          <span class="label-text">Name</span>
        </label>
        <input
          id="name-input"
          v-model="name"
          type="text"
          class="input input-bordered w-full"
          required
          :maxlength="nameMax"
          data-testid="name-input"
        />
      </div>

      <div v-if="!infoLoaded" class="form-control mt-4">
        <button
          type="button"
          class="btn btn-primary"
          :disabled="!nameIsValid || eventStore.wikiLoading"
          data-testid="search-wikipedia-action"
          @click="handleSearch"
        >
          <span v-if="eventStore.wikiLoading" class="loading loading-spinner loading-sm"></span>
          {{ eventStore.wikiLoading ? 'Searching...' : 'Search Wikipedia' }}
        </button>
      </div>

      <form v-if="infoLoaded" @submit.prevent="handleSubmit" class="space-y-4 mt-4">
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
            <span class="label-text">Start Date/Time</span>
          </label>
          <input
            id="start-timestamp-input"
            v-model="startTimestamp"
            type="datetime-local"
            class="input input-bordered w-full"
            required
            data-testid="start-timestamp-input"
          />
        </div>

        <div class="form-control">
          <label class="label" for="end-timestamp-input">
            <span class="label-text">End Date/Time (optional)</span>
          </label>
          <input
            id="end-timestamp-input"
            v-model="endTimestamp"
            type="datetime-local"
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
            v-model="referenceUrl"
            type="url"
            class="input input-bordered w-full"
            required
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
            :disabled="!nameIsValid || eventStore.wikiLoading"
            data-testid="search-wikipedia-action"
            @click="handleSearch"
          >
            <span v-if="eventStore.wikiLoading" class="loading loading-spinner loading-sm"></span>
            {{ eventStore.wikiLoading ? 'Searching...' : 'Search Wikipedia' }}
          </button>
        </div>
      </form>

      <div v-if="infoLoaded && eventStore.wikiInfo" class="mt-6 space-y-4">
        <div class="border border-base-300 rounded-lg p-4" data-testid="wiki-text-preview">
          <h3 class="font-bold text-lg mb-2">Wikipedia Text Preview</h3>
          <p class="whitespace-pre-line">{{ textPreview }}</p>
        </div>

        <div data-testid="wiki-links-list">
          <h3 class="font-bold text-lg mb-2">Related Links</h3>
          <ul class="list-disc list-inside max-h-64 overflow-y-auto">
            <li v-for="(link, index) in eventStore.wikiInfo.links" :key="index">
              {{ link }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
