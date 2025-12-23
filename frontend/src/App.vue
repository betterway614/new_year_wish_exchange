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
  background: #0f0f0f;
  display: flex;
  align-items: center;
  justify-content: center;
}
.viewport {
  width: 100%;
  max-width: 480px;
  min-height: 100vh;
  background: #FFF9F0;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}
</style>

