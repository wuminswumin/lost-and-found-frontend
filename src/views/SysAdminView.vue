<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { ArrowDown, Refresh } from '@element-plus/icons-vue'

import { getAnnouncements } from '@/api/announcement'
import type { Announcement } from '@/api/announcement'
import {
  createAnnouncement,
  deleteAnnouncement,
  getSysStats,
  getSysUsers,
  updateUserRole,
  type SysStats,
  type SysUser,
} from '@/api/sysadmin'
import { useAuthStore } from '@/stores/auth'
import type { Role } from '@/types'

const auth = useAuthStore()

// ===== 页签切换：三个页签懒加载，切到哪个就刷新哪个 =====
const activeTab = ref<'users' | 'announcements' | 'stats'>('users')

function handleTabChange() {
  if (activeTab.value === 'users') loadUsers()
  else if (activeTab.value === 'announcements') loadAnnouncements()
  else loadStats()
}

// ==================================================
// 页签一：管理用户
// ==================================================
const users = ref<SysUser[]>([])
const usersLoading = ref(false)
const roleFilter = ref<'全部' | Role>('全部')
const usersPage = ref(1)
const pageSize = 15 // 后端写死每页 15 条
const usersTotal = ref(0)

async function loadUsers() {
  usersLoading.value = true
  try {
    const data = await getSysUsers({
      page: usersPage.value,
      role: roleFilter.value === '全部' ? undefined : roleFilter.value,
    })
    users.value = data.list
    usersTotal.value = data.total
  } catch {
    // 失败提示已由 http.ts 统一弹出
  } finally {
    usersLoading.value = false
  }
}

function handleRoleFilterChange() {
  usersPage.value = 1
  loadUsers()
}

function handleUsersPageChange(page: number) {
  usersPage.value = page
  loadUsers()
}

/**
 * 是不是自己：后端禁止修改自己的角色，自己的行直接禁用按钮。
 * 注意 userId 只存在内存里（刷新页面后为 null），那时就靠后端拒绝兜底。
 */
function isSelf(user: SysUser) {
  return auth.userId === user.user_id
}

/** 身份标签颜色：普通用户灰、失物招领管理员橙、系统管理员红（与个人中心一致） */
function roleTagType(role: Role) {
  switch (role) {
    case '系统管理员':
      return 'danger'
    case '失物招领管理员':
      return 'warning'
    default:
      return 'info'
  }
}

/** 修改用户角色：先弹确认框（改角色影响对方权限，不可随意） */
async function handleChangeRole(user: SysUser, newRole: Role) {
  if (newRole === user.role) return // 选了自己当前的的角色，什么都不用做

  try {
    await ElMessageBox.confirm(
      `确定要将用户「${user.username}」的角色从「${user.role}」改为「${newRole}」吗？`,
      '修改角色',
      {
        confirmButtonText: '确定修改',
        cancelButtonText: '再想想',
        type: 'warning',
      },
    )
  } catch {
    return // 用户点了取消
  }

  try {
    await updateUserRole(user.user_id, newRole)
    ElMessage.success(`「${user.username}」的角色已改为「${newRole}」`)
    loadUsers()
  } catch {
    // 失败提示已由 http.ts 统一弹出
  }
}

// ==================================================
// 页签二：管理公告
// ==================================================
const announcements = ref<Announcement[]>([])
const announcementsLoading = ref(false)
const announcementsPage = ref(1)
const announcementsTotal = ref(0)

async function loadAnnouncements() {
  announcementsLoading.value = true
  try {
    const data = await getAnnouncements(announcementsPage.value)
    announcements.value = data.list
    announcementsTotal.value = data.total
  } catch {
    // 失败提示已由 http.ts 统一弹出
  } finally {
    announcementsLoading.value = false
  }
}

function handleAnnouncementsPageChange(page: number) {
  announcementsPage.value = page
  loadAnnouncements()
}

// 发布公告表单：标题最长 100 字（与后端一致），内容必填
const publishFormRef = ref<FormInstance>()
const publishForm = reactive({ title: '', content: '' })
const publishing = ref(false)

const publishRules: FormRules<typeof publishForm> = {
  title: [
    { required: true, message: '请输入公告标题', trigger: 'blur' },
    { max: 100, message: '标题最长 100 字', trigger: 'blur' },
  ],
  content: [{ required: true, message: '请输入公告内容', trigger: 'blur' }],
}

async function handlePublish() {
  const ok = await publishFormRef.value?.validate().catch(() => false)
  if (!ok) return

  publishing.value = true
  try {
    await createAnnouncement({ ...publishForm })
    ElMessage.success('公告已发布，所有用户都能在「查看公告」里看到')
    publishFormRef.value?.resetFields()
    loadAnnouncements()
  } catch {
    // 失败提示已由 http.ts 统一弹出
  } finally {
    publishing.value = false
  }
}

/** 删除公告：不可恢复，必须弹确认框 */
async function handleDeleteAnnouncement(item: Announcement) {
  try {
    await ElMessageBox.confirm(`确定要删除公告《${item.title}》吗？删除后不可恢复。`, '删除公告', {
      confirmButtonText: '确定删除',
      cancelButtonText: '再想想',
      type: 'error',
    })
  } catch {
    return // 用户点了取消
  }

  try {
    await deleteAnnouncement(item.announcement_id)
    ElMessage.success('公告已删除')
    loadAnnouncements()
  } catch {
    // 失败提示已由 http.ts 统一弹出
  }
}

// ==================================================
// 页签三：查看系统数据
// ==================================================
const stats = ref<SysStats | null>(null)
const statsLoading = ref(false)

async function loadStats() {
  statsLoading.value = true
  try {
    stats.value = await getSysStats()
  } catch {
    // 失败提示已由 http.ts 统一弹出
  } finally {
    statsLoading.value = false
  }
}

// ==================================================
// 展示辅助
// ==================================================

/** 后端返回完整时间（如 2026-10-06T12:00:00+08:00），只取"日期 + 时分"方便阅读 */
function formatTime(iso: string) {
  return iso.replace('T', ' ').slice(0, 16)
}

// 首次进入：默认在"管理用户"页签，先把它加载出来
onMounted(loadUsers)
</script>

<template>
  <div class="admin-page">
    <div class="page-header">
      <div>
        <h2>系统管理</h2>
        <p>管理用户角色、发布公告、查看系统运行数据</p>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="admin-tabs" @tab-change="handleTabChange">
      <!-- ===== 页签一：管理用户 ===== -->
      <el-tab-pane label="管理用户" name="users">
        <el-card class="filter-card">
          <div class="filter-row">
            <el-select v-model="roleFilter" placeholder="角色筛选" @change="handleRoleFilterChange">
              <el-option label="全部角色" value="全部" />
              <el-option label="普通用户" value="普通用户" />
              <el-option label="失物招领管理员" value="失物招领管理员" />
              <el-option label="系统管理员" value="系统管理员" />
            </el-select>
          </div>
        </el-card>

        <el-card v-loading="usersLoading" class="table-card">
          <el-empty v-if="!usersLoading && users.length === 0" description="暂无用户" />

          <el-table v-else :data="users" stripe>
            <el-table-column prop="user_id" label="ID" width="70" />
            <el-table-column prop="username" label="用户名" min-width="120" show-overflow-tooltip />
            <el-table-column prop="phone_num" label="手机号" min-width="130" show-overflow-tooltip />

            <el-table-column label="角色" width="150">
              <template #default="{ row }">
                <el-tag :type="roleTagType(row.role)" effect="plain">{{ row.role }}</el-tag>
              </template>
            </el-table-column>

            <!-- 修改角色：自己那行禁用（后端禁止改自己的角色） -->
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-tooltip
                  v-if="isSelf(row)"
                  content="不能修改自己的角色"
                  placement="top"
                >
                  <span>
                    <el-button size="small" disabled>修改角色</el-button>
                  </span>
                </el-tooltip>

                <el-dropdown
                  v-else
                  @command="(cmd: unknown) => handleChangeRole(row, cmd as Role)"
                >
                  <el-button size="small">
                    修改角色
                    <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item
                        v-for="option in ['普通用户', '失物招领管理员', '系统管理员']"
                        :key="option"
                        :command="option"
                        :disabled="option === row.role"
                      >
                        {{ option }}{{ option === row.role ? '（当前）' : '' }}
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <div v-if="usersTotal > pageSize" class="pagination">
          <el-pagination
            background
            layout="total, prev, pager, next"
            :current-page="usersPage"
            :page-size="pageSize"
            :total="usersTotal"
            @current-change="handleUsersPageChange"
          />
        </div>
      </el-tab-pane>

      <!-- ===== 页签二：管理公告 ===== -->
      <el-tab-pane label="管理公告" name="announcements">
        <!-- 发布表单 -->
        <el-card class="publish-card">
          <h3 class="card-title">发布新公告</h3>
          <el-form
            ref="publishFormRef"
            :model="publishForm"
            :rules="publishRules"
            label-position="top"
            @submit.prevent
          >
            <el-form-item label="公告标题" prop="title">
              <el-input
                v-model="publishForm.title"
                placeholder="如：关于失物招领处开放时间的通知"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>
            <el-form-item label="公告内容" prop="content">
              <el-input
                v-model="publishForm.content"
                type="textarea"
                :rows="5"
                placeholder="写清楚要告诉大家的事情，支持换行"
              />
            </el-form-item>
            <el-button type="primary" :loading="publishing" @click="handlePublish">
              发布公告
            </el-button>
          </el-form>
        </el-card>

        <!-- 公告列表 -->
        <el-card v-loading="announcementsLoading" class="table-card">
          <el-empty
            v-if="!announcementsLoading && announcements.length === 0"
            description="还没有公告，先发一条吧"
          />

          <el-table v-else :data="announcements" stripe>
            <el-table-column prop="announcement_id" label="ID" width="70" />
            <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
            <el-table-column prop="content" label="内容" min-width="220" show-overflow-tooltip />
            <el-table-column label="发布时间" width="150">
              <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button
                  size="small"
                  type="danger"
                  plain
                  @click="handleDeleteAnnouncement(row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <div v-if="announcementsTotal > pageSize" class="pagination">
          <el-pagination
            background
            layout="total, prev, pager, next"
            :current-page="announcementsPage"
            :page-size="pageSize"
            :total="announcementsTotal"
            @current-change="handleAnnouncementsPageChange"
          />
        </div>
      </el-tab-pane>

      <!-- ===== 页签三：查看系统数据 ===== -->
      <el-tab-pane label="查看系统数据" name="stats">
        <div class="stats-header">
          <el-button :icon="Refresh" :loading="statsLoading" @click="loadStats">
            刷新数据
          </el-button>
        </div>

        <div v-loading="statsLoading" class="stats-grid">
          <el-empty
            v-if="!statsLoading && !stats"
            description="数据加载失败"
          >
            <el-button type="primary" @click="loadStats">重新加载</el-button>
          </el-empty>

          <template v-else-if="stats">
            <el-card class="stats-card">
              <h3 class="card-title">用户统计</h3>
              <el-descriptions :column="1" border>
                <el-descriptions-item label="用户总数">
                  {{ stats.user_stats.total_users }}
                </el-descriptions-item>
                <el-descriptions-item label="普通用户">
                  {{ stats.user_stats.normal_users }}
                </el-descriptions-item>
                <el-descriptions-item label="管理员">
                  {{ stats.user_stats.admin_users }}
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <el-card class="stats-card">
              <h3 class="card-title">帖子统计</h3>
              <el-descriptions :column="1" border>
                <el-descriptions-item label="帖子总数">
                  {{ stats.post_stats.total_posts }}
                </el-descriptions-item>
                <el-descriptions-item label="待审核">
                  {{ stats.post_stats.pending_posts }}
                </el-descriptions-item>
                <el-descriptions-item label="已通过">
                  {{ stats.post_stats.approved_posts }}
                </el-descriptions-item>
                <el-descriptions-item label="已驳回">
                  {{ stats.post_stats.rejected_posts }}
                </el-descriptions-item>
                <el-descriptions-item label="寻物帖">
                  {{ stats.post_stats.lost_posts }}
                </el-descriptions-item>
                <el-descriptions-item label="招领帖">
                  {{ stats.post_stats.found_posts }}
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <el-card class="stats-card">
              <h3 class="card-title">公告统计</h3>
              <el-descriptions :column="1" border>
                <el-descriptions-item label="公告总数">
                  {{ stats.announcement_stats.total_announcements }}
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
          </template>
        </div>
      </el-tab-pane>
    </el-tabs>
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

.admin-tabs :deep(.el-tabs__content) {
  overflow: visible;
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
  width: 180px;
}

.table-card {
  min-height: 200px;
}

.card-title {
  margin: 0 0 16px;
  font-size: 15px;
  color: #303133;
}

.publish-card {
  margin-bottom: 24px;
}

.publish-card .el-form {
  max-width: 640px;
}

.stats-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  align-items: start;
  min-height: 200px;
}

.stats-grid .el-empty {
  grid-column: 1 / -1;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
