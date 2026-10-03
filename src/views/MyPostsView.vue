<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteMyPost, getMyPosts } from '@/api/post'
import type { Post } from '@/types'

const posts = ref<Post[]>([])
const loading = ref(false)

const postType = ref<'全部' | '寻物' | '招领'>('全部')
const isResolve = ref<'全部' | '已解决' | '未解决'>('全部')

const currentPage = ref(1)
const pageSize = 15
const total = ref(0)

async function loadPosts() {
  loading.value = true

  try {
    const result = await getMyPosts({
      page: currentPage.value,
      ...(postType.value !== '全部'
        ? { post_type: postType.value }
        : {}),
      ...(isResolve.value !== '全部'
        ? { is_resolve: isResolve.value }
        : {}),
    })

    posts.value = result.list
    total.value = result.total
  } catch {
    ElMessage.error('我的帖子加载失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  currentPage.value = 1
  loadPosts()
}

function handleReset() {
  postType.value = '全部'
  isResolve.value = '全部'
  currentPage.value = 1
  loadPosts()
}

function handlePageChange(page: number) {
  currentPage.value = page
  loadPosts()
}

async function handleDelete(post: Post) {
  try {
    await ElMessageBox.confirm(
      `确定要删除帖子「${post.title}」吗？`,
      '删除确认',
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
      },
    )

    await deleteMyPost(post.post_id)

    ElMessage.success('帖子删除成功')
    loadPosts()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error('帖子删除失败')
    }
  }
}

onMounted(() => {
  loadPosts()
})
</script>

<template>
  <div class="my-posts-page">
    <div class="page-header">
      <div>
        <h2>我的帖子</h2>
        <p>管理你发布的失物和招领信息</p>
      </div>
    </div>

    <el-card class="filter-card">
      <div class="filter-row">
        <el-select
          v-model="postType"
          placeholder="帖子类型"
          style="width: 160px"
        >
          <el-option label="全部类型" value="全部" />
          <el-option label="寻物" value="寻物" />
          <el-option label="招领" value="招领" />
        </el-select>

        <el-select
          v-model="isResolve"
          placeholder="处理状态"
          style="width: 160px"
        >
          <el-option label="全部状态" value="全部" />
          <el-option label="未解决" value="未解决" />
          <el-option label="已解决" value="已解决" />
        </el-select>

        <el-button type="primary" @click="handleSearch">
          查询
        </el-button>

        <el-button @click="handleReset">
          重置
        </el-button>
      </div>
    </el-card>

    <div v-loading="loading" class="post-list">
      <el-empty
        v-if="!loading && posts.length === 0"
        description="暂无帖子"
      />

      <el-card
        v-for="post in posts"
        :key="post.post_id"
        class="post-card"
      >
        <div class="post-header">
          <div class="title-area">
            <h3>{{ post.title }}</h3>

            <div class="tags">
              <el-tag
                :type="post.post_type === '寻物' ? 'warning' : 'success'"
              >
                {{ post.post_type }}
              </el-tag>

              <el-tag
                :type="post.is_resolve === '已解决' ? 'success' : 'info'"
              >
                {{ post.is_resolve || '未解决' }}
              </el-tag>

              <el-tag
                :type="post.status === '已通过' ? 'success' : 'warning'"
              >
                {{ post.status }}
              </el-tag>
            </div>
          </div>
        </div>

        <p>
          <strong>地点：</strong>
          {{ post.event_location }}
        </p>

        <p>
          <strong>时间：</strong>
          {{ post.event_time }}
        </p>

        <p v-if="post.description">
          <strong>描述：</strong>
          {{ post.description }}
        </p>

        <div class="post-footer">
          <span>
            发布时间：{{ post.created_at }}
          </span>

          <div class="actions">
            <el-button
              size="small"
              @click="$router.push(`/post?post_id=${post.post_id}`)"
            >
              查看详情
            </el-button>

            <el-button
              size="small"
              type="danger"
              plain
              @click="handleDelete(post)"
            >
              删除
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <div
      v-if="total > pageSize"
      class="pagination"
    >
      <el-pagination
        background
        layout="prev, pager, next"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.my-posts-page {
  padding: 24px;
}

.page-header {
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
  align-items: center;
  gap: 12px;
}

.post-list {
  min-height: 200px;
}

.post-card {
  margin-bottom: 16px;
}

.post-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.title-area h3 {
  margin: 0 0 10px;
}

.tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.post-card p {
  line-height: 1.6;
}

.post-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
  color: #909399;
  font-size: 13px;
}

.actions {
  display: flex;
  gap: 8px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>