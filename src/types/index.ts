export type Role = '系统管理员' | '失物招领管理员' | '普通用户'

export interface User {
  user_id: number
  phone_num:string
  username: string
  role: Role

}

export interface LoginData {
  token: string
  expired_at: string
  user_id: number
  username: string
  role: Role
}

// 修改个人信息时提交的数据（Apifox: PATCH /api/user/profile）
export interface UpdateProfilePayload {
  username: string
  phone_num: string
}

// 修改密码时提交的数据（Apifox: PATCH /api/user/password）
export interface UpdatePasswordPayload {
  old_password: string
  new_password: string
}

export interface ApiEnvelope<T = unknown> {
  code: number 
  message: string 
  data: T
}
