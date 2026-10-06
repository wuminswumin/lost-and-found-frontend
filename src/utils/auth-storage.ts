import type { LoginData ,Role} from '@/types'
const TOKEN_KEY = 'lost_found_token'
const USER_KEY = 'lost_found_user'
const ROLE_KEY = 'lost_found_role'


export function saveLoginData(data: LoginData): void {
  localStorage.setItem(TOKEN_KEY, data.token)
  localStorage.setItem(USER_KEY, data.username)
  localStorage.setItem(ROLE_KEY, data.role)
}


// 用户改完用户名后单独更新 localStorage 里的名字（token 不动）
export function saveUsername(username: string): void {
  localStorage.setItem(USER_KEY, username)
}


export function loadLogin(): { token: string; user: string; role:Role } | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const user =localStorage.getItem(USER_KEY) 
    const role =localStorage.getItem(ROLE_KEY) 
    if (!token || !user || !role) return null
    return { token, user, role: role as Role }
  } catch {
    return null
  }
}




export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(ROLE_KEY)
}
