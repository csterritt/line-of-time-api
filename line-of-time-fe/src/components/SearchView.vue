<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useEventStore } from '@/stores/event-store'

// const nameMax = 500 // PRODUCTION:UNCOMMENT
const nameMax = 502

const router = useRouter()
const route = useRoute()
const eventStore = useEventStore()

eventStore.wikiInfo = null
eventStore.clearMessages()

const queryName = typeof route.query.name === 'string' ? route.query.name : ''
const name = ref(queryName)

const nameIsValid = computed(() => name.value.trim().length > 0)

const handleSearch = async () => {
  eventStore.clearMessages()

  const result = await eventStore.getInfo(name.value)
  if (result) {
    router.push('/new-event')
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && nameIsValid.value && !eventStore.wikiLoading) {
    event.preventDefault()
    handleSearch()
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
          @keydown="handleKeydown"
        />
      </div>

      <div class="form-control mt-4">
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
    </div>
  </div>
</template>
