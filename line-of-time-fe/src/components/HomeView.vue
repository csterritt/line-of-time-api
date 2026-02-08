<script setup lang="ts">
import { watch } from 'vue'
import { useUserInfoStore } from '@/stores/user-info'
import { useEventStore } from '@/stores/event-store'

const userInfo = useUserInfoStore()
const eventStore = useEventStore()

watch(
  () => userInfo.isSignedIn,
  (signedIn) => {
    if (signedIn) {
      eventStore.fetchEvents()
    }
  },
  { immediate: true }
)
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
        <RouterLink to="/new-event" class="btn btn-primary" data-testid="add-event-action">
          Add a new event
        </RouterLink>
      </div>

      <div v-if="userInfo.isSignedIn" class="mt-6">
        <h3 class="text-lg font-semibold mb-3">Events</h3>
        <div v-if="eventStore.events.length > 0" data-testid="event-list">
          <div
            v-for="evt in eventStore.events"
            :key="evt.id"
            class="card bg-base-200 mb-2"
            data-testid="event-item"
          >
            <div class="card-body p-4">
              <h4 class="font-bold">{{ evt.name }}</h4>
              <p class="text-sm">{{ evt.basicDescription }}</p>
            </div>
          </div>
        </div>
        <p v-else data-testid="no-events-message">No events yet</p>
      </div>
    </div>
  </div>
</template>
