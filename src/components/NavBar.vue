<template>
  <nav class="nav-bar">
    <RouterLink to="/">首页</RouterLink>
    <RouterLink to="/found">招领</RouterLink>
    <RouterLink to="/lost">失物</RouterLink>
    <RouterLink to="/my-posts">我的帖子</RouterLink>
  </nav>
</template>

<style scoped>
.nav-bar {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.nav-bar a {
  text-decoration: none;
}
</style>