import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth.js'
import { isHost } from '@/domain/pocket.js'

// 경로도 실증 도메인으로 맞춘다. 백엔드 API 경로(/api/courses …)와는 무관한
// 프론트 라우팅 경로이므로 자유롭게 바꿔도 된다.
const routes = [
  {
    path: '/',
    name: 'Landing',
    component: () => import('@/views/LandingView.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/LoginView.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/callback',
    name: 'Callback',
    component: () => import('@/views/CallbackView.vue')
  },
  {
    path: '/testbeds',
    name: 'TestbedList',
    component: () => import('@/views/CourseListView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/testbeds/new',
    name: 'TestbedCreate',
    component: () => import('@/views/CourseCreateView.vue'),
    meta: { requiresAuth: true, hostOnly: true }
  },
  {
    path: '/testbeds/:id(\\d+)',
    name: 'TestbedDetail',
    component: () => import('@/views/CourseDetailView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/applications',
    name: 'ApplicationList',
    component: () => import('@/views/EnrollmentView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/payments',
    name: 'PaymentList',
    component: () => import('@/views/PaymentView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/mypage',
    name: 'MyPage',
    component: () => import('@/views/MyPageView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

// 인증/권한 가드
router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'Login' }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'TestbedList' }
  }

  // 슬롯 등록은 호스트만
  if (to.meta.hostOnly && !isHost(auth.user?.role)) {
    return { name: 'TestbedList' }
  }
})

export default router
