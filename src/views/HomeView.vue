<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  List,
  Setting,
  SwitchButton,
  User,
} from '@element-plus/icons-vue'

import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

// 四个功能入口：按钮文字、跳转地址、图标
const entries = [
  { path: '/account', label: '管理个人账号', icon: User },
  { path: '/post/publish', label: '发布帖子', icon: List },
  { path: '/posts', label: '查看帖子', icon: List },
  { path: '/admin', label: '管理员操作', icon: Setting },
]

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
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<template>
  <div class="home-page">
    <el-card class="menu-card">
      <h2 class="menu-title">欢迎回来，{{ auth.username }}！</h2>
      <p class="menu-subtitle">请选择要进行的操作</p>

      <div class="menu-grid">
        <el-button
          v-for="item in entries"
          :key="item.path"
          class="menu-btn"
          size="large"
          type="primary"
          :icon="item.icon"
          @click="router.push(item.path)"
        >
          {{ item.label }}
        </el-button>

        <el-button
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
