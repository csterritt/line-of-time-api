<script setup lang="ts">
import type { FilterInputs } from '../composables/useTimelineDisplay'
import BcAdSwap from './BcAdSwap.vue'

defineProps<{
  filterStartInputs: FilterInputs
  filterEndInputs: FilterInputs
}>()

const emit = defineEmits<{
  applyMin: []
  applyMax: []
  resetMin: []
  resetMax: []
}>()
</script>

<template>
  <div class="mb-4 flex flex-col gap-2" data-testid="filter-controls">
    <div class="flex flex-row gap-2">
      <form class="flex-grow flex flex-row items-end" @submit.prevent="emit('applyMin')">
        <label class="form-control mr-2">
          <span class="label-text text-xs mb-1 mr-2">Min year</span>
          <input
            v-model="filterStartInputs.year"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            class="input input-bordered input-sm w-20"
            data-testid="filter-min-year"
          />
        </label>
        <BcAdSwap
          :model-value="filterStartInputs.era"
          data-testid="filter-min-era-swap"
          @update:model-value="filterStartInputs.era = $event"
        />

        <label class="form-control mx-2">
          <span class="label-text text-xs mb-1 mr-2">Min month</span>
          <input
            v-model="filterStartInputs.month"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            class="input input-bordered input-sm w-16"
            data-testid="filter-min-month"
          />
        </label>

        <label class="form-control mx-2">
          <span class="label-text text-xs mb-1 mr-2">Min day</span>
          <input
            v-model="filterStartInputs.day"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            class="input input-bordered input-sm w-16"
            data-testid="filter-min-day"
          />
        </label>

        <button class="btn btn-outline btn-sm ml2" data-testid="filter-min-go-action" type="submit">
          Go
        </button>
      </form>

      <div class="flex items-end">
        <button
          class="btn btn-outline btn-sm"
          data-testid="reset-min-action"
          @click="emit('resetMin')"
        >
          Reset min
        </button>
      </div>
    </div>

    <div class="flex flex-row gap-2">
      <form class="flex-grow flex flex-row items-end" @submit.prevent="emit('applyMax')">
        <label class="form-control mr-2">
          <span class="label-text text-xs mb-1 mr-2">Max year</span>
          <input
            v-model="filterEndInputs.year"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            class="input input-bordered input-sm w-20"
            data-testid="filter-max-year"
          />
        </label>
        <BcAdSwap
          :model-value="filterEndInputs.era"
          data-testid="filter-max-era-swap"
          @update:model-value="filterEndInputs.era = $event"
        />

        <label class="form-control mx-2">
          <span class="label-text text-xs mb-1 mr-2">Max month</span>
          <input
            v-model="filterEndInputs.month"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            class="input input-bordered input-sm w-16"
            data-testid="filter-max-month"
          />
        </label>

        <label class="form-control mx-2">
          <span class="label-text text-xs mb-1 mr-2">Max day</span>
          <input
            v-model="filterEndInputs.day"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            class="input input-bordered input-sm w-16"
            data-testid="filter-max-day"
          />
        </label>

        <button class="btn btn-outline btn-sm" data-testid="filter-max-go-action" type="submit">
          Go
        </button>
      </form>

      <div class="flex items-end">
        <button
          class="btn btn-outline btn-sm"
          data-testid="reset-max-action"
          @click="emit('resetMax')"
        >
          Reset max
        </button>
      </div>
    </div>
  </div>
</template>
