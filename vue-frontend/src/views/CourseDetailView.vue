<template>
  <div class="page-wrapper">
    <AppHeader />

    <div class="detail-layout" v-if="course">
      <div class="detail-hero">
        <div class="detail-hero-inner">
          <!-- 좌측 상세 정보 -->
          <div class="detail-info fade-in-up">
            <span class="badge" :style="categoryStyle(course.category)">{{ displayCategory }}</span>
            <h1 class="detail-title">{{ course.title }}</h1>
            <p class="detail-desc">
              {{ course.description || '현장 환경 스펙이 아직 등록되지 않았습니다. 호스트에게 문의해 주세요.' }}
            </p>

            <div class="detail-meta">
              <div class="meta-item">
                <span class="meta-label">호스트</span>
                <span class="meta-value">{{ displayHostName }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">실증 진행</span>
                <span class="meta-value">{{ displayRunCount }}건</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">모집 상태</span>
                <span class="meta-value">{{ courseStatus(course.status).label }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">호스트 평판</span>
                <span v-if="reputation?.reviewCount" class="meta-value meta-rating">
                  <StarRating :model-value="reputation.averageRating || 0" readonly :size="14" />
                  {{ (reputation.averageRating || 0).toFixed(1) }}
                  <span class="meta-sub">({{ reputation.reviewCount }}건)</span>
                </span>
                <span v-else class="meta-value meta-muted">아직 평가 없음</span>
              </div>
            </div>
          </div>

          <!-- 우측 결제/신청 카드 -->
          <div class="enroll-card fade-in">
            <SlotThumb class="enroll-thumb" :course="course" :icon-size="52" />

            <div class="enroll-body">
              <div class="enroll-price">₩{{ displayPrice }}</div>

              <button
                class="btn btn-primary btn-full"
                @click="handlePrimaryAction"
                :disabled="buttonDisabled"
                :class="{ 'btn-disabled': buttonDisabled }"
              >
                <span v-if="enrolling">처리 중...</span>
                <span v-else>{{ buttonLabel }}</span>
              </button>

              <div v-if="enrollError" class="error-msg">{{ enrollError }}</div>

              <p class="helper-text" v-if="helperText">
                {{ helperText }}
              </p>

              <ul class="enroll-info-list">
                <li>실증비 결제 시 실증 확정</li>
                <li>확정 후 현장 상세 정보 공개</li>
                <li>실증 종료 후 상호 평가</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="loading" class="loading-center">
      <div class="spinner"></div>
    </div>

    <SessionExpiredNotice v-else-if="authExpired" />

    <div v-else class="loading-center">
      <p class="empty-text">실증 슬롯 정보를 불러오지 못했습니다.</p>
    </div>

    <PaymentConfirmModal
      v-if="confirmOpen && course"
      :slot="{ title: course.title, category: course.category, price: course.price }"
      :host-name="displayHostName"
      :processing="enrolling"
      :error="enrollError"
      @close="closeConfirm"
      @confirm="confirmAndEnroll"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import SlotThumb from '@/components/SlotThumb.vue'
import SessionExpiredNotice from '@/components/SessionExpiredNotice.vue'
import { authExpired } from '@/domain/session.js'
import { useCourseStore } from '@/store/course.js'
import { enrollmentApi } from '@/api/enrollment.js'
import { useAuthStore } from '@/store/auth.js'
import { category, categoryStyle, courseStatus, isHost, formatFee, apiErrorMessage } from '@/domain/pocket.js'
import { hostName as resolveHost } from '@/domain/hosts.js'
import StarRating from '@/components/StarRating.vue'
import { reviewApi } from '@/api/review.js'
import PaymentConfirmModal from '@/components/PaymentConfirmModal.vue'

const route = useRoute()
const router = useRouter()
const courseStore = useCourseStore()
const auth = useAuthStore()

const enrolling = ref(false)
const enrollError = ref('')
const enrollmentStatus = ref('NONE') // NONE | PENDING | ACTIVE

const course = computed(() => courseStore.selectedCourse)
const loading = computed(() => courseStore.loading)
const host = computed(() => isHost(auth.user?.role))

const cat = computed(() => category(course.value?.category))
const displayCategory = computed(() => cat.value.label)

const displayHostName = computed(() => resolveHost(course.value))

const displayRunCount = computed(() =>
  Number(course.value?.enrollmentCount ?? course.value?.enrollment_count ?? 0).toLocaleString()
)

const displayPrice = computed(() => formatFee(course.value?.price))

/* 호스트 평판 — 공개 API 라 로그인 없이도 조회된다 */
const reputation = ref(null)

async function loadReputation(instructorId) {
  reputation.value = null
  if (!instructorId) return
  try {
    const res = await reviewApi.reputation(instructorId)
    reputation.value = res.data
  } catch (e) {
    console.warn('[CourseDetail] 평판 조회 실패:', e?.response?.status)
  }
}

/** 모집이 끝난 슬롯인가. COURSE_STATUS 의 tone 이 단일 출처다. */
const closed = computed(() => courseStatus(course.value?.status).tone === 'off')

const buttonLabel = computed(() => {
  if (host.value) return '호스트 계정은 신청 불가'
  if (enrollmentStatus.value === 'ACTIVE') return '내 실증 목록으로 이동'
  if (enrollmentStatus.value === 'PENDING') return '확정 처리 중…'
  if (closed.value) return '모집이 마감된 슬롯입니다'
  return '실증비 결제하고 신청하기'
})

const buttonDisabled = computed(() => {
  if (enrolling.value) return true
  if (host.value) return true
  if (enrollmentStatus.value === 'PENDING') return true
  // 마감된 슬롯에 결제 버튼이 열려 있으면 결제부터 하고 거절당한다
  if (closed.value && enrollmentStatus.value !== 'ACTIVE') return true
  return false
})

const helperText = computed(() => {
  if (host.value) {
    return '호스트 계정은 실증 슬롯을 신청할 수 없습니다.'
  }

  if (enrollmentStatus.value === 'ACTIVE') {
    return '이미 확정된 실증입니다. 내 실증 목록에서 진행 상황을 확인할 수 있습니다.'
  }

  if (enrollmentStatus.value === 'PENDING') {
    return '결제가 확인되면 잠시 후 자동으로 확정됩니다.'
  }

  if (closed.value) {
    return '이 슬롯은 모집이 끝나 신청을 받지 않습니다.'
  }

  return '결제를 진행하면 실증 신청이 함께 접수됩니다.'
})

async function loadEnrollmentStatus() {
  if (!auth.user?.id || !course.value?.id || host.value) {
    enrollmentStatus.value = 'NONE'
    return
  }

  try {
    const res = await enrollmentApi.getMyEnrollments()
    console.log('[CourseDetail] my enrollments response =', res.data)

    const enrollments = Array.isArray(res.data?.data)
      ? res.data.data
      : Array.isArray(res.data)
        ? res.data
        : []

    const matched = enrollments.find(item => Number(item.courseId) === Number(course.value.id))

    if (!matched) {
      enrollmentStatus.value = 'NONE'
      return
    }

    enrollmentStatus.value = matched.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING'
  } catch (e) {
    console.error('[CourseDetail] failed to load enrollment status:', e)
    enrollmentStatus.value = 'NONE'
  }
}

/** 신청 버튼 → 곧장 신청하지 않고 결제 확인 단계를 먼저 띄운다 */
function handlePrimaryAction() {
  enrollError.value = ''

  if (host.value) {
    enrollError.value = '호스트 계정은 실증 슬롯을 신청할 수 없습니다.'
    return
  }
  if (enrollmentStatus.value === 'ACTIVE') {
    router.push('/applications')
    return
  }
  if (enrollmentStatus.value === 'PENDING') return

  if (!course.value?.id) {
    enrollError.value = '실증 슬롯 정보가 올바르지 않습니다.'
    return
  }

  confirmOpen.value = true
}

const confirmOpen = ref(false)

function closeConfirm() {
  if (!enrolling.value) confirmOpen.value = false
}

/*
 * 신청 응답은 PENDING 으로 즉시 돌아오고, ACTIVE 가 되는 것은 enrollment-service 가
 * Kafka 이벤트를 소비한 뒤다. 그 사이 화면이 스스로 갱신되지 않으면 사용자는
 * 브라우저를 새로고침하기 전까지 '확정 처리 중' 에 영원히 묶인다.
 * 확정될 때까지 몇 번만 다시 물어본다. 실패해도 화면은 그대로 동작한다.
 */
let confirmTimer = null

function watchUntilConfirmed(tries = 6) {
  clearTimeout(confirmTimer)
  if (tries <= 0) return

  confirmTimer = setTimeout(async () => {
    await loadEnrollmentStatus()
    if (enrollmentStatus.value === 'PENDING') watchUntilConfirmed(tries - 1)
  }, 2000)
}

onBeforeUnmount(() => clearTimeout(confirmTimer))

async function confirmAndEnroll() {
  enrollError.value = ''

  enrolling.value = true

  try {
    await enrollmentApi.enroll(course.value.id)
    enrollmentStatus.value = 'PENDING'
    confirmOpen.value = false
    watchUntilConfirmed()
  } catch (e) {
    console.error('[CourseDetail] enroll failed:', e)
    enrollError.value = apiErrorMessage(e, '실증 신청에 실패했습니다.', {
      409: '이미 신청한 실증 슬롯입니다.'
    })
  } finally {
    enrolling.value = false
  }
}

onMounted(async () => {
  await courseStore.fetchCourse(route.params.id)
  loadReputation(courseStore.selectedCourse?.instructorId)
  console.log('[CourseDetail] selectedCourse =', courseStore.selectedCourse)
  await loadEnrollmentStatus()
})

watch(
  () => courseStore.selectedCourse,
  async (value) => {
    console.log('[CourseDetail] selectedCourse changed =', value)
    if (value?.id) {
      await loadEnrollmentStatus()
      loadReputation(value.instructorId)
    }
  },
  { deep: true }
)
</script>

<style scoped>
.page-wrapper {
  min-height: 100vh;
  background: var(--color-bg-secondary);
}

.detail-hero {
  background: transparent;
  padding: 48px 0;
}

.detail-hero-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 48px;
  align-items: start;
}

.detail-info {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.detail-info .badge { align-self: flex-start; }

.detail-title {
  font-size: 38px;
  letter-spacing: -0.042em;
  font-weight: 700;
  line-height: 1.3;
}

.detail-desc {
  font-size: 16.5px;
  color: var(--color-text-secondary);
  line-height: 1.78;
  max-width: 56ch;   /* 한 줄이 길면 눈이 다음 줄을 놓친다 */
}

/* 사실 정보는 유리 트레이에 모아 한 덩어리로 읽히게 한다 */
.detail-meta {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 16px 6px;
  border-radius: var(--radius-lg);
  background: var(--glass-bg);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-edge);
  box-shadow: var(--shadow-glass);
}
.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 20px;
}
.meta-item + .meta-item { border-left: 1px solid var(--glass-edge); }
.meta-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-muted);
}
.meta-rating {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.meta-sub {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-muted);
}
.meta-muted {
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-muted);
}
.meta-value {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.035em;
  color: var(--color-text-primary);
}

/* 결제/신청 카드는 이 화면의 주인공 — 유리로 띄우고 스크롤을 따라오게 한다 */
.enroll-card {
  position: sticky;
  top: 92px;
  background: var(--glass-bg-strong);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-edge);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-glass), 0 24px 60px rgba(36,34,73,0.10);
}
@media (prefers-reduced-transparency: reduce) {
  .enroll-card {
    background: var(--color-bg-primary);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}

.enroll-thumb {
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.enroll-thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 20px;
}

.enroll-thumb-icon { opacity: 0.72; }

.enroll-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.enroll-price {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.045em;
  color: var(--color-text-primary);
}

.btn-full {
  width: 100%;
  padding: 13px;
  font-size: 15px;
  justify-content: center;
}

.btn-disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.enroll-info-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.enroll-info-list li {
  position: relative;
  padding-left: 22px;
  font-size: 13.5px;
  color: var(--color-text-secondary);
}
/* 이모지 대신 그린 체크 — 이모지는 플랫폼마다 크기와 색이 달라진다 */
.enroll-info-list li::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 6px;
  width: 9px;
  height: 5px;
  border-left: 2px solid var(--color-primary);
  border-bottom: 2px solid var(--color-primary);
  transform: rotate(-45deg);
}

.error-msg {
  font-size: 13px;
  color: #dc2626;
  padding: 8px 12px;
  background: #fef2f2;
  border-radius: var(--radius-sm);
}

.helper-text {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.empty-text {
  font-size: 14px;
  color: var(--color-text-muted);
}

.loading-center {
  display: flex;
  justify-content: center;
  padding: 100px 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.badge-gray {
  background: #f3f4f6;
  color: #6b7280;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .detail-hero-inner {
    grid-template-columns: 1fr;
  }
}
</style>