<script setup lang="ts">
import { useCounterStore } from '@/stores/counter'
const counter = useCounterStore()
</script>

<template>
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title text-2xl">Home</h2>
      
      <div class="space-y-2">
        <p><strong>Count:</strong> {{ counter.count }}</p>
        <p><strong>Double Count:</strong> {{ counter.doubleCount }}</p>
      </div>
      
      <div class="card-actions justify-end mt-4">
        <button 
          class="btn btn-primary" 
          @click="counter.increment"
          data-testid="increment-action"
        >
          Increment
        </button>
      </div>
    </div>
  </div>
</template>
