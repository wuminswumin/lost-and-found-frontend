import { request } from '@/api/http'
import type { LoginData, Role, User } from '@/types'


export function register(payload: { username: string; phone_num: string; password: string; role: Role; invite_code:string|null }) {
  return request<User>({ method: 'POST', url: '/api/register', data: payload })
}


export function login(payload: { phone_num: string; password: string }) {
  return request<LoginData>({ method: 'POST', url: '/api/login', data: payload })
}