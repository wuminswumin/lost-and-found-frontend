<script setup lang="ts">
import { useRoute } from 'vue-router'
import NavBar from '@/components/待定.vue'

const route = useRoute()
</script>

<template>
  <div class="app">
    <NavBar v-if="route.name !== 'login'" />
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-main {
  padding: 24px 16px 48px;
}
</style>
