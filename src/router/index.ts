import { createRouter, createWebHashHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import { loadLogin } from '@/utils/auth-storage'
import type { Role } from '@/types'

// 扩展路由 meta 类型：给管理员页面加 roles 字段用
declare module 'vue-router' {
  interface RouteMeta {
    roles?: Role[]
  }
}

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { title: '登录注册' },
    },
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { title: '首页' },
    },
    {
      path: '/account',
      name: 'account',
      component: () => import('@/views/AccountView.vue'),
      meta: { title: '个人账户信息管理' },
    },
    {
      path: '/posts',
      name: 'posts',
      component: () => import('@/views/PostsView.vue'),
      meta: { title: '查看帖子' },
    },
    {
      path: '/post/publish',
      name: 'post-publish',
      component: () => import('@/views/PostPublishView.vue'),
      meta: { title: '发布帖子' },
    },
    {
      path: '/announcements',
      name: 'announcements',
      component: () => import('@/views/AnnouncementView.vue'),
      meta: { title: '公告' },
    },
    {
      path: '/my/claims',
      name: 'my-claims',
      component: () => import('@/views/MyClaimsView.vue'),
      meta: { title: '我的认领申请' },
    },
    { 
      path: '/post',
      name: 'post',
      component: () => import('@/views/PostView.vue'),
      meta: { title: '帖子' },
    },    
    {
      path: '/admin/post',
      name: 'admin-post',
      component: () => import('@/views/PostAdminView.vue'),
      meta: { title: '失物招领管理员界面', roles: ['失物招领管理员'] },
    },
    {
      path: '/admin/sys',
      name: 'admin-sys',
      component: () => import('@/views/SysAdminView.vue'),
      meta: { title: '系统管理员界面', roles: ['系统管理员'] },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach((to) => {
  const login = loadLogin()
  const isLoggedIn = !!login?.token

  if (!isLoggedIn && to.name !== 'login') {
    return { name: 'login' }
  }

  if (isLoggedIn && to.name === 'login') {
    return { name: 'home' }
  }

  // 管理员页面拦截：角色不在允许名单里，提示并送回首页
  if (to.meta.roles && login && !to.meta.roles.includes(login.role)) {
    ElMessage.warning('你没有权限访问该页面')
    return { name: 'home' }
  }
})

router.afterEach((to) => {
  document.title =
    typeof to.meta.title === 'string'
      ? `${to.meta.title} - 失物招领系统`
      : '?'
})

export default router