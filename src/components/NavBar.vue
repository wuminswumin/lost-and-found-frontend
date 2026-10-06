<template>
  <nav class="nav-bar">
    <RouterLink to="/">首页</RouterLink>
    <RouterLink to="/posts">查看帖子</RouterLink>
    <RouterLink to="/my/claims">我的认领申请</RouterLink>
    <RouterLink to="/account">管理个人账号</RouterLink>
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