import { request } from '@/api/http'

// ===== 联系人接口封装（我的联系人）=====
// 对应后端 POST /api/contact、GET /api/my/contacts、DELETE /api/my/contacts/:contact_id，均需登录

/** 一条联系人记录 */
export interface Contact {
  owner_id: number
  contact_id: number
  student_id: string
  name: string
  sex: string
  phone_num: string
  major: string
  note: string
}

/** 新增联系人的表单数据（学号/姓名/性别/手机号必填，专业/备注选填） */
export interface ContactForm {
  student_id: string
  name: string
  sex: string
  phone_num: string
  major?: string
  note?: string
}

// 新增联系人
export function addContact(data: ContactForm) {
  return request<Contact>({
    method: 'POST',
    url: '/api/contact',
    data,
  })
}

// 我的联系人列表（分页每页固定 15 条，由后端控制）
export function getContacts(page?: number) {
  return request<{
    list: Contact[]
    total: number
    page: number
    page_size: number
  }>({
    method: 'GET',
    url: '/api/my/contacts',
    params: { page },
  })
}

// 删除自己的联系人
export function deleteContact(contact_id: number) {
  return request<null>({
    method: 'DELETE',
    url: `/api/my/contacts/${contact_id}`,
  })
}
