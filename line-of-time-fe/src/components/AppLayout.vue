<script setup lang="ts">
defineProps<{
  message?: string;
  error?: string;
}>();
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <div class="navbar bg-base-100 shadow-lg">
      <div class="navbar-start">
        <RouterLink to="/" class="btn btn-ghost text-xl" data-testid="home-action">
          Line of Time project
        </RouterLink>
      </div>

      <div class="navbar-end flex items-center">
        <RouterLink to="/about" class="btn btn-outline btn-sm" data-testid="about-action">
          About
        </RouterLink>
      </div>
    </div>

    <div v-if="message" class="alert alert-success mx-auto mt-4" role="alert">
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
      <span class="align-middle">{{ message }}</span>
    </div>

    <div v-if="error" class="alert alert-error mx-auto mt-4" role="alert">
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
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span class="align-middle">{{ error }}</span>
    </div>

    <main class="flex-1 container mx-auto px-4 py-8">
      <slot />
    </main>

    <footer class="footer footer-center p-4 bg-base-300 text-base-content">
      <div>
        <p>Copyright &copy; 2025</p>
      </div>
    </footer>
  </div>
</template>
