import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import type { ApiEnvelope } from '@/types'
import { clearAuth, loadLogin } from '@/utils/auth-storage'


const http = axios.create({
  timeout: 10000, // 10 秒没回复就算失败
})


// 请求拦截器：已登录就自动带上 token（后端要求 Authorization: Bearer <token>）
http.interceptors.request.use((config) => {
  const login = loadLogin()
  if (login?.token) {
    config.headers.set('Authorization', `Bearer ${login.token}`)
  }
  return config
})


// 响应拦截器：后端报错（4xx/5xx）时，把它的中文 message 弹出来
http.interceptors.response.use(
  (resp) => resp,
  (error: AxiosError<ApiEnvelope>) => {
    // token 失效就清掉本地登录状态，下次跳转时路由守卫会把用户送回登录页
    if (error.response?.status === 401) {
      clearAuth()
    }
    ElMessage.error(error.response?.data?.message ?? '网络请求失败，请稍后再试')
    return Promise.reject(error)
  },
)


export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await http.request<ApiEnvelope<T>>(config)
  const { code, message, data } = response.data
  if (code !== 0) {
    throw new Error(message || '请求失败')
  }
  return data
}
