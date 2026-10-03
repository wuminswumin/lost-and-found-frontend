<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

import { getUserProfile, updatePassword, updateProfile } from '@/api/account'
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/types'

const auth = useAuthStore()

// ===== 加载个人信息 =====
const profile = ref<User | null>(null)
const loading = ref(false) // 页面加载中：给卡片转圈圈用
const loadFailed = ref(false)

/** 进入页面时自动调用：去后端拿当前用户的信息 */
async function loadProfile() {
  loading.value = true
  loadFailed.value = false
  try {
    const data = await getUserProfile()
    profile.value = data
    // 顺手把"修改个人信息"表单填上当前值，用户直接改就行
    profileForm.username = data.username
    profileForm.phone_num = data.phone_num
  } catch {
    // 失败提示已由 http.ts 统一弹出，这里只把"重新加载"按钮亮出来
    loadFailed.value = true
  } finally {
    loading.value = false
  }
}

onMounted(loadProfile)

// 身份标签的颜色：普通用户灰、失物招领管理员橙、系统管理员红
const roleTagType = computed(() => {
  switch (profile.value?.role) {
    case '系统管理员':
      return 'danger'
    case '失物招领管理员':
      return 'warning'
    default:
      return 'info'
  }
})

// ===== 第一组：修改个人信息（用户名、手机号） =====
const profileFormRef = ref<FormInstance>()
const profileForm = reactive({ username: '', phone_num: '' })
const savingProfile = ref(false)

// 校验规则：用户名 3~15 位（与后端注册规则 min=3,max=15 一致）；手机号必填（格式由后端把关）
const profileRules: FormRules<typeof profileForm> = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 15, message: '用户名长度 3~15 位', trigger: 'blur' },
  ],
  phone_num: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
}

/** 提交修改申请：校验通过 → 调接口 → 用返回的最新信息刷新上方展示 */
async function handleSaveProfile() {
  const ok = await profileFormRef.value?.validate().catch(() => false)
  if (!ok) return

  savingProfile.value = true
  try {
    const data = await updateProfile({ ...profileForm })
    profile.value = data
    auth.setUsername(data.username) // 同步全局登录态，首页问候语跟着变新名字
    ElMessage.success('个人信息修改成功')
  } catch {
    // 失败提示已由 http.ts 统一弹出
  } finally {
    savingProfile.value = false
  }
}

// ===== 第二组：修改密码（原密码 + 两遍新密码） =====
const passwordFormRef = ref<FormInstance>()
const passwordForm = reactive({
  old_password: '',
  new_password: '',
  confirm_password: '',
})
const savingPassword = ref(false)

const passwordRules: FormRules<typeof passwordForm> = {
  old_password: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  new_password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, max: 16, message: '密码长度 8~16 位', trigger: 'blur' },
  ],
  // "确认新密码"只做前台校验，真正发给后端的只有原密码 + 新密码
  confirm_password: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== passwordForm.new_password) {
          callback(new Error('两次输入的新密码不一致'))
          return
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
}

/** 提交修改密码：成功后把表单清空，方便下次再改 */
async function handleSavePassword() {
  const ok = await passwordFormRef.value?.validate().catch(() => false)
  if (!ok) return

  savingPassword.value = true
  try {
    await updatePassword({
      old_password: passwordForm.old_password,
      new_password: passwordForm.new_password,
    })
    ElMessage.success('密码修改成功')
    passwordFormRef.value?.resetFields()
  } catch {
    // 失败提示已由 http.ts 统一弹出
  } finally {
    savingPassword.value = false
  }
}
</script>

<template>
  <div class="account-page">
    <el-card class="account-card" v-loading="loading">
      <template v-if="profile">
        <h2 class="account-title">个人账号</h2>

        <!-- 当前信息展示：只读，想改就用下面的表单 -->
        <el-descriptions :column="1" border>
          <el-descriptions-item label="用户名">{{ profile.username }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ profile.phone_num }}</el-descriptions-item>
          <el-descriptions-item label="身份">
            <el-tag :type="roleTagType" effect="plain">{{ profile.role }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <!-- ===== 第一组：修改个人信息 ===== -->
        <el-divider content-position="left">修改个人信息</el-divider>
        <el-form
          ref="profileFormRef"
          :model="profileForm"
          :rules="profileRules"
          label-position="top"
          @submit.prevent
        >
          <el-form-item label="用户名" prop="username">
            <el-input v-model="profileForm.username" placeholder="3~15 位" maxlength="15" />
          </el-form-item>
          <el-form-item label="手机号" prop="phone_num">
            <el-input v-model="profileForm.phone_num" placeholder="请输入手机号" />
          </el-form-item>
          <el-button
            type="primary"
            class="submit-btn"
            :loading="savingProfile"
            @click="handleSaveProfile"
          >
            保存修改
          </el-button>
        </el-form>

        <!-- ===== 第二组：修改密码 ===== -->
        <el-divider content-position="left">修改密码</el-divider>
        <el-form
          ref="passwordFormRef"
          :model="passwordForm"
          :rules="passwordRules"
          label-position="top"
          @submit.prevent
        >
          <el-form-item label="原密码" prop="old_password">
            <el-input
              v-model="passwordForm.old_password"
              type="password"
              show-password
              placeholder="请输入原密码"
            />
          </el-form-item>
          <el-form-item label="新密码" prop="new_password">
            <el-input
              v-model="passwordForm.new_password"
              type="password"
              show-password
              placeholder="8~16 位"
            />
          </el-form-item>
          <el-form-item label="确认新密码" prop="confirm_password">
            <el-input
              v-model="passwordForm.confirm_password"
              type="password"
              show-password
              placeholder="请再次输入新密码"
              @keyup.enter="handleSavePassword"
            />
          </el-form-item>
          <el-button
            type="warning"
            class="submit-btn"
            :loading="savingPassword"
            @click="handleSavePassword"
          >
            修改密码
          </el-button>
        </el-form>
      </template>

      <!-- 加载失败时的兜底：给个重试按钮（错误原因 http.ts 已经弹过） -->
      <el-empty v-else description="信息加载失败">
        <el-button type="primary" @click="loadProfile">重新加载</el-button>
      </el-empty>
    </el-card>
  </div>
</template>

<style scoped>
.account-page {
  display: flex;
  justify-content: center;
}

.account-card {
  width: 560px;
  max-width: 100%;
  text-align: left; /* 覆盖 App.vue 的居中，让表单文字正常左对齐 */
}

.account-title {
  margin: 4px 0 20px;
  text-align: center;
  color: #303133;
}

.submit-btn {
  width: 100%;
  margin-top: 4px;
}
</style>
