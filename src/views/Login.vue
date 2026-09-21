<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const username = ref('')
const password = ref('')

const handleLogin = () => {
  if (!username.value || !password.value) {
     ElMessage.error('用户名和密码不能为空')
    return
  }

  console.log('用户名：', username.value)
  console.log('密码：', password.value)
}
</script>

<template>
  <div class="login-page">
    <h2>用户登录</h2>

    <el-input
      v-model="username"
      placeholder="请输入用户名"
    />

    <el-input
      v-model="password"
      type="password"
      placeholder="请输入密码"
    />

    <el-button
      type="primary"
      @click="handleLogin"
    >
      登录
    </el-button>
  </div>
</template>

<style scoped>
.login-page {
  width: 400px;
  margin: 0 auto;
}

.el-input {
  margin-top: 20px;
}

.el-button {
  margin-top: 20px;
  width: 100%;
}
</style>