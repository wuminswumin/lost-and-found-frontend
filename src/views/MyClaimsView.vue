<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { request } from '@/api/http'

interface MyClaim {
  claim_id: number
  post_id: number
  post_title: string
  post_type: '寻物' | '招领'
  reason: string
  status: string
  created_at: string
}

const router = useRouter()

const claims = ref<MyClaim[]>([])
const loading = ref(false)
const cancellingClaimId = ref<number | null>(null)

async function loadMyClaims() {
  loading.value = true

  try {
    const result = await request<{
      list: MyClaim[]
    }>({
      method: 'GET',
      url: '/api/my/claims',
    })

    claims.value = result.list || []
  } catch (error) {
    console.error('获取我的认领申请失败:', error)
    ElMessage.error('获取我的认领申请失败')
  } finally {
    loading.value = false
  }
}

function getStatusType(status: string) {
  if (status === '已同意') {
    return 'success'
  }

  if (status === '已拒绝') {
    return 'danger'
  }

  return 'warning'
}

function viewPost(claim: MyClaim) {
  router.push({
    name: 'post',
    query: {
      post_id: claim.post_id,
    },
  })
}

async function cancelClaim(claim: MyClaim) {
  if (claim.status !== '待处理') {
    return
  }

  try {
    await ElMessageBox.confirm(
      '取消后，这条认领申请将无法继续审核。确定要取消吗？',
      '确认取消认领申请',
      {
        confirmButtonText: '确定取消',
        cancelButtonText: '暂不取消',
        type: 'warning',
      },
    )
  } catch {
    return
  }

  cancellingClaimId.value = claim.claim_id

  try {
    await request({
      method: 'DELETE',
      url: `/api/claims/${claim.claim_id}`,
    })

    ElMessage.success('认领申请已取消')

    await loadMyClaims()
  } catch (error) {
    console.error('取消认领申请失败:', error)
    ElMessage.error('取消认领申请失败')
  } finally {
    cancellingClaimId.value = null
  }
}

onMounted(() => {
  loadMyClaims()
})
</script>

<template>
  <div v-loading="loading" class="my-claims-page">
    <div class="page-header">
      <h2>我的认领申请</h2>
      <p>查看你提交过的认领申请及审核结果</p>
    </div>

    <el-empty
      v-if="!loading && claims.length === 0"
      description="暂无认领申请"
    />

    <div v-else class="claim-list">
      <el-card
        v-for="claim in claims"
        :key="claim.claim_id"
        class="claim-card"
      >
        <div class="claim-header">
          <div class="claim-title">
            <h3>{{ claim.post_title }}</h3>

            <el-tag
              :type="claim.post_type === '招领' ? 'success' : 'warning'"
            >
              {{ claim.post_type }}
            </el-tag>
          </div>

          <el-tag :type="getStatusType(claim.status)">
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
            {{ claim.created_at }}
          </p>
        </div>

        <div class="claim-actions">
          <el-button
            type="primary"
            plain
            @click="viewPost(claim)"
          >
            查看帖子详情
          </el-button>

          <el-button
            v-if="claim.status === '待处理'"
            type="danger"
            plain
            :loading="cancellingClaimId === claim.claim_id"
            @click="cancelClaim(claim)"
          >
            取消申请
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.my-claims-page {
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

.claim-list {
  max-width: 900px;
  margin: 0 auto;
}

.claim-card {
  margin-bottom: 16px;
}

.claim-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.claim-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.claim-title h3 {
  margin: 0;
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
</style>