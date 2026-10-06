import { request } from '@/api/http'

// ===== 管理员接口封装（帖子审核页用）=====
// 对应后端 10-05 重构后的 /api/admin/posts 系列接口，与组员的 post.ts 分开存放，互不干扰

/** 管理员列表里的一条帖子：和普通 Post 的区别是没有 contact，description 被后端截断成 15 字 */
export interface AdminPost {
  post_id: number
  user_id: number
  post_type: '寻物' | '招领'
  title: string
  event_location: string
  event_time: string
  description: string
  image_url: string
  is_resolve: '已解决' | '未解决'
  status: '待审核' | '已通过' | '已驳回'
  created_at: string
  updated_at: string
}

export interface AdminPostListParams {
  page?: number
  post_type?: '寻物' | '招领'
  status?: '待审核' | '已通过' | '已驳回'
  is_resolve?: '已解决' | '未解决'
}

// 管理员查询所有帖子（含未过审的；分页每页固定 15 条，由后端控制）
export function getAdminPosts(params?: AdminPostListParams) {
  return request<{
    list: AdminPost[]
    total: number
    page: number
    page_size: number
  }>({
    method: 'GET',
    url: '/api/admin/posts',
    params,
  })
}

// 审核帖子：只有"待审核"的帖子能被审核（后端把关）
export function auditPost(post_id: number, status: '已通过' | '已驳回') {
  return request<null>({
    method: 'PATCH',
    url: `/api/admin/posts/${post_id}/audit`,
    data: { status },
  })
}

// 删除帖子：不可恢复
export function deleteAdminPost(post_id: number) {
  return request<null>({
    method: 'DELETE',
    url: `/api/admin/posts/${post_id}`,
  })
}

// 标记已解决 / 撤销解决：只有"已通过"的帖子能被改（后端把关）
export function resolveAdminPost(post_id: number, is_resolve: '已解决' | '未解决') {
  return request<null>({
    method: 'PATCH',
    url: `/api/admin/posts/${post_id}/resolve`,
    data: { is_resolve },
  })
}
