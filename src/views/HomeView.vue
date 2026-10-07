<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Bell,
  List,
  Setting,
  SwitchButton,
  User,
  Document,
  Phone,
} from '@element-plus/icons-vue'

import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const entries = computed(() => {
  const commonEntries = [
    { path: '/post/publish', label: '发布帖子', icon: List },
    { path: '/posts', label: '查看帖子', icon: List },
    { path: '/announcements', label: '查看公告', icon: Bell },
    { path: '/my/claims', label: '我的认领申请', icon: Document },
    { path: '/my/contacts', label: '我的联系人', icon: Phone },
  ]

  if (auth.role === '系统管理员') {
    commonEntries.push({
      path: '/admin/sys',
      label: '系统管理',
      icon: Setting,
    })
  } else if (auth.role === '失物招领管理员') {
    commonEntries.push({
      path: '/admin/post',
      label: '帖子审核',
      icon: Setting,
    })
  }

  if (auth.token) {
    return [
      { path: '/account', label: '管理个人账号', icon: User },
      ...commonEntries,
    ]
  }

  return [
    { path: '/login', label: '登录/注册', icon: User },
    ...commonEntries,
  ]
})

function handleEntryClick(path: string) {
  if (path === '/posts' || path === '/login' || path === '/announcements') {
    router.push(path)
    return
  }

  if (!auth.token) {
    ElMessage.warning('请先登录')
    return
  }

  if (path === '/post/publish') {
    router.push({
      path: '/post/publish',
      query: {
        from: 'home',
      },
    })
    return
  }

  router.push(path)
}

/** 退出登录：先弹确认框，确认后清空登录状态并回登录页 */
async function handleLogout() {
  const confirmed = await ElMessageBox.confirm('确定要退出登录吗？', '退出登录', {
    confirmButtonText: '退出',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => true)
    .catch(() => false)
  if (!confirmed) return

  auth.logout()
  window.dispatchEvent(new CustomEvent('auth-changed'))
  ElMessage.success('已退出登录')
  router.push('/')
}
</script>

<template>
  <div class="home-page">
    <el-card class="menu-card">
      <h2 class="menu-title">
        {{ auth.token ? `欢迎回来，${auth.username}！` : '游客，你好！' }}
      </h2>
      <p class="menu-subtitle">请选择要进行的操作</p>

      <div class="menu-grid">
        <el-button
          v-for="item in entries"
          :key="item.path"
          class="menu-btn"
          size="large"
          type="primary"
          :icon="item.icon"
          @click="handleEntryClick(item.path)"
        >
          {{ item.label }}
        </el-button>

        <el-button
          v-if="auth.token"
          class="menu-btn"
          size="large"
          type="danger"
          :icon="SwitchButton"
          @click="handleLogout"
        >
          退出登录
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.home-page {
  display: flex;
  justify-content: center;
}

.menu-card {
  width: 560px;
  max-width: 100%;
}

.menu-title {
  margin: 4px 0;
  text-align: center;
  color: #303133;
}

.menu-subtitle {
  margin: 0 0 20px;
  text-align: center;
  color: #909399;
  font-size: 13px;
}

/* 三列按钮网格 */
.menu-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.menu-btn {
  width: 100%;
  height: 56px;
  /* el-button 相邻时默认带左边距，网格布局里要归零 */
  margin-left: 0;
}
</style>
