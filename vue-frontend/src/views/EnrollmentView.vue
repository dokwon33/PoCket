<template>
  <div class="page-wrapper">
    <AppHeader />
    <div class="page-layout">
      <aside class="sidebar">
        <div class="sidebar-section">
          <div class="sidebar-label">메뉴</div>

          <router-link to="/testbeds" class="sidebar-item">
            <Icon name="compass" :size="19" class="si-icon" /> 테스트베드 탐색
          </router-link>

          <router-link
            to="/applications"
            class="sidebar-item active"
          >
            <Icon name="check" :size="19" class="si-icon" /> 내 실증 신청
          </router-link>

          <router-link to="/mypage" class="sidebar-item">
            <Icon name="star" :size="19" class="si-icon" /> 마이페이지
          </router-link>
        </div>

        <div class="sidebar-section">
          <div class="sidebar-label">계정</div>
          <router-link to="/mypage" class="sidebar-item">
            <Icon name="user" :size="19" class="si-icon" /> 마이페이지
          </router-link>
          <button class="sidebar-item sidebar-btn" @click="handleLogout">
            <Icon name="logout" :size="19" class="si-icon" /> 로그아웃
          </button>
        </div>
      </aside>

      <main class="main-content">
        <h1 class="page-title">내 실증 신청</h1>

        <div v-if="loading" class="loading-center">
          <div class="spinner"></div>
        </div>

        <SessionExpiredNotice v-else-if="authExpired" />

        <div v-else-if="enrollments.length" class="enrollment-list fade-in">
          <div v-for="item in enrollments" :key="item.id" class="enrollment-card">
            <div class="enroll-thumb" :style="{ background: category(item.course?.category).tint }">
              <Icon
                class="enroll-thumb-icon"
                :name="category(item.course?.category).icon"
                :size="30"
                :stroke-width="1.5"
                :style="{ color: category(item.course?.category).ink }"
              />
            </div>

            <div class="enroll-info">
              <span class="badge" :style="categoryStyle(item.course?.category)">
                {{ categoryLabel(item.course?.category) }}
              </span>
              <h3 class="enroll-title">{{ item.course?.title }}</h3>
              <p class="enroll-instructor">호스트: {{ resolveHost(item.course) }}</p>
            </div>

            <div class="enroll-status">
              <span :class="['status-badge', `status-${enrollmentStatus(item.status).tone}`]">
                {{ enrollmentStatus(item.status).label }}
              </span>
              <router-link :to="`/testbeds/${item.courseId}`" class="btn btn-ghost btn-sm">
                슬롯 보기
              </router-link>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <Icon name="inbox" :size="40" :stroke-width="1.4" class="empty-icon" />
          <p>아직 신청한 실증 슬롯이 없습니다.</p>
          <router-link to="/testbeds" class="btn btn-primary" style="margin-top:16px;">
            테스트베드 둘러보기
          </router-link>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import Icon from '@/components/Icon.vue'
import SessionExpiredNotice from '@/components/SessionExpiredNotice.vue'
import { authExpired } from '@/domain/session.js'
import { enrollmentApi } from '@/api/enrollment.js'
import { useAuthStore } from '@/store/auth.js'
import { category, categoryLabel, categoryStyle, enrollmentStatus, isHost } from '@/domain/pocket.js'
import { hostName as resolveHost, primeHosts } from '@/domain/hosts.js'

const router = useRouter()
const auth = useAuthStore()

const enrollments = ref([])
const loading = ref(true)

const host = computed(() => isHost(auth.user?.role))

function handleLogout() {
  auth.logout()
  router.push('/')
}

onMounted(async () => {
  // 호스트는 이 페이지 접근 불가 → 마이페이지로 이동
  if (host.value) {
    console.warn('[EnrollmentView] host tried to access /applications, redirect to /mypage')
    router.replace('/mypage')
    return
  }

  try {
    const res = await enrollmentApi.getMyEnrollments()
    console.log('[EnrollmentView] my enrollments response:', res.data)

    if (Array.isArray(res.data?.data)) {
      enrollments.value = res.data.data
    } else if (Array.isArray(res.data)) {
      enrollments.value = res.data
    } else {
      enrollments.value = []
    }
    primeHosts(enrollments.value.map((e) => e.course).filter(Boolean))
  } catch (error) {
    console.error('[EnrollmentView] failed to load enrollments:', error)
    enrollments.value = []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page-wrapper {
  min-height: 100vh;
  background: var(--color-bg-secondary);
}

.page-layout {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 28px;
}

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
  gap: 10px;
  padding: 9px 12px;
  border-radius: var(--radius-md);
  font-size: 14px;
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
  font-weight: 500;
}

.si-icon {
  width: 19px;
  height: 19px;
  opacity: 0.85;
}

.main-content {
  min-width: 0;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 24px;
}

.enrollment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.enrollment-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--glass-bg);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-edge);
  box-shadow: var(--shadow-glass);
  border-radius: var(--radius-xl);
  padding: 16px;
  transition: var(--transition);
}

.enrollment-card:hover {
  box-shadow: var(--shadow-sm);
}

.enroll-thumb {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.enroll-thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 8px;
}

.thumb-teal {
  background: #E1F5EE;
}

.thumb-blue {
  background: #E6F1FB;
}

.thumb-purple {
  background: #EEEDFE;
}

.thumb-pink {
  background: #FBEAF0;
}

.thumb-gray {
  background: #F1EFE8;
}

.enroll-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.enroll-info .badge { align-self: flex-start; }

.enroll-title {
  font-size: 15px;
  font-weight: 600;
}

.enroll-instructor {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.enroll-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-done {
  background: #E1F5EE;
  color: #0F6E56;
}

.status-wait {
  background: #FAEEDA;
  color: #854F0B;
}

.status-off {
  background: #F1EFE8;
  color: #5F5E5A;
}

.enroll-thumb-icon { opacity: 0.75; }

.btn-sm {
  padding: 7px 14px;
  font-size: 13px;
}

.empty-state {
  text-align: center;
  padding: 80px 0;
  color: var(--color-text-muted);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.loading-center {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>