<template>
  <header class="app-header">
    <div class="header-inner">
      <!-- 로고 -->
      <router-link to="/" class="logo">
        <img src="@/assets/images/logo/pocket-symbol-color.svg" alt="PoCket" class="logo-img" />
        <span class="logo-text">PoCket</span>
      </router-link>

      <!-- 네비게이션 -->
      <nav class="nav-links" v-if="auth.isAuthenticated">
        <router-link to="/testbeds" class="nav-link" :class="{ active: $route.path.startsWith('/testbeds') }">테스트베드</router-link>
        <router-link v-if="!host" to="/applications" class="nav-link" :class="{ active: $route.path === '/applications' }">
          내 실증
          <!-- 평가는 저절로 쌓이지 않는다. 남길 차례가 있으면 여기서 먼저 말한다. -->
          <span v-if="pendingReviewCount" class="nav-badge">
            {{ pendingReviewCount }}
            <span class="sr-only">건의 평가를 남길 차례입니다</span>
          </span>
        </router-link>
      </nav>

      <!-- 우측 액션 -->
      <div class="header-actions">
        <template v-if="auth.isAuthenticated">
          <router-link to="/mypage" class="user-avatar" :title="auth.user?.name">
            {{ auth.user?.name?.charAt(0) || '?' }}
          </router-link>
          <button class="btn btn-ghost btn-sm" @click="handleLogout">로그아웃</button>
        </template>
        <template v-else>
          <router-link to="/login" class="btn btn-ghost btn-sm">로그인</router-link>
          <router-link to="/register" class="btn btn-primary btn-sm">회원가입</router-link>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useAuthStore } from '@/store/auth.js'
import { useRouter } from 'vue-router'
import { isHost } from '@/domain/pocket.js'
import { clearPendingReviews, pendingReviewCount, primePendingReviews } from '@/domain/pendingReviews.js'

const auth = useAuthStore()
const router = useRouter()

const host = computed(() => isHost(auth.user?.role))

/*
 * 헤더는 로그인한 모든 화면에 있으므로 여기서 한 번 받아 둔다.
 * 사이드바도 같은 값을 쓰지만 요청은 하나만 나간다.
 *
 * 호스트에게는 부르지 않는다 — /me/pending 은 스타트업 신청 건만 훑어
 * 호스트에게는 언제나 빈 배열이다. 뜻 없는 요청을 보내지 않는다.
 */
watch(
  () => [auth.isAuthenticated, host.value],
  ([signedIn, isHostUser]) => {
    if (signedIn && !isHostUser) primePendingReviews()
    else clearPendingReviews()
  },
  { immediate: true }
)

function handleLogout() {
  clearPendingReviews()
  auth.logout()
}
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  /* 스크롤되는 콘텐츠가 뒤로 비쳐 흐른다 */
  background: var(--glass-bg-thin);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  /* 아래 경계는 선이 아니라 빛 — 위쪽 하이라이트 + 아주 옅은 분리선 */
  box-shadow:
    inset 0 1px 0 var(--glass-highlight),
    0 1px 0 var(--glass-edge),
    0 8px 24px rgba(36,34,73,0.05);
}
@media (prefers-reduced-transparency: reduce) {
  .app-header {
    background: var(--color-bg-primary);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}
.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 68px;
  display: flex;
  align-items: center;
  gap: 32px;
}
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.logo-img {
  width: 36px;
  height: 36px;
  object-fit: contain;
}
.logo-text {
  font-family: var(--font-display);
  font-size: 19px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.045em;
}
.nav-links {
  display: flex;
  gap: 4px;
  flex: 1;
}
.nav-link {
  padding: 8px 16px;
  border-radius: var(--radius-pill);
  font-size: 14.5px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--color-text-secondary);
  transition: var(--transition);
}
.nav-link:hover,
.nav-link.active {
  color: var(--color-link);
  background: var(--color-primary-light);
}
/* 배지가 붙으면 글자와 함께 흐르도록 */
.nav-link { display: inline-flex; align-items: center; gap: 7px; }

.nav-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 19px;
  height: 19px;
  padding: 0 6px;
  border-radius: var(--radius-pill);
  background: var(--color-primary);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
.btn-sm {
  padding: 9px 18px;
  font-size: 13.5px;
  border-radius: var(--radius-pill);
}
.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-link);
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition);
}
.user-avatar:hover {
  background: var(--color-primary);
  color: #fff;
}
</style>
