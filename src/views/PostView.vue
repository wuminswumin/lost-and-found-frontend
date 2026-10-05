<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getPostDetails } from '@/api/post'
import type { Post } from '@/types'

const route = useRoute()
const router = useRouter()

const post = ref<Post | null>(null)
const loading = ref(false)

async function loadPostDetails() {
  const postId = Number(route.query.post_id)

  if (!postId) {
    ElMessage.error('帖子信息不存在')
    router.back()
    return
  }

  loading.value = true

  try {
    const result = await getPostDetails(postId)
    post.value = result
  } catch (error) {
    console.error('获取帖子详情失败:', error)
    ElMessage.error('获取帖子详情失败')
  } finally {
    loading.value = false
  }
}


function goBack() {
  router.back()
}

onMounted(() => {
  loadPostDetails()
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
        <p>{{ post.post_type }}</p>
      </div>
    </div>

    <el-empty
      v-if="!loading && !post"
      description="暂无帖子详情"
    />

    <el-card v-if="post" class="detail-card">
      <div class="detail-header">
        <h2>{{ post.title }}</h2>

        <el-tag
          :type="post.post_type === '招领' ? 'success' : 'warning'"
        >
          {{ post.post_type }}
        </el-tag>
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
</style>