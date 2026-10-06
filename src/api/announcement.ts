import { request } from '@/api/http'

// ===== 公告接口封装 =====
// 对应后端 GET /api/announcements（无需登录，但本站所有页面都要求先登录才能进）

/** 一条公告 */
export interface Announcement {
  announcement_id: number
  title: string
  content: string
  created_at: string
}

// 获取公告列表（分页每页固定 15 条，由后端控制）
export function getAnnouncements(page?: number) {
  return request<{
    list: Announcement[]
    total: number
    page: number
    page_size: number
  }>({
    method: 'GET',
    url: '/api/announcements',
    params: { page },
  })
}
