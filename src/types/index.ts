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
  phone_num: string
  role: Role
}

export interface ApiEnvelope<T = unknown> {
  code: number 
  message: string 
  data: T
}
