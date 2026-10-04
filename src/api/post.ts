import { request } from '@/api/http'
import type { Post } from '@/types'

export interface PostListParams {
  page?: number
  post_type?: '寻物' | '招领'
  is_resolve?: '已解决' | '未解决'
}

// 查询所有公开帖子
export function getAllPosts(params?: PostListParams) {
  return request<{
    list: Post[]
    total: number
    page: number
  }>({
    method: 'GET',
    url: '/api/all-posts',
    params,
  })
}

// 查询自己的帖子
export function getMyPosts(params?: PostListParams) {
  return request<{
    list: Post[]
    total: number
    page: number
  }>({
    method: 'GET',
    url: '/api/my-posts',
    params,
  })
}

// 发布失物 / 招领帖子
export interface CreatePostPayload {
  post_type: '寻物' | '招领'
  title: string
  event_location: string
  event_time: string
  contact: string
  description: string
  image_url: string
}

export function createPost(payload: CreatePostPayload) {
  return request<Post>({
    method: 'POST',
    url: '/api/post',
    data: payload,
  })
}

// 删除自己的帖子
export function deleteMyPost(post_id: number) {
  return request<null>({
    method: 'DELETE',
    url: '/api/delete-my-post',
    data: { post_id },
  })
}

// 获取帖子详情
export function getPostDetails(post_id: number) {
  return request<Post>({
    method: 'GET',
    url: '/api/post-details',
    data: JSON.stringify({ post_id }),
  })
}