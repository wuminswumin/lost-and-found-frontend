<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  {
    name: '首页',
    path: '/',
  },
  {
    name: '登录',
    path: '/login',
  },
  {
    name: '注册',
    path: '/register',
  },
]

const isCurrentPage = (path: string) => {
  return route.path === path
}
</script>

<template>
  <nav class="app-nav">
    <template v-for="item in navItems" :key="item.path">
      <div
        v-if="isCurrentPage(item.path)"
        class="nav-button active"
      >
        {{ item.name }}
      </div>

      <router-link
        v-else
        :to="item.path"
        class="nav-button"
      >
        {{ item.name }}
      </router-link>
    </template>
  </nav>
</template>

<style scoped>
.app-nav {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 40px;
}

.nav-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 50px;
  border: 1px solid #333;
  text-decoration: none;
  color: #333;
  background-color: #fff;
}

.nav-button.active {
  color: #fff;
  background-color: #000;
}
</style>