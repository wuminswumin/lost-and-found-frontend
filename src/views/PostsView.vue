<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getAllPosts,
  getMyPosts,
  deleteMyPost,
} from '@/api/post'
import type { Post } from '@/types'

const posts = ref<Post[]>([])
const loading = ref(false)

const postType = ref<'全部' | '寻物' | '招领'>('全部')
const postScope = ref<'全部帖子' | '我的帖子'>('全部帖子')

const keyword = ref('')
const locationKeyword = ref('')

const currentPage = ref(1)
const pageSize = 15
const total = ref(0)
const router = useRouter()

function saveListState() {
  sessionStorage.setItem(
    'posts_list_state',
    JSON.stringify({
      postType: postType.value,
      postScope: postScope.value,
      keyword: keyword.value,
      locationKeyword: locationKeyword.value,
      currentPage: currentPage.value,
    }),
  )
}

async function loadPosts() {
  loading.value = true

  try {
    const params = {
      post_type:
        postType.value === '全部'
          ? undefined
          : postType.value,
      page: currentPage.value,
    }

    const result =
      postScope.value === '我的帖子'
        ? await getMyPosts(params)
        : await getAllPosts(params)

    posts.value = result.list
    total.value = result.total
  } catch {
    ElMessage.error('帖子加载失败')
  } finally {
    loading.value = false
  }
}

function searchPosts() {
  currentPage.value = 1
  loadPosts()
}

function resetSearch() {
  postType.value = '全部'
  postScope.value = '全部帖子'
  keyword.value = ''
  locationKeyword.value = ''
  currentPage.value = 1
  loadPosts()
}

function handlePageChange(page: number) {
  currentPage.value = page
  loadPosts()
}

function handleFilterChange() {
  currentPage.value = 1
  loadPosts()
}

function viewPost(post: Post) {
  saveListState()

  sessionStorage.setItem(
    `post_${post.post_id}`,
    JSON.stringify(post),
  )

  router.push(`/post?post_id=${post.post_id}`)
}

async function handleDelete(post: Post) {
  try {
    await ElMessageBox.confirm(
      `确定要删除帖子“${post.title}”吗？`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    await deleteMyPost(post.post_id)

    ElMessage.success('帖子删除成功')

    await loadPosts()
  } catch (error) {
    if (error === 'cancel' || error === 'close') {
      return
    }

    console.error('删除帖子失败:', error)
    ElMessage.error('帖子删除失败')
  }
}

const filteredPosts = () => {
  return posts.value.filter((post) => {
    const matchKeyword =
      !keyword.value ||
      post.title.toLowerCase().includes(keyword.value.toLowerCase()) ||
      post.description.toLowerCase().includes(keyword.value.toLowerCase())

    const matchLocation =
      !locationKeyword.value ||
      post.event_location
        .toLowerCase()
        .includes(locationKeyword.value.toLowerCase())

    return matchKeyword && matchLocation
  })
}

watch(
  [postType, postScope, keyword, locationKeyword, currentPage],
  () => {
    saveListState()
  },
)

onMounted(() => {
  const savedState = sessionStorage.getItem('posts_list_state')

  if (savedState) {
    try {
      const state = JSON.parse(savedState)

      postType.value = state.postType ?? '全部'
      postScope.value = state.postScope ?? '全部帖子'
      keyword.value = state.keyword ?? ''
      locationKeyword.value = state.locationKeyword ?? ''
      currentPage.value = state.currentPage ?? 1
    } catch {
      sessionStorage.removeItem('posts_list_state')
    }
  }

  loadPosts()
})
</script>

<template>
  <div class="posts-page">
    <div class="page-header">
      <div>
        <h2>查看帖子</h2>
        <p>查看校园内发布的失物和招领信息</p>
      </div>

      <el-button
        type="primary"
        @click="$router.push('/post/publish')"
      >
        发布帖子
      </el-button>
    </div>

    <el-card class="search-card">
      <div class="search-row">
        <el-select
          v-model="postScope"
          placeholder="帖子范围"
          @change="handleFilterChange"
        >
          <el-option
            label="全部帖子"
            value="全部帖子"
          />
          <el-option
            label="我的帖子"
            value="我的帖子"
          />
        </el-select>

        <el-select
          v-model="postType"
          placeholder="帖子类型"
          @change="handleFilterChange"
        >
          <el-option
            label="全部类型"
            value="全部"
          />
          <el-option
            label="寻物"
            value="寻物"
          />
          <el-option
            label="招领"
            value="招领"
          />
        </el-select>

        <el-input
          v-model="keyword"
          placeholder="搜索物品名称或描述"
          clearable
          @keyup.enter="searchPosts"
        />

        <el-input
          v-model="locationKeyword"
          placeholder="搜索地点"
          clearable
          @keyup.enter="searchPosts"
        />

        <el-button type="primary" @click="searchPosts">
          搜索
        </el-button>

        <el-button @click="resetSearch">
          重置
        </el-button>
      </div>
    </el-card>

    <div v-loading="loading" class="post-list">
      <el-empty
        v-if="!loading && filteredPosts().length === 0"
        description="暂无符合条件的帖子"
      />

      <el-card
        v-for="post in filteredPosts()"
        :key="post.post_id"
        class="post-card"
      >
        <div class="post-header">
          <div class="title-area">
            <h3>{{ post.title }}</h3>

            <el-tag
              :type="post.post_type === '寻物' ? 'warning' : 'success'"
            >
              {{ post.post_type }}
            </el-tag>
          </div>

          <el-tag
            v-if="postScope === '我的帖子'"
            :type="post.status === '已通过' ? 'success' : 'info'"
          >
            {{ post.status }}
          </el-tag>
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

          <div class="post-actions">
            <el-button
              size="small"
              @click="viewPost(post)"
            >
              查看详情
            </el-button>

            <el-button
              v-if="postScope === '我的帖子'"
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
.posts-page {
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

.search-card {
  margin-bottom: 24px;
}

.search-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.search-row .el-input {
  max-width: 280px;
}

.search-row .el-select {
  width: 140px;
}

.post-list {
  min-height: 200px;
}

.post-card {
  margin-bottom: 16px;
}

.post-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.title-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.post-header h3 {
  margin: 0;
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

.post-actions {
  display: flex;
  gap: 8px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>