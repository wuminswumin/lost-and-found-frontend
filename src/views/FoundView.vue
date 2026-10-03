<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getAllPosts } from '@/api/post'
import type { Post } from '@/types'

const posts = ref<Post[]>([])
const loading = ref(false)

const keyword = ref('')
const locationKeyword = ref('')
const currentPage = ref(1)
const pageSize = 15
const total = ref(0)

async function loadPosts() {
  loading.value = true

  try {
    const result = await getAllPosts({
      post_type: '招领',
      page: currentPage.value,
    })

    posts.value = result.list
    total.value = result.total
  } catch {
    ElMessage.error('招领信息加载失败')
  } finally {
    loading.value = false
  }
}

function searchPosts() {
  currentPage.value = 1
  loadPosts()
}

function resetSearch() {
  keyword.value = ''
  locationKeyword.value = ''
  currentPage.value = 1
  loadPosts()
}

function handlePageChange(page: number) {
  currentPage.value = page
  loadPosts()
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

onMounted(() => {
  loadPosts()
})
</script>

<template>
  <div class="found-page">
    <div class="page-header">
      <div>
        <h2>招领信息</h2>
        <p>查看校园内发布的招领信息</p>
      </div>

      <el-button
        type="primary"
        @click="$router.push('/found/publish')"
      >
        发布招领
      </el-button>
    </div>

    <el-card class="search-card">
      <div class="search-row">
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
        description="暂无符合条件的招领信息"
      />

      <el-card
        v-for="post in filteredPosts()"
        :key="post.post_id"
        class="post-card"
      >
        <div class="post-header">
          <h3>{{ post.title }}</h3>

          <el-tag
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

          <el-button
            size="small"
            @click="$router.push(`/post?post_id=${post.post_id}`)"
          >
            查看详情
          </el-button>
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
.found-page {
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
}

.search-row .el-input {
  max-width: 280px;
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

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>