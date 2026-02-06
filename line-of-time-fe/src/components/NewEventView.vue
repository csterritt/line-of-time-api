<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useEventStore } from '@/stores/event-store'
import type { EventInput } from '@/stores/event-store'

// const nameMax = 500 // PRODUCTION:UNCOMMENT
const nameMax = 502

// const basicDescriptionMax = 1000 // PRODUCTION:UNCOMMENT
const basicDescriptionMax = 1002

const router = useRouter()
const eventStore = useEventStore()

const name = ref('')
const basicDescription = ref('')
const startTimestamp = ref('')
const endTimestamp = ref('')
const referenceUrl = ref('')

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

      <form @submit.prevent="handleSubmit" class="space-y-4">
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

        <div class="form-control mt-6">
          <button type="submit" class="btn btn-primary" data-testid="create-event-action">
            Create Event
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
