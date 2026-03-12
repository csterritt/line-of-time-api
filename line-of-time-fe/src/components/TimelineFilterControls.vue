<script setup lang="ts">
import type { FilterInputs } from '../composables/useTimelineDisplay'

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
  <div class="mb-4 grid gap-3 lg:grid-cols-2" data-testid="filter-controls">
    <form class="grid grid-cols-4 items-end gap-2" @submit.prevent="emit('applyMin')">
      <label class="form-control">
        <span class="label-text text-xs mb-1">Min year</span>
        <input
          v-model="filterStartInputs.year"
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          class="input input-bordered input-sm w-20"
          data-testid="filter-min-year"
        />
      </label>
      <label class="form-control">
        <span class="label-text text-xs mb-1">Min month</span>
        <input
          v-model="filterStartInputs.month"
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          class="input input-bordered input-sm w-16"
          data-testid="filter-min-month"
        />
      </label>
      <label class="form-control">
        <span class="label-text text-xs mb-1">Min day</span>
        <input
          v-model="filterStartInputs.day"
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          class="input input-bordered input-sm w-16"
          data-testid="filter-min-day"
        />
      </label>
      <button class="btn btn-outline btn-sm" data-testid="filter-min-go-action" type="submit">
        Go
      </button>
    </form>
    <div class="flex items-end">
      <button class="btn btn-outline btn-sm" data-testid="reset-min-action" @click="emit('resetMin')">
        Reset min
      </button>
    </div>
    <form class="grid grid-cols-4 items-end gap-2" @submit.prevent="emit('applyMax')">
      <label class="form-control">
        <span class="label-text text-xs mb-1">Max year</span>
        <input
          v-model="filterEndInputs.year"
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          class="input input-bordered input-sm w-20"
          data-testid="filter-max-year"
        />
      </label>
      <label class="form-control">
        <span class="label-text text-xs mb-1">Max month</span>
        <input
          v-model="filterEndInputs.month"
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          class="input input-bordered input-sm w-16"
          data-testid="filter-max-month"
        />
      </label>
      <label class="form-control">
        <span class="label-text text-xs mb-1">Max day</span>
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
      <button class="btn btn-outline btn-sm" data-testid="reset-max-action" @click="emit('resetMax')">
        Reset max
      </button>
    </div>
  </div>
</template>
