import { request } from '@/api/http'

// ===== 认领接口封装（发帖人视角：查看/审批收到的认领申请）=====
// 对应后端 /api/posts/:post_id/claims 与 /api/claims/:claim_id/audit，仅帖子作者本人可调用（后端把关）

/** 帖子收到的一条认领申请（含认领人的用户名和手机号） */
export interface PostClaim {
  claim_id: number
  claimer_id: number
  claimer_name: string
  claimer_contact: string
  reason: string
  status: '待处理' | '已同意' | '已拒绝'
  created_at: string
}

// 查看自己帖子收到的认领申请（分页每页固定 15 条，由后端控制）
export function getPostClaims(post_id: number, page?: number) {
  return request<{
    list: PostClaim[]
    total: number
    page: number
    page_size: number
  }>({
    method: 'GET',
    url: `/api/posts/${post_id}/claims`,
    params: { page },
  })
}

/**
 * 审批认领申请：approve=true 同意 / false 拒绝
 * 注意：同意后后端会自动把帖子标记为"已解决"，并把其余待处理申请全部拒绝
 */
export function auditClaim(claim_id: number, approve: boolean) {
  return request<null>({
    method: 'PUT',
    url: `/api/claims/${claim_id}/audit`,
    data: { approve },
  })
}
