<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import {
  auditPost,
  deleteAdminPost,
  getAdminPosts,
  resolveAdminPost,
  type AdminPost,
} from '@/api/admin'

const posts = ref<AdminPost[]>([])
const loading = ref(false)

// ===== 筛选条件 =====
// 三个筛选都默认"全部"，即不传条件直接拉全量列表
const postType = ref<'全部' | '寻物' | '招领'>('全部')
const status = ref<'全部' | '待审核' | '已通过' | '已驳回'>('全部')
const isResolve = ref<'全部' | '已解决' | '未解决'>('全部')

// ===== 分页 =====
const currentPage = ref(1)
const pageSize = 15 // 后端写死每页 15 条
const total = ref(0)

/** 拉取帖子列表："全部"翻译成 undefined（axios 不会把 undefined 拼进地址栏，等于不传） */
async function loadPosts() {
  loading.value = true
  try {
    const data = await getAdminPosts({
      page: currentPage.value,
      post_type: postType.value === '全部' ? undefined : postType.value,
      status: status.value === '全部' ? undefined : status.value,
      is_resolve: isResolve.value === '全部' ? undefined : isResolve.value,
    })
    posts.value = data.list
    total.value = data.total
  } catch {
    // 失败提示已由 http.ts 统一弹出
  } finally {
    loading.value = false
  }
}

/** 筛选条件一变：回到第 1 页重新拉数据 */
function handleFilterChange() {
  currentPage.value = 1
  loadPosts()
}

function handlePageChange(page: number) {
  currentPage.value = page
  loadPosts()
}

// ===== 三个管理操作 =====

/**
 * 审核通过 / 驳回：只有"待审核"的帖子才显示这两个按钮
 * （后端也只允许审"待审核"的，其他状态调用会被拒）
 */
async function handleAudit(post: AdminPost, newStatus: '已通过' | '已驳回') {
  const actionText = newStatus === '已通过' ? '通过' : '驳回'

  // 审核是不可逆的公开操作，先弹确认框；用户点取消就直接返回
  try {
    await ElMessageBox.confirm(`确定要${actionText}《${post.title}》吗？`, `审核${actionText}`, {
      confirmButtonText: `确定${actionText}`,
      cancelButtonText: '再想想',
      type: newStatus === '已通过' ? 'info' : 'warning',
    })
  } catch {
    return
  }

  try {
    await auditPost(post.post_id, newStatus)
    ElMessage.success(`已${actionText}《${post.title}》`)
    loadPosts()
  } catch {
    // 失败提示已由 http.ts 统一弹出
  }
}

/**
 * 标记已解决 / 撤销解决：可逆操作，不加确认框
 * 只有"已通过"的帖子才显示（后端也只允许改"已通过"的）
 */
async function handleResolve(post: AdminPost) {
  const newStatus = post.is_resolve === '已解决' ? '未解决' : '已解决'
  try {
    await resolveAdminPost(post.post_id, newStatus)
    ElMessage.success(newStatus === '已解决' ? `《${post.title}》已标记为已解决` : `已撤销《${post.title}》的解决标记`)
    loadPosts()
  } catch {
    // 失败提示已由 http.ts 统一弹出
  }
}

/** 删除帖子：不可恢复，必须弹确认框 */
async function handleDelete(post: AdminPost) {
  try {
    await ElMessageBox.confirm(`确定要删除《${post.title}》吗？删除后不可恢复。`, '删除帖子', {
      confirmButtonText: '确定删除',
      cancelButtonText: '再想想',
      type: 'error',
    })
  } catch {
    return // 用户点了取消，什么都不做
  }

  try {
    await deleteAdminPost(post.post_id)
    ElMessage.success('帖子已删除')
    loadPosts()
  } catch {
    // 失败提示已由 http.ts 统一弹出
  }
}

// ===== 展示辅助 =====

/** 审核状态标签颜色：待审核橙、已通过绿、已驳回红 */
function statusTagType(s: AdminPost['status']) {
  if (s === '已通过') return 'success'
  if (s === '已驳回') return 'danger'
  return 'warning'
}

/** 后端返回完整时间（如 2026-10-06T12:00:00+08:00），只取"日期 + 时分"方便阅读 */
function formatTime(iso: string) {
  return iso.replace('T', ' ').slice(0, 16)
}

onMounted(loadPosts)
</script>

<template>
  <div class="admin-page">
    <div class="page-header">
      <div>
        <h2>帖子审核</h2>
        <p>审核全校的失物 / 招领帖子，维护帖子状态</p>
      </div>
    </div>

    <!-- 筛选栏：类型 / 审核状态 / 解决状态，改动即重新查询 -->
    <el-card class="filter-card">
      <div class="filter-row">
        <el-select v-model="postType" placeholder="帖子类型" @change="handleFilterChange">
          <el-option label="全部类型" value="全部" />
          <el-option label="寻物" value="寻物" />
          <el-option label="招领" value="招领" />
        </el-select>

        <el-select v-model="status" placeholder="审核状态" @change="handleFilterChange">
          <el-option label="全部状态" value="全部" />
          <el-option label="待审核" value="待审核" />
          <el-option label="已通过" value="已通过" />
          <el-option label="已驳回" value="已驳回" />
        </el-select>

        <el-select v-model="isResolve" placeholder="解决状态" @change="handleFilterChange">
          <el-option label="全部状态" value="全部" />
          <el-option label="未解决" value="未解决" />
          <el-option label="已解决" value="已解决" />
        </el-select>
      </div>
    </el-card>

    <!-- 帖子表格 -->
    <el-card v-loading="loading" class="table-card">
      <el-empty v-if="!loading && posts.length === 0" description="暂无符合条件的帖子" />

      <el-table v-else :data="posts" stripe>
        <el-table-column prop="post_id" label="ID" width="70" />

        <el-table-column label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.post_type === '寻物' ? 'warning' : 'success'" effect="plain">
              {{ row.post_type }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="title" label="标题" min-width="140" show-overflow-tooltip />
        <el-table-column prop="event_location" label="地点" min-width="100" show-overflow-tooltip />
        <el-table-column prop="event_time" label="事发时间" min-width="100" show-overflow-tooltip />
        <el-table-column prop="description" label="描述" min-width="140" show-overflow-tooltip />

        <!-- 图片缩略图：点击可放大预览 -->
        <el-table-column label="图片" width="90">
          <template #default="{ row }">
            <el-image
              v-if="row.image_url"
              :src="row.image_url"
              :preview-src-list="[row.image_url]"
              fit="cover"
              class="thumb"
            />
            <span v-else class="no-image">—</span>
          </template>
        </el-table-column>

        <el-table-column label="审核状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" effect="plain">{{ row.status }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="解决状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.is_resolve === '已解决' ? 'success' : 'info'" effect="plain">
              {{ row.is_resolve }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="发布时间" width="150">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>

        <!-- 操作列：按审核状态显示不同按钮 -->
        <el-table-column label="操作" width="230" fixed="right">
          <template #default="{ row }">
            <div class="action-btns">
              <template v-if="row.status === '待审核'">
                <el-button size="small" type="success" @click="handleAudit(row, '已通过')">
                  通过
                </el-button>
                <el-button size="small" type="danger" @click="handleAudit(row, '已驳回')">
                  驳回
                </el-button>
              </template>

              <template v-else-if="row.status === '已通过'">
                <el-button
                  size="small"
                  :type="row.is_resolve === '已解决' ? 'info' : 'primary'"
                  @click="handleResolve(row)"
                >
                  {{ row.is_resolve === '已解决' ? '标记未解决' : '标记已解决' }}
                </el-button>
              </template>

              <el-button size="small" type="danger" plain @click="handleDelete(row)">
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

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
.admin-page {
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

.filter-card {
  margin-bottom: 24px;
}

.filter-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-row .el-select {
  width: 140px;
}

.table-card {
  min-height: 200px;
}

/* 图片缩略图 */
.thumb {
  display: block;
  width: 60px;
  height: 60px;
  border-radius: 4px;
  cursor: zoom-in;
}

.no-image {
  color: #c0c4cc;
}

/* 操作按钮排一行，间距靠 gap */
.action-btns {
  display: flex;
  gap: 6px;
}

/* Element Plus 表格里按钮默认会有 12px 左边距，这里统一去掉 */
.action-btns .el-button + .el-button {
  margin-left: 0;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
