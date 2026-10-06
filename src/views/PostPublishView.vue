<template>
  <div class="post-publish-page">
    <el-card class="post-card">
      <template #header>
        <div class="card-header">
          <el-button
            link
            @click="handleBack"
          >
            ← 返回
          </el-button>

          <h2>{{ isEditMode ? '编辑帖子' : '发布帖子' }}</h2>

          <span>
            {{ isEditMode ? '修改信息后重新提交审核' : '填写失物或招领信息' }}
          </span>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        class="post-form"
        @input="formChanged = true"
      >
        <el-form-item label="帖子类型" prop="post_type">
          <el-select
            v-model="form.post_type"
            placeholder="请选择帖子类型"
            style="width: 100%"
            :disabled="isEditMode"
          >
            <el-option
              label="寻物"
              value="寻物"
            />
            <el-option
              label="招领"
              value="招领"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="物品名称" prop="title">
          <el-input
            v-model="form.title"
            placeholder="例如：黑色 iPhone 15"
            maxlength="20"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="地点" prop="event_location">
          <el-input
            v-model="form.event_location"
            :placeholder="
              form.post_type === '寻物'
                ? '例如：图书馆三楼'
                : '例如：图书馆三楼'
            "
            maxlength="20"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="时间" prop="event_time">
          <el-date-picker
            v-model="form.event_time"
            type="datetime"
            placeholder="请选择时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
            @change="formChanged = true"
          />
        </el-form-item>

        <el-form-item label="联系方式" prop="contact">
          <el-input
            v-model="form.contact"
            placeholder="请输入方便联系你的手机号"
            maxlength="20"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="详细描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="5"
            placeholder="请描述物品的颜色、型号、特征等信息"
            maxlength="150"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="物品照片">
          <el-upload
            :http-request="uploadImage"
            list-type="picture-card"
            :show-file-list="true"
            :limit="1"
            accept=".jpg,.jpeg,.png"
            :on-exceed="handleExceed"
            :file-list="uploadFileList"
            :on-preview="handlePicturePreview"
            :on-remove="handleImageRemove"
            @success="formChanged = true"
          >
            <el-button type="primary">选择图片</el-button>

            <template #tip>
              <div class="upload-tip">
                支持 JPG、JPEG、PNG，图片大小不超过 5MB
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="submitting"
            @click="submitForm"
          >
            {{ isEditMode ? '重新提交' : '发布帖子' }}
          </el-button>

          <el-button
            v-if="!isEditMode"
            @click="saveDraft"
          >
            保存草稿
          </el-button>

          <el-button @click="resetForm">
            重置
          </el-button>
        </el-form-item>
      </el-form>
      <ElImageViewer
        v-if="previewVisible"
        :url-list="[previewImageUrl]"
        :initial-index="0"
        :zoom-rate="1.2"
        :min-scale="0.2"
        :max-scale="5"
        :hide-on-click-modal="true"
        @close="previewVisible = false"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ElMessage,
  ElMessageBox,
  ElImageViewer,
  type FormInstance,
  type FormRules,
  type UploadProps,
  type UploadRequestOptions,
} from 'element-plus'

import {
  createPost,
  getPostDetails,
  updateMyPost,
} from '@/api/post'
import { request } from '@/api/http'

import {
  setLeaveGuard,
  clearLeaveGuard,
} from '@/utils/leave-guard'

interface PostForm {
  post_type: '寻物' | '招领'
  title: string
  event_location: string
  event_time: string
  contact: string
  description: string
  image_url: string
}

const formRef = ref<FormInstance>()
const router = useRouter()
const route = useRoute()

const postId = computed(() => {
  const value = Number(route.query.post_id)
  return value > 0 ? value : null
})

const isEditMode = computed(() => postId.value !== null)

const form = reactive<PostForm>({
  post_type: '寻物',
  title: '',
  event_location: '',
  event_time: '',
  contact: '',
  description: '',
  image_url: '',
})

const uploadFileList = computed(() => {
  if (!form.image_url) {
    return []
  }

  return [
    {
      name: '物品图片',
      url: form.image_url,
    },
  ]
})

const previewImageUrl = ref('')
const previewVisible = ref(false)

const handlePicturePreview = (file: any) => {
  previewImageUrl.value = file.url
  previewVisible.value = true
}

const submitting = ref(false)
const formChanged = ref(false)
const initialForm = ref<PostForm | null>(null)

const confirmLeave = async () => {
  const hasChanges =
    initialForm.value &&
    JSON.stringify(form) !== JSON.stringify(initialForm.value)

  if (!hasChanges) {
    return true
  }

  try {
    await ElMessageBox.confirm(
      '您正在填写内容，确定要离开吗？',
      '确认离开',
      {
        confirmButtonText: '确定离开',
        cancelButtonText: '继续编辑',
        type: 'warning',
      },
    )

    return true
  } catch {
    return false
  }
}

const leaveGuard = async () => {
  return await confirmLeave()
}

const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  const hasChanges =
    initialForm.value &&
    JSON.stringify(form) !== JSON.stringify(initialForm.value)

  if (!hasChanges) {
    return
  }

  event.preventDefault()
  event.returnValue = ''
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  setLeaveGuard(leaveGuard)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  clearLeaveGuard(leaveGuard)
})

const handleBack = async () => {
  const canLeave = await confirmLeave()

  if (!canLeave) {
    return
  }

  if (route.query.from === 'home') {
    router.push('/')
    return
  }

  router.push('/posts')
}

const loadPostForEdit = async () => {
  if (!postId.value) {
    return
  }

  try {
    const post = await getPostDetails(postId.value)

    form.post_type = post.post_type
    form.title = post.title
    form.event_location = post.event_location
    form.event_time = post.event_time
    form.contact = post.contact
    form.description = post.description
    form.image_url = post.image_url

    initialForm.value = {
      post_type: post.post_type,
      title: post.title,
      event_location: post.event_location,
      event_time: post.event_time,
      contact: post.contact,
      description: post.description,
      image_url: post.image_url,
    }

    formChanged.value = false
  } catch (error) {
    console.error('获取帖子信息失败:', error)
    ElMessage.error('获取帖子信息失败')
    router.back()
  }
}

onMounted(async () => {
  if (isEditMode.value) {
    await loadPostForEdit()
    return
  }

  const draft = localStorage.getItem('lost-found-post-draft')

  if (draft) {
    try {
      const draftForm = JSON.parse(draft) as PostForm

      await ElMessageBox.confirm(
        '检测到上次保存的草稿，是否恢复？',
        '恢复草稿',
        {
          confirmButtonText: '恢复草稿',
          cancelButtonText: '暂不恢复',
          type: 'info',
        },
      )

      Object.assign(form, draftForm)

      ElMessage.success('草稿已恢复')
    } catch {
      // 用户选择暂不恢复
    }
  }

  initialForm.value = {
    ...form,
  }
})

const rules: FormRules<PostForm> = {
  post_type: [
    {
      required: true,
      message: '请选择帖子类型',
      trigger: 'change',
    },
  ],
  title: [
    {
      required: true,
      message: '请输入物品名称',
      trigger: 'blur',
    },
  ],
  event_location: [
    {
      required: true,
      message: '请输入地点',
      trigger: 'blur',
    },
  ],
  event_time: [
    {
      required: true,
      message: '请选择时间',
      trigger: 'change',
    },
  ],
  contact: [
    {
      required: true,
      message: '请输入联系方式',
      trigger: 'blur',
    },
  ],
  description: [
    {
      required: true,
      message: '请输入物品描述',
      trigger: 'blur',
    },
  ],
}

const uploadImage = async (options: UploadRequestOptions) => {
  const file = options.file

  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    ElMessage.error('只支持 JPG、JPEG、PNG 格式的图片')

    options.onError?.({
      name: 'UploadError',
      status: 400,
      method: 'POST',
      url: '/api/upload',
      message: '图片格式不正确',
    })

    return
  }

  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 5MB')

    options.onError?.({
      name: 'UploadError',
      status: 400,
      method: 'POST',
      url: '/api/upload',
      message: '图片过大',
    })

    return
  }

  try {
    const formData = new FormData()
    formData.append('file', file)

    const result = await request<{ image_url: string }>({
      method: 'POST',
      url: '/api/upload',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    form.image_url = result.image_url

    options.onSuccess?.(result)
    ElMessage.success('图片上传成功')
  } catch (error) {
    options.onError?.({
      name: 'UploadError',
      status: 500,
      method: 'POST',
      url: '/api/upload',
      message:
        error instanceof Error ? error.message : '图片上传失败',
    })
  }
}

const handleExceed: UploadProps['onExceed'] = () => {
  ElMessage.warning('最多只能上传一张图片')
}

const handleImageRemove = () => {
  form.image_url = ''
  formChanged.value = true
}

const submitForm = async () => {
  if (!formRef.value) {
    return
  }

  try {
    await formRef.value.validate()

    submitting.value = true

    if (isEditMode.value && postId.value) {
      await updateMyPost(postId.value, {
        title: form.title,
        event_location: form.event_location,
        event_time: form.event_time,
        contact: form.contact,
        description: form.description,
        image_url: form.image_url,
      })

      ElMessage.success('帖子修改成功，已重新提交审核')
    } else {
      await createPost({
        post_type: form.post_type,
        title: form.title,
        event_location: form.event_location,
        event_time: form.event_time,
        contact: form.contact,
        description: form.description,
        image_url: form.image_url,
      })
      localStorage.removeItem('lost-found-post-draft')
      ElMessage.success('帖子发布成功，等待管理员审核')
    }

    router.push('/posts')
  } catch (error) {
    console.error(
      isEditMode.value ? '重新提交帖子失败：' : '发布帖子失败：',
      error,
    )
  } finally {
    submitting.value = false
  }
}

const saveDraft = () => {
  localStorage.setItem(
    'lost-found-post-draft',
    JSON.stringify({
      ...form,
    }),
  )

  ElMessage.success('草稿已保存到本地')
}

const resetForm = () => {
  if (isEditMode.value) {
    loadPostForEdit()
    return
  }

  formRef.value?.resetFields()
  form.post_type = '寻物'
  form.image_url = ''
}
</script>

<style scoped>
.post-publish-page {
  max-width: 900px;
  margin: 30px auto;
  padding: 0 20px;
}

.post-card {
  width: 100%;
}

.card-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.card-header h2 {
  margin: 0;
}

.card-header span {
  color: #909399;
  font-size: 14px;
}

.post-form {
  max-width: 700px;
}

.upload-tip {
  color: #909399;
  font-size: 13px;
  margin-top: 5px;
}


</style>