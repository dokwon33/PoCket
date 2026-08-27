<template>
  <div class="page-wrapper">
    <AppHeader />
    <div class="page-layout">
      <AppSidebar />

      <main class="main-content">
        <h1 class="page-title">내 실증 신청</h1>

        <div v-if="loading" class="loading-center">
          <div class="spinner"></div>
        </div>

        <SessionExpiredNotice v-else-if="authExpired" />

        <div v-else-if="enrollments.length" class="enrollment-list fade-in">
          <div v-for="item in enrollments" :key="item.id" class="enrollment-card">
            <div class="enroll-thumb" :style="{ background: category(slotOf(item).category).tint }">
              <Icon
                class="enroll-thumb-icon"
                :name="category(slotOf(item).category).icon"
                :size="30"
                :stroke-width="1.5"
                :style="{ color: category(slotOf(item).category).ink }"
              />
            </div>

            <div class="enroll-info">
              <span class="badge" :style="categoryStyle(slotOf(item).category)">
                {{ categoryLabel(slotOf(item).category) }}
              </span>
              <h3 class="enroll-title">{{ slotOf(item).title || item.course?.title }}</h3>
              <p class="enroll-instructor">호스트: {{ resolveHost(slotOf(item)) }}</p>
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
import AppSidebar from '@/components/AppSidebar.vue'
import Icon from '@/components/Icon.vue'
import SessionExpiredNotice from '@/components/SessionExpiredNotice.vue'
import { authExpired } from '@/domain/session.js'
import { enrollmentApi } from '@/api/enrollment.js'
import { courseApi } from '@/api/course.js'
import { useAuthStore } from '@/store/auth.js'
import { category, categoryLabel, categoryStyle, enrollmentStatus, isHost } from '@/domain/pocket.js'
import { hostName as resolveHost, primeHosts } from '@/domain/hosts.js'

const router = useRouter()
const auth = useAuthStore()

const enrollments = ref([])
const loading = ref(true)

/**
 * 슬롯 원본 캐시 (courseId -> course)
 *
 * /api/enrollments/my 가 붙여 주는 course 요약은 두 가지가 빠져 있다.
 *   - category 가 한글 라벨로 변환돼 온다 ("백엔드")
 *   - instructorName 이 null 이다 (course-service 가 그 필드를 주지 않음)
 * 그래서 슬롯 원본을 한 번씩 직접 조회해 채운다.
 */
const slots = ref({})

function slotOf(item) {
  return slots.value[item?.courseId] || item?.course || {}
}

async function fillSlots(list) {
  const ids = [...new Set(list.map((e) => e?.courseId).filter((v) => v != null))]
  const fetched = await Promise.all(
    ids.map((id) =>
      courseApi
        .getById(id)
        .then((res) => [id, res.data?.data ?? res.data])
        .catch((e) => {
          console.warn('[Enrollment] 슬롯 조회 실패:', id, e?.response?.status)
          return null
        })
    )
  )
  slots.value = Object.fromEntries(fetched.filter(Boolean))
  primeHosts(Object.values(slots.value))
}

const host = computed(() => isHost(auth.user?.role))

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
    await fillSlots(enrollments.value)
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

/* 다른 화면과 같은 지점에서 접힌다. 여기만 빠져 있어 창을 줄이면 레이아웃이 튀었다. */
@media (max-width: 992px) {
  .page-layout {
    grid-template-columns: 1fr;
  }
}
</style>