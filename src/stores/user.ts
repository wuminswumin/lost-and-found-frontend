import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    userId: null as number | null,
    username: '',
    phoneNum: '',
    role: '',
    isLoggedIn: false,
  }),
})