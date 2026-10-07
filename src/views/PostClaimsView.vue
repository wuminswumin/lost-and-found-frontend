<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

import { auditClaim, getPostClaims } from '@/api/claim'
import type { PostClaim } from '@/api/claim'
import { getPostDetails } from '@/api/post'
import type { Post } from '@/types'

const route = useRoute()
const router = useRouter()

// ===== 帖子信息：先确认帖子存在，同时拿到标题和解决状态 =====
const post = ref<Post | null>(null)
const postLoading = ref(false)

// ===== 申请列表 =====
const claims = ref<PostClaim[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = 15 // 后端写死每页 15 条
const total = ref(0)

const postId = Number(route.query.post_id)

function loadPost() {
  // 帖子详情是公开接口；后端会拒绝非作者调用下面的申请列表，这里主要是拿标题和状态
  postLoading.value = true
  getPostDetails(postId)
    .then((data) => {
      post.value = data
    })
    .catch(() => {
      // 失败提示已由 http.ts 统一弹出
    })
    .finally(() => {
      postLoading.value = false
    })
}

async function loadClaims() {
  loading.value = true
  try {
    const data = await getPostClaims(postId, currentPage.value)
    claims.value = data.list
    total.value = data.total
  } catch {
    // 失败提示已由 http.ts 统一弹出（比如"没有权限"，说明这不是你的帖子）
  } finally {
    loading.value = false
  }
}

function handlePageChange(page: number) {
  currentPage.value = page
  loadClaims()
}

/**
 * 同意 / 拒绝一条申请。
 * 同意是不可逆的大动作：帖子会被标记"已解决"、其余待处理申请会被后端自动拒绝，
 * 所以确认框文案要写清楚后果；拒绝相对轻一些，也弹确认。
 */
async function handleAudit(claim: PostClaim, approve: boolean) {
  const title = approve ? '同意认领' : '拒绝认领'
  const message = approve
    ? `确定同意「${claim.claimer_name}」的认领申请吗？\n同意后帖子将标记为"已解决"，其余待处理申请会被自动拒绝。`
    : `确定拒绝「${claim.claimer_name}」的认领申请吗？`

  try {
    await ElMessageBox.confirm(message, title, {
      confirmButtonText: approve ? '确定同意' : '确定拒绝',
      cancelButtonText: '再想想',
      type: approve ? 'success' : 'warning',
    })
  } catch {
    return // 用户点了取消
  }

  try {
    await auditClaim(claim.claim_id, approve)
    ElMessage.success(approve ? `已同意「${claim.claimer_name}」的认领申请` : `已拒绝「${claim.claimer_name}」的认领申请`)
    // 列表刷新 + 帖子状态刷新（同意后帖子会变成"已解决"）
    loadClaims()
    loadPost()
  } catch {
    // 失败提示已由 http.ts 统一弹出
  }
}

/** 申请状态标签颜色：待处理橙、已同意绿、已拒绝红（与"我的认领申请"页一致） */
function statusTagType(status: PostClaim['status']) {
  if (status === '已同意') return 'success'
  if (status === '已拒绝') return 'danger'
  return 'warning'
}

/** 后端返回完整时间（如 2026-10-06T12:00:00+08:00），只取"日期 + 时分"方便阅读 */
function formatTime(iso: string) {
  return iso.replace('T', ' ').slice(0, 16)
}

function goBack() {
  router.back()
}

onMounted(() => {
  if (!postId) {
    ElMessage.error('帖子信息不存在')
    router.back()
    return
  }
  loadPost()
  loadClaims()
})
</script>

<template>
  <div class="claims-page">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack">返回</el-button>
        <div v-if="post" class="post-info">
          <h2>《{{ post.title }}》收到的认领申请</h2>
          <p>
            共 {{ total }} 条申请
            <el-tag
              size="small"
              :type="post.is_resolve === '已解决' ? 'success' : 'info'"
              effect="plain"
              class="resolve-tag"
            >
              {{ post.is_resolve }}
            </el-tag>
          </p>
        </div>
      </div>
    </div>

    <!-- 帖子已解决时的提示：此时同意会被后端拒绝，仅拒绝仍可操作 -->
    <el-alert
      v-if="post && post.is_resolve === '已解决'"
      type="success"
      show-icon
      :closable="false"
      class="resolved-tip"
      title="该帖子已解决，新的申请无法再同意（拒绝仍可操作）"
    />

    <div v-loading="loading" class="claim-list">
      <el-empty
        v-if="!loading && claims.length === 0"
        description="暂无认领申请"
      />

      <el-card
        v-for="claim in claims"
        :key="claim.claim_id"
        class="claim-card"
      >
        <div class="claim-header">
          <div class="claimer-info">
            <h3>{{ claim.claimer_name }}</h3>
            <span class="claimer-contact">联系方式：{{ claim.claimer_contact }}</span>
          </div>

          <el-tag :type="statusTagType(claim.status)" effect="plain">
            {{ claim.status }}
          </el-tag>
        </div>

        <el-divider />

        <div class="claim-content">
          <p>
            <strong>认领理由：</strong>
            {{ claim.reason }}
          </p>
          <p>
            <strong>申请时间：</strong>
            {{ formatTime(claim.created_at) }}
          </p>
        </div>

        <!-- 只有"待处理"的申请能审批（与后端规则一致）；帖子已解决后同意按钮禁用 -->
        <div v-if="claim.status === '待处理'" class="claim-actions">
          <el-button
            type="success"
            :disabled="post?.is_resolve === '已解决'"
            @click="handleAudit(claim, true)"
          >
            同意
          </el-button>
          <el-button type="danger" plain @click="handleAudit(claim, false)">
            拒绝
          </el-button>
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
.claims-page {
  padding: 24px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.post-info h2 {
  margin: 0 0 8px;
}

.post-info p {
  margin: 0;
  color: #909399;
  font-size: 13px;
}

.resolve-tag {
  margin-left: 8px;
}

.resolved-tip {
  max-width: 900px;
  margin: 0 auto 16px;
}

.claim-list {
  max-width: 900px;
  margin: 0 auto;
  min-height: 200px;
}

.claim-card {
  margin-bottom: 16px;
}

.claim-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.claimer-info h3 {
  margin: 0 0 4px;
}

.claimer-contact {
  color: #909399;
  font-size: 13px;
}

.claim-content p {
  line-height: 1.8;
  word-break: break-word;
}

.claim-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
