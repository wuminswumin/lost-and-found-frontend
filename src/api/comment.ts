import { request } from '@/api/http'

// ===== 评论接口封装 =====
// 对应后端 GET/POST /api/posts/:post_id/comments 与 DELETE /api/posts/:post_id/comments/:comment_id
// 查看评论无需登录；发布/删除需登录（只能删自己的）

/** 一条帖子评论（注意：后端暂未返回评论人的用户名，只有 user_id） */
export interface PostComment {
  comment_id: number
  post_id: number
  user_id: number
  content: string
  created_at: string
}

// 查看帖子的评论（公开，分页每页固定 30 条，由后端控制）
export function getComments(post_id: number, page?: number) {
  return request<{
    list: PostComment[]
    total: number
    page: number
    page_size: number
  }>({
    method: 'GET',
    url: `/api/posts/${post_id}/comments`,
    params: { page },
  })
}

// 发布评论（需登录；帖子须"已通过"才能评论，被禁言的用户会被后端拒绝）
export function createComment(post_id: number, content: string) {
  return request<PostComment>({
    method: 'POST',
    url: `/api/posts/${post_id}/comments`,
    data: { content },
  })
}

// 删除自己的评论
export function deleteComment(post_id: number, comment_id: number) {
  return request<null>({
    method: 'DELETE',
    url: `/api/posts/${post_id}/comments/${comment_id}`,
  })
}
