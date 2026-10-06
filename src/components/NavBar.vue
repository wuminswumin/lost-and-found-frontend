```vue id="d7g2km"
<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { loadLogin } from '@/utils/auth-storage'
import { confirmCurrentLeave } from '@/utils/leave-guard'

type NavItemType = 'public' | 'protected' | 'login'

interface NavItem {
  label: string
  path: string
  type: NavItemType
}

interface IndicatorPosition {
  left: number
  width: number
}

const router = useRouter()
const route = useRoute()

const isLoggedIn = ref(!!loadLogin()?.token)

const navBarRef = ref<HTMLElement | null>(null)
const navItemRefs = ref<HTMLElement[]>([])

const indicator = ref({
  left: 0,
  width: 0,
  visible: false,
  animate: false,
})

/**
 * 导航栏项目
 */
const navItems = computed<NavItem[]>(() => [
  {
    label: '首页',
    path: '/',
    type: 'public',
  },
  {
    label: '查看帖子',
    path: '/posts',
    type: 'public',
  },
  {
    label: '我的认领申请',
    path: '/my/claims',
    type: 'protected',
  },
  {
    label: isLoggedIn.value ? '管理个人账号' : '登录/注册',
    path: isLoggedIn.value ? '/account' : '/login',
    type: isLoggedIn.value ? 'protected' : 'login',
  },
])

/**
 * 当前页面对应的导航项。
 *
 * -1 表示当前页面不属于导航栏。
 */
const activeIndex = computed(() => {
  const index = navItems.value.findIndex(
    (item) => item.path === route.path,
  )

  return index
})

function setNavItemRef(
  element: Element | ComponentPublicInstance | null,
  index: number,
) {
  if (element instanceof HTMLElement) {
    navItemRefs.value[index] = element
  }
}

/**
 * 获取当前导航项对应的位置
 */
async function getIndicatorPosition(): Promise<IndicatorPosition | null> {
  await nextTick()

  const navBar = navBarRef.value
  const index = activeIndex.value

  if (!navBar || index === -1) {
    return null
  }

  const activeItem = navItemRefs.value[index]

  if (!activeItem) {
    return null
  }

  const navRect = navBar.getBoundingClientRect()
  const itemRect = activeItem.getBoundingClientRect()

  const extraWidth = 8

  return {
    left:
      itemRect.left -
      navRect.left -
      extraWidth / 2,
    width: itemRect.width + extraWidth,
  }
}

/**
 * 蓝条移动
 *
 * 使用场景：
 * 蓝条原本显示，并且当前页面切换到另一个导航页面。
 *
 * 此时允许 transform / width 动画。
 */
async function moveIndicator() {
  const position = await getIndicatorPosition()

  if (!position) {
    return
  }

  indicator.value = {
    left: position.left,
    width: position.width,
    visible: true,
    animate: true,
  }
}

/**
 * 蓝条重新出现
 *
 * 使用场景：
 * 蓝条原本隐藏，现在进入一个导航页面。
 *
 * 关键点：
 * 先关闭动画，把蓝条直接放到目标位置；
 * 然后再打开动画，只改变 opacity。
 */
async function showIndicator() {
  const position = await getIndicatorPosition()

  if (!position) {
    return
  }

  // 第一步：
  // 禁止 transform 动画，直接把蓝条放到目标位置。
  indicator.value = {
    left: position.left,
    width: position.width,
    visible: false,
    animate: false,
  }

  await nextTick()

  // 第二步：
  // 位置已经正确，只让透明度发生变化。
  indicator.value = {
    left: position.left,
    width: position.width,
    visible: true,
    animate: false,
  }
}

/**
 * 蓝条消失
 *
 * 不改变 left / width。
 * 所以蓝条会原地渐渐消失。
 */
function hideIndicator() {
  indicator.value.visible = false
}

/**
 * 路由发生变化时，按照蓝条之前的状态决定动画。
 */
async function updateIndicatorAfterRouteChange(
  wasVisible: boolean,
) {
  const hasTarget = activeIndex.value !== -1

  // --------------------------------
  // 1. 蓝条原本显示
  // --------------------------------
  if (wasVisible) {
    if (hasTarget) {
      // 显示 → 导航页面
      // 滑动过去
      await moveIndicator()
    } else {
      // 显示 → 非导航页面
      // 原地渐渐消失
      hideIndicator()
    }

    return
  }

  // --------------------------------
  // 2. 蓝条原本隐藏
  // --------------------------------

  if (!hasTarget) {
    // 隐藏 → 非导航页面
    // 什么都不做
    return
  }

  // 隐藏 → 导航页面
  // 直接放到目标下面，再渐渐显示
  await showIndicator()
}

/**
 * 点击导航栏
 */
async function handleNavClick(item: NavItem) {
  // 发布页面离开前，先检查是否有未保存内容
  if (route.path === '/post/publish') {
    const canLeave = await confirmCurrentLeave()

    if (!canLeave) {
      return
    }
  }

  if (item.type === 'public') {
    router.push(item.path)
    return
  }

  if (item.type === 'login') {
    router.push('/login')
    return
  }

  if (!loadLogin()?.token) {
    ElMessage.warning('请先登录')
    return
  }

  router.push(item.path)
}

function refreshLoginState() {
  isLoggedIn.value = !!loadLogin()?.token
}

async function handleAuthChanged() {
  const wasVisible = indicator.value.visible

  refreshLoginState()

  await nextTick()

  // 登录状态变化后，导航文字可能发生变化：
  // 登录/注册 ↔ 管理个人账号
  //
  // 这时候不要让蓝条横向飞过去，
  // 直接重新定位即可。
  if (activeIndex.value !== -1) {
    await showIndicator()
  } else if (wasVisible) {
    hideIndicator()
  }
}

/**
 * 路由变化监听
 */
watch(
  () => route.fullPath,
  async () => {
    const wasVisible = indicator.value.visible
    const oldLoginState = isLoggedIn.value

    refreshLoginState()

    // 登录状态发生变化
    if (oldLoginState !== isLoggedIn.value) {
      // 导航文字可能发生变化：
      // 管理个人账号 ↔ 登录/注册
      await nextTick()

      if (activeIndex.value !== -1) {
        await showIndicator()
      } else {
        hideIndicator()
      }

      return
    }

    await updateIndicatorAfterRouteChange(wasVisible)
  },
)

/**
 * 登录状态变化。
 *
 * 例如：
 * 登录/注册 → 管理个人账号
 *
 * 这时文字本身发生变化，需要重新计算位置。
 */
watch(
  () => isLoggedIn.value,
  async () => {
    if (!indicator.value.visible) {
      return
    }

    if (activeIndex.value === -1) {
      return
    }

    const position = await getIndicatorPosition()

    if (!position) {
      return
    }

    // 这里不需要播放滑动动画，
    // 直接调整到新的文字宽度和位置。
    indicator.value = {
      left: position.left,
      width: position.width,
      visible: true,
      animate: false,
    }
  },
)

/**
 * 浏览器窗口尺寸变化
 */
async function handleResize() {
  if (!indicator.value.visible) {
    return
  }

  const position = await getIndicatorPosition()

  if (!position) {
    return
  }

  indicator.value = {
    left: position.left,
    width: position.width,
    visible: true,
    animate: false,
  }
}

onMounted(async () => {
  refreshLoginState()

  if (activeIndex.value !== -1) {
    await showIndicator()
  }

  window.addEventListener('resize', handleResize)
  window.addEventListener('auth-changed', handleAuthChanged)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('auth-changed', handleAuthChanged)
})
</script>

<template>
  <nav
    ref="navBarRef"
    class="nav-bar"
  >
    <button
      v-for="(item, index) in navItems"
      :key="item.path"
      :ref="(element) => setNavItemRef(element, index)"
      class="nav-item"
      :class="{ active: index === activeIndex }"
      type="button"
      @click="handleNavClick(item)"
    >
      {{ item.label }}
    </button>

    <span
      class="nav-indicator"
      :class="{ 'is-animated': indicator.animate }"
      :style="{
        transform: `translateX(${indicator.left}px)`,
        width: `${indicator.width}px`,
        opacity: indicator.visible ? 1 : 0,
      }"
    />
  </nav>
</template>

<style scoped>
.nav-bar {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 24px;
}

.nav-item {
  position: relative;
  padding: 6px 0 10px;
  border: none;
  background: transparent;
  color: #606266;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  cursor: pointer;
  transition: color 0.25s ease;
}

.nav-item:hover {
  color: #409eff;
}

.nav-item.active {
  color: #303133;
}

.nav-indicator {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  border-radius: 999px;
  background: #409eff;
  pointer-events: none;

  /*
   * 默认不设置 transform / width 动画。
   *
   * 这样：
   * 蓝条隐藏 → 导航页面
   * 时可以直接定位，不会从旧位置飞过去。
   */
  transition: opacity 0.35s ease;
}

/*
 * 只有真正发生“导航项之间切换”时，
 * 才开启位置和宽度动画。
 */
.nav-indicator.is-animated {
  transition:
    transform 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    width 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.35s ease;
}
</style>
```
