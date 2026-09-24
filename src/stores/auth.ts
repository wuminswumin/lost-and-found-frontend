import { defineStore } from 'pinia'
import type { LoginData } from '@/types'
import { clearAuth, loadLogin, saveLoginData } from '@/utils/auth-storage'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: loadLogin()?.token ?? '',
    username: loadLogin()?.user ?? '',
    userId: null as number | null,
    phoneNum: '',
    role: '',
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
      this.phoneNum = data.phone_num
      this.role = data.role
      this.expiredAt = data.expired_at

      saveLoginData(data)
    },

    logout() {
      this.token = ''
      this.userId = null
      this.username = ''
      this.phoneNum = ''
      this.role = ''
      this.expiredAt = ''

      clearAuth()
    },
  },
})