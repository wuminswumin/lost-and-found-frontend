import type { LoginData } from '@/types'
const TOKEN_KEY = 'lost_found_token'
const USER_KEY = 'lost_found_user'


export function saveLoginData(data: LoginData): void {
  localStorage.setItem(TOKEN_KEY, data.token)
  localStorage.setItem(USER_KEY, data.username)
}


// 用户改完用户名后单独更新 localStorage 里的名字（token 不动）
export function saveUsername(username: string): void {
  localStorage.setItem(USER_KEY, username)
}


export function loadLogin(): { token: string; user: string } | null {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return null
  try {
    const user =localStorage.getItem(USER_KEY) 
    return user ? { token, user } : null
  } catch {
    return null
  }
}




export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
