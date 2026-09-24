<script setup lang="ts">
import { useRoute } from 'vue-router'
import NavBar from '@/components/NavBar.vue'

const route = useRoute()
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>校园失物招领系统</h1>
      <NavBar v-if="route.name !== 'login'" />
    </header>

    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
}

.app-header {
  padding: 20px 20px 10px;
  text-align: center;
  border-bottom: 1px solid #ddd;
}

.app-header h1 {
  margin-bottom: 20px;
  font-size: 28px;
}

.app-main {
  padding: 40px 20px;
  text-align: center;
}
</style>