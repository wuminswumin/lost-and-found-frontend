<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { getAnnouncements } from '@/api/announcement'
import type { Announcement } from '@/api/announcement'

const announcements = ref<Announcement[]>([])
const loading = ref(false)

// ===== 分页 =====
const currentPage = ref(1)
const pageSize = 15 // 后端写死每页 15 条
const total = ref(0)

/** 拉取公告列表 */
async function loadAnnouncements() {
  loading.value = true
  try {
    const data = await getAnnouncements(currentPage.value)
    announcements.value = data.list
    total.value = data.total
  } catch {
    // 失败提示已由 http.ts 统一弹出
  } finally {
    loading.value = false
  }
}

function handlePageChange(page: number) {
  currentPage.value = page
  loadAnnouncements()
}

/** 后端返回完整时间（如 2026-10-06T12:00:00+08:00），只取"日期 + 时分"方便阅读 */
function formatTime(iso: string) {
  return iso.replace('T', ' ').slice(0, 16)
}

onMounted(loadAnnouncements)
</script>

<template>
  <div class="announcement-page">
    <div class="page-header">
      <div>
        <h2>公告</h2>
        <p>失物招领系统的通知与说明</p>
      </div>
    </div>

    <div v-loading="loading" class="announcement-list">
      <el-empty
        v-if="!loading && announcements.length === 0"
        description="暂无公告"
      />

      <el-card
        v-for="item in announcements"
        :key="item.announcement_id"
        class="announcement-card"
      >
        <h3 class="announcement-title">{{ item.title }}</h3>
        <!-- pre-wrap：保留公告里的换行，不然整段挤成一行 -->
        <p class="announcement-content">{{ item.content }}</p>
        <div class="announcement-footer">
          <span>发布于：{{ formatTime(item.created_at) }}</span>
        </div>
      </el-card>
    </div>

    <div v-if="total > pageSize" class="pagination">
      <el-pagination
        background
        layout="total, prev, pager, next"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.announcement-page {
  padding: 24px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0 0 8px;
}

.page-header p {
  margin: 0;
  color: #909399;
}

.announcement-list {
  min-height: 200px;
}

.announcement-card {
  margin-bottom: 16px;
}

.announcement-title {
  margin: 0 0 12px;
}

.announcement-content {
  margin: 0;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.announcement-footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
  color: #909399;
  font-size: 13px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
