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
    path: '/match',
    name: 'Match',
    component: () => import('@/views/MatchView.vue'),
    // 호스트는 현장을 제공하는 쪽이라 찾을 일이 없다
    meta: { requiresAuth: true, startupOnly: true }
  },
  {
    path: '/applications',
    name: 'ApplicationList',
    component: () => import('@/views/EnrollmentView.vue'),
    meta: { requiresAuth: true, startupOnly: true }
  },
  {
    path: '/payments',
    name: 'PaymentList',
    component: () => import('@/views/PaymentView.vue'),
    meta: { requiresAuth: true, startupOnly: true }
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
    // 로그인한 뒤 원래 가려던 곳으로 돌려보낸다.
    // 이게 없으면 동료가 보낸 슬롯 링크를 열었다가 로그인하면
    // 95건짜리 목록에 떨어져서 그 슬롯을 처음부터 다시 찾아야 한다.
    return { name: 'Login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'TestbedList' }
  }

  // 슬롯 등록은 호스트만
  if (to.meta.hostOnly && !isHost(auth.user?.role)) {
    return { name: 'TestbedList' }
  }

  // 신청·결제는 스타트업만. 호스트가 URL 로 직접 들어오면 마이페이지로.
  // 메뉴에서 숨기는 것만으로는 북마크·뒤로가기를 막지 못한다.
  if (to.meta.startupOnly && isHost(auth.user?.role)) {
    return { name: 'MyPage' }
  }
})

export default router
