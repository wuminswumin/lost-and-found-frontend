import { createRouter, createWebHashHistory } from 'vue-router'
import { loadLogin } from '@/utils/auth-storage'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { title: '登录' },
    },
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { title: '首页' },
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