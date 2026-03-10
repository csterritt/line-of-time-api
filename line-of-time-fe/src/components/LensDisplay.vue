<script setup lang="ts">
import { ref } from 'vue'

import { usePanelStore, type LensStore } from '@/stores/panel-store'

const props = defineProps<{
  store: LensStore
}>()

const panelStore = usePanelStore()

const newEventName = ref('')

const addEvent = () => {
  if (newEventName.value) {
    props.store.addEvent(newEventName.value)
    newEventName.value = ''
  }
}

const removeEvent = (name: string) => {
  props.store.removeEvent(name)
}
</script>

<template>
  <div class="w-[25vw] shrink-0">
    <div class="card bg-base-100 shadow-xl h-full overflow-y-auto max-h-[calc(100vh-8rem)]">
      <div class="card-body">
        <div class="flex justify-between items-center mb-4">
          <h2 class="card-title">Lens</h2>
          <button
            v-if="store.isLast.value"
            class="btn btn-sm btn-ghost btn-circle text-error"
            @click="panelStore.removeLensPanel(store.index)"
            title="Close Lens Panel"
            data-testid="close-lens-panel-action"
          >
            ✕
          </button>
        </div>

        <ul class="list-none p-0 m-0 mb-4" data-testid="lens-event-list">
          <li
            v-for="evt in store.events.value"
            :key="evt.name"
            class="flex justify-between items-center mb-2 p-2 bg-base-200 rounded"
            data-testid="lens-event-item"
          >
            <span>{{ evt.name }}</span>
            <button
              class="btn btn-sm btn-ghost btn-circle text-error"
              @click="removeEvent(evt.name)"
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
              :list="'available-events-' + props.store.index"
              placeholder="Add event..."
              class="input input-bordered w-full"
              data-testid="lens-event-input"
              @keyup.enter="addEvent"
            />
            <datalist :id="'available-events-' + props.store.index">
              <option v-for="name in props.store.nameList.value" :key="name" :value="name" />
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
