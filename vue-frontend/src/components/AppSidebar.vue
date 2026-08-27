<template>
  <aside class="sidebar">
    <div class="sidebar-section">
      <div class="sidebar-label">메뉴</div>
      <router-link
        v-for="item in menu"
        :key="item.to"
        :to="item.to"
        class="sidebar-item"
        :class="{ active: isActive(item) }"
      >
        <Icon :name="item.icon" :size="19" class="si-icon" />
        {{ item.label }}
      </router-link>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-label">계정</div>
      <router-link
        to="/mypage"
        class="sidebar-item"
        :class="{ active: route.path === '/mypage' }"
      >
        <Icon name="user" :size="19" class="si-icon" />
        마이페이지
      </router-link>
      <button class="sidebar-item sidebar-btn" @click="auth.logout()">
        <Icon name="logout" :size="19" class="si-icon" />
        로그아웃
      </button>
    </div>
  </aside>
</template>

<script setup>
/**
 * 좌측 내비게이션
 *
 * 화면 4곳(탐색·등록·내 실증·마이페이지)에 같은 마크업이 복붙돼 있었고, 서로 어긋나 있었다.
 * 어떤 화면은 "마이페이지"가 두 번 나오고, 활성 표시 방식도 제각각이었다.
 * 메뉴는 여기서만 정의한다.
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Icon from '@/components/Icon.vue'
import { useAuthStore } from '@/store/auth.js'
import { isHost } from '@/domain/pocket.js'

const auth = useAuthStore()
const route = useRoute()

const host = computed(() => isHost(auth.user?.role))

const menu = computed(() => [
  { to: '/testbeds', icon: 'compass', label: '테스트베드 탐색', exact: true },
  ...(host.value
    ? [{ to: '/testbeds/new', icon: 'plus', label: '실증 슬롯 등록' }]
    : [
        { to: '/applications', icon: 'check', label: '내 실증 신청' },
        // 결제는 신청한 쪽(스타트업)에만 남는다
        { to: '/payments', icon: 'document', label: '결제 내역' }
      ])
  // 마이페이지는 '계정' 섹션에 둔다 — 서비스 메뉴가 아니라 내 계정에 속한 화면이다.
])

// '/testbeds' 는 '/testbeds/new' 에서 활성으로 보이면 안 되므로 정확히 비교한다.
function isActive(item) {
  return item.exact ? route.path === item.to : route.path.startsWith(item.to)
}
</script>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 8px;
}

.sidebar-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  padding: 8px 12px 4px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  font-size: 14.5px;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: var(--color-text-secondary);
  transition: var(--transition);
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  font-family: var(--font-sans);
  text-decoration: none;
}

.sidebar-item:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.sidebar-item.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: 700;
}

.si-icon {
  width: 19px;
  height: 19px;
  opacity: 0.85;
}

.sidebar-btn {
  color: var(--color-text-secondary);
}
</style>
