import { createRouter, createWebHashHistory } from 'vue-router'
import { loadLogin } from '@/utils/auth-storage'

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
      path: '/post',
      name: 'post',
      component: () => import('@/views/PostView.vue'),
      meta: { title: '帖子' },
    },    
    { 
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/AdminView.vue'),
      meta: { title: '管理员界面' },
    },    
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach((to) => {
  const isLoggedIn = !!loadLogin()?.token

  if (!isLoggedIn && to.name !== 'login') {
    return { name: 'login' }
  }

  if (isLoggedIn && to.name === 'login') {
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