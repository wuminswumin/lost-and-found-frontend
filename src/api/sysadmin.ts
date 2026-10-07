import { request } from '@/api/http'
import type { Role } from '@/types'

// ===== 系统管理员接口封装（系统管理页用）=====
// 对应后端 10-05 重构后的 /api/sys 系列接口

/** 用户列表里的一条用户 */
export interface SysUser {
  user_id: number
  username: string
  phone_num: string
  role: Role
}

export interface SysUserListParams {
  page?: number
  role?: Role
}

// 查询所有用户（分页每页固定 15 条，由后端控制；role 可选筛选）
export function getSysUsers(params?: SysUserListParams) {
  return request<{
    list: SysUser[]
    total: number
    page: number
    page_size: number
  }>({
    method: 'GET',
    url: '/api/sys/users',
    params,
  })
}

// 修改用户角色：不能改自己（后端会拒绝），前端也会把自己的行禁用
export function updateUserRole(user_id: number, role: Role) {
  return request<null>({
    method: 'PATCH',
    url: `/api/sys/users/${user_id}/role`,
    data: { role },
  })
}

/**
 * 禁言用户：mute_second 传 0 = 永久禁言，>0 = 限时禁言多少秒
 * 参数走 URL 路径（后端 1692c07 修复后确定），被禁言期间不能发帖/评论/提交认领申请
 */
export function muteUser(user_id: number, mute_second: number) {
  return request<null>({
    method: 'PATCH',
    url: `/api/sys/users/${user_id}/mute/${mute_second}`,
  })
}

// 解禁用户（参数走 URL 路径）
export function unmuteUser(user_id: number) {
  return request<null>({
    method: 'PATCH',
    url: `/api/sys/users/${user_id}/unmute`,
  })
}

export interface CreateAnnouncementPayload {
  title: string
  content: string
}

// 发布公告（title 最长 100 字，由后端把关）
export function createAnnouncement(payload: CreateAnnouncementPayload) {
  return request<{
    announcement_id: number
    title: string
    content: string
    created_at: string
  }>({
    method: 'POST',
    url: '/api/sys/announcements',
    data: payload,
  })
}

// 删除公告：不可恢复
export function deleteAnnouncement(announcement_id: number) {
  return request<null>({
    method: 'DELETE',
    url: `/api/sys/announcements/${announcement_id}`,
  })
}

// 系统统计数据（GET /api/sys/stats 的返回结构）
export interface SysStats {
  user_stats: {
    total_users: number
    normal_users: number
    admin_users: number
  }
  post_stats: {
    total_posts: number
    pending_posts: number
    approved_posts: number
    rejected_posts: number
    lost_posts: number
    found_posts: number
  }
  announcement_stats: {
    total_announcements: number
  }
}

export function getSysStats() {
  return request<SysStats>({
    method: 'GET',
    url: '/api/sys/stats',
  })
}
