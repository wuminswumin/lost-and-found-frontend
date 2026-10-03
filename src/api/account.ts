import { request } from '@/api/http'
import type { UpdatePasswordPayload, UpdateProfilePayload, User } from '@/types'


// 获取当前登录用户的个人信息（Apifox: GET /api/user/profile）
export function getUserProfile() {
  return request<User>({ method: 'GET', url: '/api/user/profile' })
}

// 修改个人信息（用户名、手机号），成功时返回更新后的用户信息
export function updateProfile(payload: UpdateProfilePayload) {
  return request<User>({ method: 'PATCH', url: '/api/user/profile', data: payload })
}

// 修改密码，成功后 data 为 null（页面只需要提示"修改成功"）
export function updatePassword(payload: UpdatePasswordPayload) {
  return request<null>({ method: 'PATCH', url: '/api/user/password', data: payload })
}
