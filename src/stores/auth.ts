import { defineStore } from 'pinia'
import type { LoginData } from '@/types'
import { clearAuth, loadLogin, saveLoginData, saveUsername } from '@/utils/auth-storage'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: loadLogin()?.token ?? '',
    username: loadLogin()?.user ?? '',
    userId: null as number | null,
    role: loadLogin()?.role ?? '',
    expiredAt: '',
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
  },

  actions: {
    setLogin(data: LoginData) {
      this.token = data.token
      this.userId = data.user_id
      this.username = data.username
      this.role = data.role
      this.expiredAt = data.expired_at

      saveLoginData(data)
    },

    // 修改用户名后调用：内存里的名字变了，首页问候语会跟着变；
    // 同时写进 localStorage，刷新页面也不会变回旧名字
    setUsername(username: string) {
      this.username = username
      saveUsername(username)
    },

    logout() {
      this.token = ''
      this.userId = null
      this.username = ''
      this.role = ''
      this.expiredAt = ''

      clearAuth()
    },
  },
})