<template>
  <!-- Admin routes use full screen layout -->
  <router-view v-if="isAdmin" />
  
  <!-- Mobile User routes use constrained viewport -->
  <div v-else class="app-root">
    <div class="viewport">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isAdmin = computed(() => route.path.startsWith('/admin'))
</script>

<style>
/* Reset body margin for full screen admin layout */
body { margin: 0; padding: 0; }

.app-root {
  min-height: 100vh;
  width: 100%;
  background: #FFF9F0;
}
.viewport {
  width: 100%;
  min-height: 100vh;
  background: #FFF9F0;
}
</style>

