<script setup lang="ts">
import { ref, computed } from 'vue'

import { type LensPanel } from '@/stores/panel-store'
import { useEventStore } from '@/stores/event-store'

const props = defineProps<{
  panel: LensPanel
}>()

const eventStore = useEventStore()

const newEventName = ref('')

const availableEvents = computed(() => {
  return eventStore.events.filter((e) => !props.panel.eventNames.includes(e.name))
})

const addEvent = () => {
  if (newEventName.value && !props.panel.eventNames.includes(newEventName.value)) {
    props.panel.eventNames.push(newEventName.value)
    newEventName.value = ''
  }
}

const removeEvent = (name: string) => {
  const index = props.panel.eventNames.indexOf(name)
  if (index > -1) {
    props.panel.eventNames.splice(index, 1)
  }
}
</script>

<template>
  <div class="w-[25vw] shrink-0">
    <div class="card bg-base-100 shadow-xl h-full overflow-y-auto max-h-[calc(100vh-8rem)]">
      <div class="card-body">
        <h2 class="card-title mb-4">Lens</h2>

        <ul class="list-none p-0 m-0 mb-4" data-testid="lens-event-list">
          <li
            v-for="name in panel.eventNames"
            :key="name"
            class="flex justify-between items-center mb-2 p-2 bg-base-200 rounded"
            data-testid="lens-event-item"
          >
            <span>{{ name }}</span>
            <button
              class="btn btn-sm btn-ghost btn-circle text-error"
              @click="removeEvent(name)"
              title="Remove Event"
              data-testid="remove-event-action"
            >
              ✕
            </button>
          </li>
        </ul>

        <div class="form-control w-full max-w-xs">
          <div class="flex gap-2">
            <input
              v-model="newEventName"
              type="text"
              list="available-events"
              placeholder="Add event..."
              class="input input-bordered w-full"
              data-testid="lens-event-input"
              @keyup.enter="addEvent"
            />
            <datalist id="available-events">
              <option v-for="evt in availableEvents" :key="evt.id" :value="evt.name" />
            </datalist>
            <button
              class="btn btn-primary"
              @click="addEvent"
              :disabled="!newEventName"
              data-testid="add-event-action"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
