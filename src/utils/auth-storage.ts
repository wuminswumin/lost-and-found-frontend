import type { LoginData } from '@/types'
const TOKEN_KEY = 'lost_found_token'
const USER_KEY = 'lost_found_user'


export function saveLoginData(data: LoginData): void {
  localStorage.setItem(TOKEN_KEY, data.token)
  localStorage.setItem(USER_KEY, data.username)
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
