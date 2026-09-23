import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import type { ApiEnvelope } from '@/types'
import { clearAuth, loadLogin } from '@/utils/auth-storage'


const http = axios.create({
  timeout: 10000, // 10 秒没回复就算失败
})

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await http.request<ApiEnvelope<T>>(config)
  const { code, message, data } = response.data
  if (code !== 0) {
    throw new Error(message || '请求失败')
  }
  return data
}