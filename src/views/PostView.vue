<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPostDetails } from '@/api/post'
import { getUserProfile } from '@/api/account'
import { request } from '@/api/http'
import { loadLogin } from '@/utils/auth-storage'
import { createComment, deleteComment, getComments } from '@/api/comment'
import type { PostComment } from '@/api/comment'
import type { Post } from '@/types'

interface MyClaim {
  claim_id: number
  post_id: number
  post_title: string
  post_type: '寻物' | '招领'
  reason: string
  status: string
  created_at: string
}

const route = useRoute()
const router = useRouter()

const post = ref<Post | null>(null)
const loading = ref(false)

const currentUserId = ref<number | null>(null)

const claimReason = ref('')
const claiming = ref(false)
const claimSubmitted = ref(false)

// ===== 评论（游客可看，登录才能发）=====
const comments = ref<PostComment[]>([])
const commentsLoading = ref(false)
const commentTotal = ref(0)
const commentPage = ref(1)
const commentPageSize = 30 // 后端写死每页 30 条
const commentInput = ref('')
const commentSubmitting = ref(false)
const deletingCommentId = ref<number | null>(null)

const isLoggedIn = computed(() => !!loadLogin()?.token)

const claimDraftKey = computed(() => {
  const postId = route.query.post_id
  return postId ? `claim_draft_${postId}` : ''
})

const canClaim = computed(() => {
  if (!post.value || currentUserId.value === null) {
    return false
  }

  return (
    post.value.post_type === '招领' &&
    post.value.is_resolve === '未解决' &&
    post.value.user_id !== currentUserId.value &&
    !claimSubmitted.value
  )
})

async function loadMyClaim(postId: number) {
  try {
    const result = await request<{
      list: MyClaim[]
    }>({
      method: 'GET',
      url: '/api/my/claims',
    })

    const currentClaim = result.list.find(
      (claim) =>
        claim.post_id === postId &&
        claim.status === '待处理',
    )

    if (currentClaim) {
      claimSubmitted.value = true
      claimReason.value = currentClaim.reason
    }
    else {
      const draft = sessionStorage.getItem(claimDraftKey.value)

      if (draft) {
        claimReason.value = draft
      }
    }
  } catch (error) {
    console.error('获取我的认领申请失败:', error)
  }
}

async function loadComments() {
  const postId = Number(route.query.post_id)
  if (!postId) return

  commentsLoading.value = true
  try {
    const data = await getComments(postId, commentPage.value)
    comments.value = data.list
    commentTotal.value = data.total
  } catch {
    // 失败提示已由 http.ts 统一弹出
  } finally {
    commentsLoading.value = false
  }
}

async function handleSubmitComment() {
  const postId = Number(route.query.post_id)
  const content = commentInput.value.trim()

  if (!content) {
    ElMessage.warning('请输入评论内容')
    return
  }

  commentSubmitting.value = true
  try {
    await createComment(postId, content)
    ElMessage.success('评论发布成功')
    commentInput.value = ''
    // 新评论排在最前，回第一页刷新
    commentPage.value = 1
    loadComments()
  } catch {
    // 失败提示已由 http.ts 统一弹出（如帖子未过审、被禁言）
  } finally {
    commentSubmitting.value = false
  }
}

async function handleDeleteComment(comment: PostComment) {
  const postId = Number(route.query.post_id)

  try {
    await ElMessageBox.confirm('确定删除这条评论吗？删除后无法恢复。', '确认删除', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return // 用户点了取消
  }

  deletingCommentId.value = comment.comment_id
  try {
    await deleteComment(postId, comment.comment_id)
    ElMessage.success('评论已删除')

    // 当前页删空了就退回上一页
    if (comments.value.length === 1 && commentPage.value > 1) {
      commentPage.value -= 1
    }
    loadComments()
  } catch {
    // 失败提示已由 http.ts 统一弹出（比如"这不是你的评论"）
  } finally {
    deletingCommentId.value = null
  }
}

function handleCommentPageChange(page: number) {
  commentPage.value = page
  loadComments()
}

/** 判断某条评论是不是自己发的（后端没返回用户名，只能按 user_id 对） */
function isOwnComment(comment: PostComment) {
  return isLoggedIn.value && comment.user_id === currentUserId.value
}

function formatTime(iso: string) {
  return iso.replace('T', ' ').slice(0, 16)
}

async function loadPostDetails() {
  const postId = Number(route.query.post_id)

  if (!postId) {
    ElMessage.error('帖子信息不存在')
    router.back()
    return
  }

  loading.value = true

  try {
    // 帖子详情本身允许游客访问
    const postData = await getPostDetails(postId)
    post.value = postData

    // 只有登录用户才需要获取个人信息和认领申请
    if (isLoggedIn.value) {
      const userData = await getUserProfile()
      currentUserId.value = userData.user_id

      await loadMyClaim(postId)
    }
  } catch (error) {
    console.error('获取帖子详情失败:', error)
    ElMessage.error('获取帖子详情失败')
  } finally {
    loading.value = false
  }
}

function saveClaimDraft() {
  if (!claimDraftKey.value || claimSubmitted.value) {
    return
  }

  sessionStorage.setItem(
    claimDraftKey.value,
    claimReason.value,
  )
}

async function handleClaim() {
  if (!post.value || !canClaim.value) {
    return
  }

  const reason = claimReason.value.trim()

  if (!reason) {
    ElMessage.warning('请填写认领理由')
    return
  }

  if (reason.length > 255) {
    ElMessage.warning('认领理由不能超过255个字符')
    return
  }

  try {
    await ElMessageBox.confirm(
      '提交后将生成一条待处理的认领申请，确定要提交吗？',
      '确认提交认领申请',
      {
        confirmButtonText: '确定提交',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )
  } catch {
    // 用户点击取消，不提交，同时保留输入的理由
    return
  }

  claiming.value = true

  try {
    await request({
      method: 'POST',
      url: `/api/posts/${post.value.post_id}/claims`,
      data: {
        reason,
      },
    })

    claimSubmitted.value = true
    claimReason.value = reason
    sessionStorage.removeItem(claimDraftKey.value)
    ElMessage.success('认领申请提交成功')
  } catch (error) {
    console.error('提交认领申请失败:', error)
    ElMessage.error('认领申请提交失败')
  } finally {
    claiming.value = false
  }
}

function goBack() {
  router.back()
}

onMounted(() => {
  loadPostDetails()
  loadComments()
})
</script>

<template>
  <div v-loading="loading" class="post-detail-page">
    <div class="page-header">
      <el-button @click="goBack">
        返回
      </el-button>

      <div v-if="post">
        <h2>帖子详情</h2>
      </div>
    </div>

    <el-empty
      v-if="!loading && !post"
      description="暂无帖子详情"
    />

    <el-card v-if="post" class="detail-card">
      <div class="detail-header">
        <h2>{{ post.title }}</h2>

        <div class="post-tags">
          <el-tag
            :type="post.post_type === '招领' ? 'success' : 'warning'"
          >
            {{ post.post_type }}
          </el-tag>

          <el-tag
            v-if="isLoggedIn && post.user_id === currentUserId"
            type="primary"
          >
            我的帖子
          </el-tag>

          <!-- 作者本人看自己的招领帖时，可以进入收到的认领申请审批页 -->
          <el-button
            v-if="
              isLoggedIn &&
                post.user_id === currentUserId &&
                post.post_type === '招领'
            "
            size="small"
            type="primary"
            plain
            @click="
              router.push({
                path: '/post/claims',
                query: { post_id: post.post_id },
              })
            "
          >
            查看认领申请
          </el-button>
        </div>
      </div>

      <el-divider />

      <div class="detail-content">
        <p>
          <strong>地点：</strong>
          {{ post.event_location }}
        </p>

        <p>
          <strong>时间：</strong>
          {{ post.event_time }}
        </p>

        <p>
          <strong>联系方式：</strong>
          {{ post.contact }}
        </p>

        <p v-if="post.description">
          <strong>详细描述：</strong>
          {{ post.description }}
        </p>

        <p>
          <strong>发布时间：</strong>
          {{ post.created_at }}
        </p>
      </div>

      <div v-if="post.image_url" class="image-section">
        <strong>物品图片：</strong>

        <div class="image-wrapper">
          <el-image
            :src="post.image_url"
            fit="contain"
            :preview-src-list="[post.image_url]"
            preview-teleported
          />
        </div>
      </div>

      <el-divider />

      <div
        v-if="
          post.post_type === '招领' &&
          post.is_resolve === '未解决' &&
          (!isLoggedIn || post.user_id !== currentUserId)
        "
        class="claim-section"
      >
        <h3>认领申请</h3>

        <template v-if="isLoggedIn">
          <el-input
            v-model="claimReason"
            @input="saveClaimDraft"
            type="textarea"
            :rows="4"
            maxlength="255"
            show-word-limit
            placeholder="请输入认领理由，例如物品特征、丢失时间、能够证明物品属于自己的信息等"
            :disabled="claimSubmitted"
          />

          <div class="claim-actions">
            <el-button
              v-if="!claimSubmitted"
              type="primary"
              :loading="claiming"
              @click="handleClaim"
            >
              提交认领申请
            </el-button>

            <el-tag
              v-else
              type="success"
              size="large"
            >
              已提交认领申请，等待处理
            </el-tag>
          </div>
        </template>

        <div v-else class="login-tip">
          <el-alert
            title="登录后可以提交认领申请"
            type="info"
            show-icon
          >
            <template #default>
              <el-button
                type="primary"
                link
                @click="router.push('/login')"
              >
                去登录
              </el-button>
            </template>
          </el-alert>
        </div>
      </div>

      <el-divider />

      <!-- 评论区：游客也能看，发表评论需要登录 -->
      <div class="comment-section">
        <h3>评论（{{ commentTotal }}）</h3>

        <div v-if="isLoggedIn" class="comment-editor">
          <el-input
            v-model="commentInput"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
            placeholder="友善发言，理性交流"
          />

          <div class="comment-editor-actions">
            <el-button
              type="primary"
              :loading="commentSubmitting"
              @click="handleSubmitComment"
            >
              发表评论
            </el-button>
          </div>
        </div>

        <div v-else class="login-tip">
          <el-alert
            title="登录后可以发表评论"
            type="info"
            show-icon
          >
            <template #default>
              <el-button
                type="primary"
                link
                @click="router.push('/login')"
              >
                去登录
              </el-button>
            </template>
          </el-alert>
        </div>

        <div v-loading="commentsLoading" class="comment-list">
          <el-empty
            v-if="!commentsLoading && comments.length === 0"
            description="暂无评论，来抢沙发吧"
          />

          <div
            v-for="comment in comments"
            :key="comment.comment_id"
            class="comment-item"
          >
            <div class="comment-head">
              <span class="comment-author">
                {{ isOwnComment(comment) ? '我' : `用户 #${comment.user_id}` }}
              </span>
              <span class="comment-time">{{ formatTime(comment.created_at) }}</span>
            </div>

            <p class="comment-content">
              {{ comment.content }}
            </p>

            <div v-if="isOwnComment(comment)" class="comment-actions">
              <el-button
                type="danger"
                plain
                size="small"
                :loading="deletingCommentId === comment.comment_id"
                @click="handleDeleteComment(comment)"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>

        <div v-if="commentTotal > commentPageSize" class="pagination">
          <el-pagination
            background
            layout="total, prev, pager, next"
            :current-page="commentPage"
            :page-size="commentPageSize"
            :total="commentTotal"
            @current-change="handleCommentPageChange"
          />
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.post-detail-page {
  padding: 24px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0 0 6px;
}

.page-header p {
  margin: 0;
  color: #909399;
}

.detail-card {
  max-width: 900px;
  margin: 0 auto;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.detail-header h2 {
  margin: 0;
}

.detail-content p {
  line-height: 1.8;
}

.image-section {
  margin-top: 24px;
}

.image-wrapper {
  margin-top: 12px;
}

.image-wrapper .el-image {
  width: 300px;
  max-height: 300px;
  border-radius: 8px;
}

.claim-section {
  margin-top: 24px;
}

.claim-section h3 {
  margin: 0 0 16px;
}

.claim-actions {
  margin-top: 16px;
}

.login-tip {
  margin-top: 12px;
}

.comment-section {
  margin-top: 24px;
}

.comment-section h3 {
  margin: 0 0 16px;
}

.comment-editor-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.comment-list {
  margin-top: 20px;
  min-height: 100px;
}

.comment-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.comment-author {
  font-weight: 600;
  color: #409eff;
}

.comment-time {
  font-size: 12px;
  color: #909399;
}

.comment-content {
  margin: 8px 0 0;
  line-height: 1.8;
  word-break: break-word;
}

.comment-actions {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.post-tags {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>

