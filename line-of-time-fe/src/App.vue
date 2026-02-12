<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterView } from 'vue-router'

import AppLayout from './components/AppLayout.vue'

const flashMessage = ref('')
const flashError = ref('')

onMounted(() => {
  const win = window as unknown as Record<string, unknown>
  if (win.__FLASH_MESSAGE__) {
    flashMessage.value = win.__FLASH_MESSAGE__ as string
    delete win.__FLASH_MESSAGE__
  }

  if (win.__FLASH_ERROR__) {
    flashError.value = win.__FLASH_ERROR__ as string
    delete win.__FLASH_ERROR__
  }
})
</script>

<template>
  <AppLayout :message="flashMessage" :error="flashError">
    <RouterView />
  </AppLayout>
</template>
