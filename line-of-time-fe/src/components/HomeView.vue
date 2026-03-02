<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserInfoStore } from '@/stores/user-info'
import { useEventStore } from '@/stores/event-store'
import { usePanelStore } from '@/stores/panel-store'
import TimelineDisplay from './TimelineDisplay.vue'
import LensDisplay from './LensDisplay.vue'

const userInfo = useUserInfoStore()
const eventStore = useEventStore()
const panelStore = usePanelStore()

onMounted(async () => {
  await eventStore.loadAllEvents()
  panelStore.setAllEvents(eventStore.allEvents)
})
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="card bg-base-100 shadow-xl mb-4 shrink-0">
      <div class="card-body py-4">
        <div class="flex justify-between items-center">
          <h2 class="card-title text-2xl">Home</h2>

          <div>
            <p v-if="userInfo.isSignedIn" data-testid="welcome-message">Welcome {{ userInfo.name }}</p>
            <p v-else data-testid="sign-in-prompt">Sign in for more options</p>
          </div>
        </div>

        <div
          v-if="eventStore.successMessage"
          class="alert alert-success mt-2"
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

        <div v-if="userInfo.isSignedIn" class="mt-2">
          <RouterLink to="/search" class="btn btn-primary btn-sm" data-testid="add-event-action">
            Add a new event
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Horizontal scrolling panel container -->
    <div class="flex-grow overflow-x-auto overflow-y-hidden">
      <div class="flex flex-row gap-8 items-start h-full pb-4 px-2 min-w-max">
        <template v-for="(structure, index) in panelStore.structures" :key="index">
          <TimelineDisplay
            v-if="structure.type === 'timeline'"
            :store="structure"
          />
          <LensDisplay
            v-else-if="structure.type === 'lens' && structure.index > 0"
            :store="structure"
          />
        </template>
      </div>
    </div>
  </div>
</template>
