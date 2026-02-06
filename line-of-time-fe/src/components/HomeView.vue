<script setup lang="ts">
import { useUserInfoStore } from '@/stores/user-info'

const userInfo = useUserInfoStore()
</script>

<template>
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title text-2xl">Home</h2>

      <p v-if="userInfo.isSignedIn" data-testid="welcome-message">
        Welcome {{ userInfo.name }}
      </p>
      <p v-else data-testid="sign-in-prompt">
        Sign in for more options
      </p>
    </div>
  </div>
</template>
