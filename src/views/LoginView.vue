<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Lock, Postcard, User } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

import { login as apiLogin, register as apiRegister } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import type { Role } from '@/types'

const router = useRouter()
const auth = useAuthStore()

// ===== 登录表单 =====
const loginFormRef = ref<FormInstance>()
const loginForm = reactive({ username: '', password: '' })

// 校验规则：required = 必填。这些只是"前台礼貌提醒"，
// 真正的硬性校验在后端（比如密码 8~16 位），后端说了算
const loginRules: FormRules<typeof loginForm> = {
  username: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

// ===== 注册表单 =====
const registerFormRef = ref<FormInstance>()
const registerForm = reactive({
  username: '',
  phone_num: '',
  password: '',
  role: '普通用户' as Role,
  invite_code: null as string | null,
})
const registerRules: FormRules<typeof registerForm> = {
  username: [
    { required: true, message: '请输入学号', trigger: 'blur' },
    { pattern: /^\d{1,32}$/, message: '学号必须是 1~32 位纯数字', trigger: 'blur' },
  ],
  phone_num: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, max: 16, message: '密码长度 8~16 位', trigger: 'blur' },
  ],
  role: [{ required: true, message: '请选择身份', trigger: 'change' }],
}

const activeTab = ref<'login' | 'register'>('login')
const loggingIn = ref(false) // 提交中：给按钮转圈圈用
const registering = ref(false)

/** 登录：校验通过 → 调接口 → 存仓库 → 进首页 */
async function handleLogin() {
  // validate() 校验失败会 reject；转成 false 表示"没通过，别往下走了"
  const ok = await loginFormRef.value?.validate().catch(() => false)
  if (!ok) return

  loggingIn.value = true
  try {
    const data = await apiLogin({
      phone_num: loginForm.username,
      password: loginForm.password,
    })
    auth.setLogin(data)
    ElMessage.success(`欢迎回来，${data.username}！`)
    router.push('/')
  } catch {
    // 失败提示已由 http.ts 统一弹出，这里不用重复写
  } finally {
    loggingIn.value = false
  }
}

/** 注册：成功后自动把学号填进登录框，并切到登录页签（体贴一步） */
async function handleRegister() {
  const ok = await registerFormRef.value?.validate().catch(() => false)
  if (!ok) return

  registering.value = true
  try {
    await apiRegister({ ...registerForm })
    ElMessage.success('注册成功，请登录')
    loginForm.username = registerForm.username
    registerForm.password = ''
    activeTab.value = 'login'
  } catch {
    // 失败提示已由 http.ts 统一弹出
  } finally {
    registering.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <el-card class="login-card">
      <h1 class="login-title">📚 失物招领</h1>
      <p class="login-subtitle">注册登录部分</p>

      <el-tabs v-model="activeTab" stretch>
        <!-- ===== 登录页签 ===== -->
        <el-tab-pane label="登录" name="login">
          <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" label-position="top" @submit.prevent>
            <el-form-item label="学号" prop="username">
              <el-input v-model="loginForm.username" placeholder="请输入学号" :prefix-icon="User" maxlength="32" />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                show-password
                placeholder="请输入密码"
                :prefix-icon="Lock"
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            <el-button type="primary" class="submit-btn" :loading="loggingIn" @click="handleLogin">
              登 录
            </el-button>
          </el-form>
        </el-tab-pane>

        <!-- ===== 注册页签 ===== -->
        <el-tab-pane label="注册" name="register">
          <el-form ref="registerFormRef" :model="registerForm" :rules="registerRules" label-position="top" @submit.prevent>
            <el-alert
              class="register-tip"
              type="info"
              :closable="false"
              show-icon
              title="管理员注册仅限预留学号（20240001 ~ 20240003），其他学号请选「学生」"
            />
            <el-form-item label="学号" prop="username">
              <el-input v-model="registerForm.username" placeholder="1~32 位纯数字" :prefix-icon="User" maxlength="32" />
            </el-form-item>
            <el-form-item label="姓名" prop="name">
              <el-input
                v-model="registerForm.phone_num"
                placeholder="请输入手机号"
              />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="registerForm.password"
                type="password"
                show-password
                placeholder="8~16 位"
                :prefix-icon="Lock"
              />
            </el-form-item>
            <el-form-item label="身份" prop="role">
              <el-radio-group v-model="registerForm.role">
                <el-radio value="student">学生</el-radio>
                <el-radio value="admin">管理员</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-button type="primary" class="submit-btn" :loading="registering" @click="handleRegister">
              注 册
            </el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eef2f7 0%, #e8eef5 100%);
}
.login-card {
  width: 420px;
  max-width: calc(100vw - 32px);
}
.login-title {
  margin: 8px 0 4px;
  text-align: center;
  color: #303133;
}
.login-subtitle {
  margin: 0 0 16px;
  text-align: center;
  color: #909399;
  font-size: 13px;
}
.register-tip {
  margin-bottom: 12px;
}
.submit-btn {
  width: 100%;
  margin-top: 4px;
}
</style>
