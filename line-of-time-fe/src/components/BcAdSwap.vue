<script setup lang="ts">
type Era = 'AD' | 'BC'

const props = defineProps<{
  modelValue: Era
  dataTestid?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Era]
}>()

let once = true

const toggle = () => {
  console.log('toggle', props.modelValue)
  if (once) {
    once = false
    setTimeout(() => {
      once = true
    }, 100)

    emit('update:modelValue', props.modelValue === 'AD' ? 'BC' : 'AD')
  }
}
</script>

<template>
  <label class="swap swap-flip btn btn-ghost btn-sm" :data-testid="dataTestid" @click="toggle">
    <input type="checkbox" :checked="modelValue === 'BC'" class="hidden" />
    <span class="swap-off font-bold">AD</span>
    <span class="swap-on font-bold">BC</span>
  </label>
</template>
