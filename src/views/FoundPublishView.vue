<template>
  <div class="found-publish-page">
    <el-card class="found-publish-card">
      <template #header>
        <div class="card-header">
          <h2>发表招领信息</h2>
          <span>填写你捡到物品的信息</span>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        class="found-publish-form"
      >
        <el-form-item label="物品名称" prop="title">
          <el-input
            v-model="form.title"
            placeholder="例如：黑色 iPhone 15"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="捡到地点" prop="event_location">
          <el-input
            v-model="form.event_location"
            placeholder="例如：图书馆三楼"
          />
        </el-form-item>

        <el-form-item label="捡到时间" prop="event_time">
          <el-date-picker
            v-model="form.event_time"
            type="datetime"
            placeholder="请选择捡到时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="联系方式" prop="contact">
          <el-input
            v-model="form.contact"
            placeholder="请输入方便失主联系你的方式"
          />
        </el-form-item>

        <el-form-item label="详细描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="5"
            placeholder="请描述物品的颜色、型号、特征等信息"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="物品照片">
          <el-upload
            :http-request="uploadImage"
            :show-file-list="true"
            :limit="1"
            accept=".jpg,.jpeg,.png"
            :on-exceed="handleExceed"
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
            发布招领信息
          </el-button>

          <el-button @click="resetForm">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import {
  ElMessage,
  type FormInstance,
  type FormRules,
  type UploadProps,
  type UploadRequestOptions,
} from 'element-plus'

import { createPost } from '@/api/post'
import { request } from '@/api/http'

interface FoundPublishForm {
  title: string
  event_location: string
  event_time: string
  contact: string
  description: string
  image_url: string
}

const formRef = ref<FormInstance>()

const form = reactive<FoundPublishForm>({
  title: '',
  event_location: '',
  event_time: '',
  contact: '',
  description: '',
  image_url: '',
})

const submitting = ref(false)

const rules: FormRules<FoundPublishForm> = {
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
      message: '请输入捡到地点',
      trigger: 'blur',
    },
  ],
  event_time: [
    {
      required: true,
      message: '请选择捡到时间',
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
      message: error instanceof Error ? error.message : '图片上传失败',
    })
  }
}

const handleExceed: UploadProps['onExceed'] = () => {
  ElMessage.warning('最多只能上传一张图片')
}

const submitForm = async () => {
  if (!formRef.value) {
    return
  }

  try {
    await formRef.value.validate()

    submitting.value = true

    await createPost({
      post_type: '招领',
      title: form.title,
      event_location: form.event_location,
      event_time: form.event_time,
      contact: form.contact,
      description: form.description,
      image_url: form.image_url,
    })

    ElMessage.success('招领信息发布成功，等待管理员审核')

    resetForm()
  } catch (error) {
    console.error('发布招领信息失败：', error)
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  formRef.value?.resetFields()
  form.image_url = ''
}
</script>

<style scoped>
.found-publish-page {
  max-width: 900px;
  margin: 30px auto;
  padding: 0 20px;
}

.found-publish-card {
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

.found-publish-form {
  max-width: 700px;
}

.upload-tip {
  color: #909399;
  font-size: 13px;
  margin-top: 5px;
}
</style>
