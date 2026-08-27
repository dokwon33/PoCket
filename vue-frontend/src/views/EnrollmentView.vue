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

        <LoadFailedNotice
          v-else-if="loadError"
          title="신청 내역을 불러오지 못했습니다"
          :message="loadError"
          @retry="load()"
        />

        <div v-else-if="enrollments.length" class="enrollment-list fade-in">
          <div v-for="item in enrollments" :key="item.id" class="enrollment-card">
            <SlotThumb class="enroll-thumb" :course="slotOf(item)" :icon-size="30" />

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

              <!-- 확정된 실증 건만 평가할 수 있다 -->
              <div v-if="writtenOf(item)" class="review-done">
                <StarRating :model-value="writtenOf(item).rating" readonly :size="15" />
                <button type="button" class="text-btn" @click="openReview(item)">평가 수정</button>
              </div>
              <button
                v-else-if="pendingOf(item)"
                type="button"
                class="btn btn-primary btn-sm"
                @click="openReview(item)"
              >
                평가하기
              </button>

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

    <ReviewModal
      v-if="reviewTarget"
      :target="reviewTarget"
      :existing="reviewExisting"
      @close="closeReview"
      @saved="onReviewSaved"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import Icon from '@/components/Icon.vue'
import SlotThumb from '@/components/SlotThumb.vue'
import StarRating from '@/components/StarRating.vue'
import ReviewModal from '@/components/ReviewModal.vue'
import SessionExpiredNotice from '@/components/SessionExpiredNotice.vue'
import LoadFailedNotice from '@/components/LoadFailedNotice.vue'
import { authExpired } from '@/domain/session.js'
import { enrollmentApi } from '@/api/enrollment.js'
import { courseApi } from '@/api/course.js'
import { reviewApi } from '@/api/review.js'
import { useAuthStore } from '@/store/auth.js'
import { apiErrorMessage, category, categoryLabel, categoryStyle, enrollmentStatus } from '@/domain/pocket.js'
import { hostName as resolveHost, primeHosts } from '@/domain/hosts.js'

const auth = useAuthStore()

const enrollments = ref([])
const loadError = ref('')
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

/* ── 상호 평가 ────────────────────────────────────────────
   pending  : 아직 평가하지 않은 확정 건 (enrollmentId -> 정보)
   written  : 내가 이미 남긴 평가 (enrollmentId -> review)
   두 목록으로 카드마다 '평가하기' / '평가 수정' 중 무엇을 보일지 정한다. */
const pending = ref({})
const written = ref({})
const reviewTarget = ref(null)
const reviewExisting = ref(null)

const pendingOf = (item) => pending.value[item?.id] || null
const writtenOf = (item) => written.value[item?.id] || null

async function loadReviews() {
  const [p, w] = await Promise.all([
    reviewApi.myPending().catch((e) => {
      console.warn('[Enrollment] 미평가 목록 조회 실패:', e?.response?.status)
      return null
    }),
    reviewApi.myWritten().catch((e) => {
      console.warn('[Enrollment] 작성한 평가 조회 실패:', e?.response?.status)
      return null
    })
  ])
  const asArray = (res) => (Array.isArray(res?.data) ? res.data : res?.data?.data || [])
  pending.value = Object.fromEntries(asArray(p).map((r) => [r.enrollmentId, r]))
  written.value = Object.fromEntries(asArray(w).map((r) => [r.enrollmentId, r]))
}

function openReview(item) {
  reviewExisting.value = writtenOf(item)
  reviewTarget.value = {
    enrollmentId: item.id,
    revieweeId: pendingOf(item)?.revieweeId ?? null,
    slotTitle: slotOf(item).title || item.course?.title
  }
}

function closeReview() {
  reviewTarget.value = null
  reviewExisting.value = null
}

async function onReviewSaved() {
  closeReview()
  await loadReviews()
}

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

/** 재시도 버튼이 다시 부를 수 있도록 뽑아 둔다 */
async function load() {
  loading.value = true
  loadError.value = ''
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
    await Promise.all([fillSlots(enrollments.value), loadReviews()])
  } catch (e) {
    console.error('[EnrollmentView] failed to load enrollments:', e)
    enrollments.value = []
    // 빈 배열로 두고 빈 상태를 그리면 "신청이 사라졌다"고 읽힌다
    loadError.value = apiErrorMessage(e, '신청 내역을 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
}

onMounted(load)
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

.enroll-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.enroll-info .badge { align-self: flex-start; }

.review-done {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}
.text-btn {
  background: none;
  border: none;
  padding: 0;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-link);
  cursor: pointer;
  text-decoration: underline;
  font-family: var(--font-sans);
}

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

/* Icon 은 display:block 이라 text-align 으로는 가운데로 오지 않는다.
   그대로 두면 아이콘만 왼쪽 끝에 홀로 떠서 문구와 상관없는 그림처럼 보인다.
   결제 내역 화면과 같은 방식(flex 세로 정렬)으로 맞춘다. */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 24px;
  color: var(--color-text-muted);
}

.empty-icon {
  color: var(--color-text-muted);
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

/* 투명도를 줄이도록 설정한 사용자에게는 유리를 불투명하게 —
   가드가 없으면 설정을 켜도 blur 와 반투명이 그대로 남는다. */
@media (prefers-reduced-transparency: reduce) {
  .enrollment-card {
    background: var(--color-bg-primary);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    border-color: var(--color-border);
  }
}
</style>
