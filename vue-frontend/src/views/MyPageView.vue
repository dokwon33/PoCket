<template>
  <div class="page-wrapper">
    <AppHeader />
    <div class="page-layout">
      <AppSidebar />

      <main class="main-content">
        <!-- 프로필 카드 -->
        <div class="profile-card fade-in-up">
          <div class="profile-avatar">{{ auth.user?.name?.charAt(0) || '?' }}</div>
          <div class="profile-info">
            <h2 class="profile-name">{{ auth.user?.name || '사용자' }}</h2>
            <p class="profile-email">{{ auth.user?.email || '-' }}</p>
            <span class="badge" :class="host ? 'badge-amber' : 'badge-blue'">
              {{ roleLabel(auth.user?.role) }}
            </span>
          </div>
        </div>

        <!-- 받은 평가 : 역할과 무관하게 상대방이 남긴 평가 -->
        <section class="reviews-section">
          <div class="section-head">
            <h3 class="section-title">{{ host ? '내 테스트베드에 대한 평가' : '받은 평가' }}</h3>
            <span v-if="reputation?.reviewCount" class="reputation-summary">
              <StarRating :model-value="reputation.averageRating || 0" readonly :size="16" />
              <strong>{{ (reputation.averageRating || 0).toFixed(1) }}</strong>
              <span class="reputation-count">{{ reputation.reviewCount }}건</span>
            </span>
          </div>

          <div v-if="reviewsLoading" class="empty-text">불러오는 중...</div>

          <!-- review-service 가 죽었을 때 "평가가 없다" 고 말하면 안 된다 -->
          <p v-else-if="reviewsError" class="empty-text error-text">
            {{ reviewsError }}
            <button type="button" class="text-btn" @click="loadReviews()">다시 시도</button>
          </p>

          <ul v-else-if="received.length" class="review-list">
            <li v-for="r in received" :key="r.id" class="review-item">
              <div class="review-top">
                <StarRating :model-value="r.rating" readonly :size="14" />
                <span class="review-author">{{ reviewerName(r) }}</span>
                <span class="review-role">{{ reviewerRoleLabel(r.reviewerRole) }}</span>
                <span class="review-date">{{ formatDate(r.createdAt) }}</span>
              </div>
              <router-link :to="`/testbeds/${r.courseId}`" class="review-slot">
                {{ reviewSlots[r.courseId]?.title || `실증 슬롯 #${r.courseId}` }}
              </router-link>
              <p v-if="r.comment" class="review-comment">{{ r.comment }}</p>

              <!-- 호스트는 여기서 상대 스타트업을 평가한다.
                   슬롯별 신청자 조회 API 가 없어, 받은 평가가 유일한 상대 식별 경로다. -->
              <div v-if="host" class="review-reply">
                <template v-if="myReviewOf(r)">
                  <StarRating :model-value="myReviewOf(r).rating" readonly :size="14" />
                  <span class="reply-label">내가 남긴 평가</span>
                  <button type="button" class="text-btn" @click="openHostReview(r)">수정</button>
                </template>
                <button v-else type="button" class="btn btn-primary btn-sm" @click="openHostReview(r)">
                  이 스타트업 평가하기
                </button>
              </div>
            </li>
          </ul>

          <p v-else class="empty-text">
            {{ host ? '아직 내 테스트베드에 남겨진 평가가 없습니다.' : '아직 받은 평가가 없습니다.' }}
          </p>
        </section>

        <!-- 스타트업 화면 -->
        <section v-if="!host" class="recommend-section">
          <h3 class="section-title">AI 추천 테스트베드</h3>

          <p v-if="recommendMessage" class="recommend-message">
            {{ recommendMessage }}
          </p>

          <div v-if="recommendLoading" class="loading-row">
            <div v-for="i in 3" :key="i" class="skeleton-card">
              <div class="skeleton-thumb"></div>
              <div class="skeleton-body">
                <div class="skeleton-line short"></div>
                <div class="skeleton-line"></div>
              </div>
            </div>
          </div>

          <div v-else-if="recommendations.length" class="recommend-grid fade-in">
            <CourseCard v-for="c in recommendations" :key="c.id" :course="c" />
          </div>

          <SessionExpiredNotice v-else-if="authExpired" />

          <p v-else-if="recommendError" class="empty-text">
            {{ recommendError }}
          </p>

          <p v-else class="empty-text">
            아직 추천할 테스트베드가 없습니다.
          </p>
        </section>

        <!-- 호스트 화면 -->
        <section v-else class="instructor-section">
          <div class="section-head">
            <h3 class="section-title">내가 등록한 실증 슬롯</h3>
            <span class="section-subtitle">등록한 슬롯과 슬롯별 실증 진행 건수를 확인할 수 있습니다.</span>
          </div>

          <div class="summary-cards">
            <div class="summary-card">
              <div class="summary-label">등록 슬롯 수</div>
              <div class="summary-value">{{ myCourses.length }}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">총 실증 진행</div>
              <div class="summary-value">{{ totalRunCount }}</div>
            </div>
          </div>

          <div v-if="instructorLoading" class="loading-row instructor-loading">
            <div v-for="i in 3" :key="i" class="skeleton-card">
              <div class="skeleton-thumb"></div>
              <div class="skeleton-body">
                <div class="skeleton-line short"></div>
                <div class="skeleton-line"></div>
              </div>
            </div>
          </div>

          <div v-else-if="myCourses.length" class="instructor-course-list fade-in">
            <div
              v-for="course in myCourses"
              :key="course.id"
              class="instructor-course-card"
            >
              <div class="course-card-top">
                <div>
                  <h4 class="course-title">{{ course.title }}</h4>
                  <p class="course-desc">{{ course.description || '설명이 없습니다.' }}</p>
                </div>
                <span
                  class="status-badge"
                  :class="course.status === 'ACTIVE' ? 'status-active' : 'status-inactive'"
                >
                  {{ courseStatus(course.status).label }}
                </span>
              </div>

              <div class="course-meta-grid">
                <div class="meta-box">
                  <div class="meta-label">산업군</div>
                  <div class="meta-value">{{ categoryLabel(course.category) }}</div>
                </div>
                <div class="meta-box">
                  <div class="meta-label">실증비</div>
                  <div class="meta-value">{{ formatPrice(course.price) }}</div>
                </div>
                <div class="meta-box">
                  <div class="meta-label">실증 진행</div>
                  <div class="meta-value">
                    {{ course.enrollment_count ?? course.enrollmentCount ?? 0 }}건
                  </div>
                </div>
                <div class="meta-box">
                  <div class="meta-label">슬롯 ID</div>
                  <div class="meta-value">#{{ course.id }}</div>
                </div>
              </div>

              <div class="course-card-actions">
                <router-link :to="`/testbeds/${course.id}`" class="action-btn action-primary">
                  슬롯 보기
                </router-link>
              </div>
            </div>
          </div>

          <SessionExpiredNotice v-else-if="authExpired" />

          <p v-else-if="instructorError" class="empty-text">
            {{ instructorError }}
          </p>

          <p v-else class="empty-text">
            아직 등록한 실증 슬롯이 없습니다.
          </p>
        </section>
      </main>
    </div>

    <ReviewModal
      v-if="reviewTarget"
      :target="reviewTarget"
      :existing="reviewExisting"
      @close="closeHostReview"
      @saved="onHostReviewSaved"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import CourseCard from '@/components/CourseCard.vue'
import StarRating from '@/components/StarRating.vue'
import ReviewModal from '@/components/ReviewModal.vue'
import SessionExpiredNotice from '@/components/SessionExpiredNotice.vue'
import { authExpired } from '@/domain/session.js'
import { useAuthStore } from '@/store/auth.js'
import { enrollmentApi } from '@/api/enrollment.js'
import { courseApi } from '@/api/course.js'
import { reviewApi } from '@/api/review.js'
import {
  apiErrorMessage,
  categoryLabel,
  courseStatus,
  isHost,
  roleLabel,
  reviewerRoleLabel,
  maskName,
  recommendMessage as buildRecommendMessage
} from '@/domain/pocket.js'
import { primeHosts, primeUsers, userName } from '@/domain/hosts.js'

const auth = useAuthStore()

const host = computed(() => isHost(auth.user?.role))

/* ── 받은 평가 ── */
const reputation = ref(null)
const received = ref([])
const reviewsLoading = ref(true)
const reviewsError = ref('')
/* 평가가 어느 슬롯에 대한 것인지 보여주려면 제목이 필요하다.
   ReviewResponse 에는 courseId 만 있으므로 슬롯을 한 번씩 조회해 채운다. */
const reviewSlots = ref({})

/* 내가(호스트가) 남긴 평가 — 답례 평가를 이미 했는지 판별한다 */
const myWritten = ref({})
const reviewTarget = ref(null)
const reviewExisting = ref(null)

const myReviewOf = (r) => myWritten.value[r?.enrollmentId] || null

function openHostReview(r) {
  reviewExisting.value = myReviewOf(r)
  reviewTarget.value = {
    enrollmentId: r.enrollmentId,
    // 호스트가 평가할 때는 revieweeId 가 필수다. 나를 평가한 그 스타트업이 대상이다.
    revieweeId: r.reviewerId,
    slotTitle: reviewSlots.value[r.courseId]?.title || `실증 슬롯 #${r.courseId}`
  }
}

function closeHostReview() {
  reviewTarget.value = null
  reviewExisting.value = null
}

async function onHostReviewSaved() {
  closeHostReview()
  await loadReviews()
}

/** 평가자 이름 — 가운데를 가려서 보여준다. 이름을 못 받아오면 역할로 대체한다. */
function reviewerName(review) {
  const name = userName(review?.reviewerId)
  return name ? maskName(name) : reviewerRoleLabel(review?.reviewerRole)
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ''
    : `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

async function fillReviewSlots(reviews) {
  const ids = [...new Set(reviews.map((r) => r.courseId).filter((v) => v != null))]
  const fetched = await Promise.all(
    ids.map((cid) =>
      courseApi
        .getById(cid)
        .then((res) => [cid, res.data?.data ?? res.data])
        .catch(() => null)
    )
  )
  reviewSlots.value = Object.fromEntries(fetched.filter(Boolean))
}

async function loadReviews() {
  const id = auth.user?.id
  if (!id) {
    reviewsLoading.value = false
    return
  }
  reviewsLoading.value = true
  reviewsError.value = ''
  try {
    const [rep, list, mine] = await Promise.all([
      reviewApi.reputation(id),
      reviewApi.receivedBy(id),
      reviewApi.myWritten().catch(() => null)
    ])
    reputation.value = rep.data
    received.value = Array.isArray(list.data) ? list.data : list.data?.data || []

    const written = Array.isArray(mine?.data) ? mine.data : mine?.data?.data || []
    myWritten.value = Object.fromEntries(written.map((r) => [r.enrollmentId, r]))
    await Promise.all([
      fillReviewSlots(received.value),
      primeUsers(received.value.map((r) => r.reviewerId))
    ])
  } catch (e) {
    console.warn('[MyPage] 평가 조회 실패:', e?.response?.status)
    reviewsError.value = apiErrorMessage(e, '평가를 불러오지 못했습니다.')
  } finally {
    reviewsLoading.value = false
  }
}

/* 스타트업용 */
const recommendations = ref([])
const recommendLoading = ref(true)
const recommendError = ref('')
const recommendMessage = ref('')

/* 호스트용 */
const myCourses = ref([])
const instructorLoading = ref(true)
const instructorError = ref('')

const totalRunCount = computed(() =>
  myCourses.value.reduce((sum, course) => {
    const count = Number(course.enrollment_count ?? course.enrollmentCount ?? 0)
    return sum + (Number.isNaN(count) ? 0 : count)
  }, 0)
)

function formatPrice(price) {
  const value = Number(price ?? 0)
  if (Number.isNaN(value)) return '-'
  return `${value.toLocaleString()}원`
}

/**
 * course 객체에서 호스트 식별자 추출
 */
function getCourseInstructorId(course) {
  return (
    course.instructorId ??
    course.instructor_id ??
    course.instructor ??
    course.teacherId ??
    course.teacher_id ??
    null
  )
}

async function loadStudentRecommendations() {
  try {
    if (!auth.user) {
      console.warn('[MyPage] auth.user is missing')
      recommendError.value = '추천 테스트베드를 준비 중입니다.'
      return
    }

    if (!auth.user.id) {
      console.warn('[MyPage] auth.user.id is missing:', auth.user)
      recommendError.value = '추천 테스트베드를 준비 중입니다.'
      return
    }

    const res = await enrollmentApi.getRecommendations(auth.user.id)
    console.log('[MyPage] recommendation response:', res.data)

    const payload = res.data

    // 백엔드 message 는 "BACKEND 카테고리 기반 추천 강의입니다" 처럼 enum 원시값과
    // 교육 용어가 섞여 있으므로 쓰지 않는다. 같이 오는 basedOnCategory 로 다시 만든다.
    if (Array.isArray(payload?.recommendedCourses)) {
      recommendations.value = payload.recommendedCourses
      recommendMessage.value = buildRecommendMessage(payload.basedOnCategory)
    } else if (Array.isArray(payload?.data)) {
      recommendations.value = payload.data
      recommendMessage.value = buildRecommendMessage(payload.basedOnCategory)
    } else if (Array.isArray(payload)) {
      recommendations.value = payload
      recommendMessage.value = ''
    } else {
      console.warn('[MyPage] unexpected recommendation response shape:', payload)
      recommendations.value = []
      recommendMessage.value = ''
    }
    primeHosts(recommendations.value)
  } catch (error) {
    console.error('[MyPage] failed to load recommendations:', error)
    recommendError.value = '현재 추천 테스트베드를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
  } finally {
    recommendLoading.value = false
  }
}

async function loadInstructorCourses() {
  try {
    if (!auth.user) {
      console.warn('[MyPage] instructor auth.user is missing')
      instructorError.value = '실증 슬롯 정보를 불러오지 못했습니다.'
      return
    }

    if (!auth.user.id) {
      console.warn('[MyPage] instructor auth.user.id is missing:', auth.user)
      instructorError.value = '실증 슬롯 정보를 불러오지 못했습니다.'
      return
    }

    const res = await courseApi.getCourses()
    console.log('[MyPage] course list response:', res.data)

    let courses = []

    if (Array.isArray(res.data?.data)) {
      courses = res.data.data
    } else if (Array.isArray(res.data)) {
      courses = res.data
    } else {
      console.warn('[MyPage] unexpected course response shape:', res.data)
    }

    console.log('[MyPage] auth.user =', auth.user)
    console.log('[MyPage] courses =', courses)
    console.log('[MyPage] first course =', courses[0])

    courses.forEach(course => {
      console.log('[MyPage] instructor fields check:', {
        courseId: course.id,
        instructorId: course.instructorId,
        instructor_id: course.instructor_id,
        instructor: course.instructor,
        teacherId: course.teacherId,
        teacher_id: course.teacher_id,
        rawCourse: course
      })
    })

    const instructorId = Number(auth.user.id)

    myCourses.value = courses.filter(course => {
      const courseInstructorId = Number(getCourseInstructorId(course))
      return !Number.isNaN(courseInstructorId) && courseInstructorId === instructorId
    })

    console.log('[MyPage] filtered myCourses =', myCourses.value)
  } catch (error) {
    console.error('[MyPage] failed to load instructor courses:', error)
    instructorError.value = '현재 실증 슬롯 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
  } finally {
    instructorLoading.value = false
  }
}

onMounted(async () => {
  loadReviews()

  if (host.value) {
    recommendLoading.value = false
    await loadInstructorCourses()
  } else {
    instructorLoading.value = false
    await loadStudentRecommendations()
  }
})
</script>

<style scoped>
.reviews-section {
  margin-top: 32px;
}
.reputation-summary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-display);
  font-size: 17px;
  letter-spacing: -0.03em;
  color: var(--color-text-primary);
}
.reputation-count {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-muted);
}
.review-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}
.review-item {
  padding: 18px 20px;
  border-radius: var(--radius-lg);
  background: var(--glass-bg);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-edge);
  box-shadow: var(--shadow-glass);
}
.review-top {
  display: flex;
  align-items: center;
  gap: 10px;
}
.review-author {
  font-size: 13.5px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
}
.review-role {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--color-text-muted);
}
.review-date {
  margin-left: auto;
  font-size: 12.5px;
  color: var(--color-text-muted);
}
.review-slot {
  display: inline-block;
  margin-top: 8px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--color-link);
}
.review-slot:hover { text-decoration: underline; }
.review-reply {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--glass-edge);
  display: flex;
  align-items: center;
  gap: 8px;
}
.reply-label {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-text-secondary);
}
.btn-sm {
  padding: 8px 16px;
  font-size: 13px;
  border-radius: var(--radius-pill);
}
.review-comment {
  margin-top: 10px;
  font-size: 14.5px;
  line-height: 1.7;
  color: var(--color-text-secondary);
}

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
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 22px;
  background: var(--glass-bg-strong);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-edge);
  border-radius: var(--radius-xl);
  padding: 32px;
  box-shadow: var(--shadow-glass);
}

.profile-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-link);
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profile-name {
  font-size: 20px;
  font-weight: 700;
}

.profile-email {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.badge {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.badge-blue {
  background: #e8f1ff;
  color: #2563eb;
}

.badge-amber {
  background: #f7edd8;
  color: #9a6700;
}

.section-head {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
}

.section-subtitle {
  font-size: 13px;
  color: var(--color-text-muted);
}

.recommend-message {
  margin-bottom: 14px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.recommend-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.loading-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.instructor-loading {
  margin-bottom: 20px;
}

.skeleton-card {
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.skeleton-thumb {
  height: 110px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.skeleton-body {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.skeleton-line.short {
  width: 40%;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(160px, 220px));
  gap: 16px;
  margin-bottom: 20px;
}

.summary-card {
  background: var(--glass-bg);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-edge);
  border-radius: var(--radius-lg);
  padding: 22px 24px;
  box-shadow: var(--shadow-glass);
}

.summary-label {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 8px;
}

.summary-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.instructor-course-list {
  display: grid;
  gap: 18px;
}

.instructor-course-card {
  background: var(--glass-bg);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-edge);
  box-shadow: var(--shadow-glass);
  border-radius: var(--radius-xl);
  padding: 22px;
  box-shadow: var(--shadow-sm);
}

.course-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.course-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
}

.course-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  white-space: pre-line;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
}

.status-active {
  background: #eaf8ef;
  color: #0f8a3b;
}

.status-inactive {
  background: #f3f4f6;
  color: #6b7280;
}

.course-meta-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 18px;
}

.meta-box {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: 14px;
}

.meta-label {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 6px;
}

.meta-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.course-card-actions {
  display: flex;
  justify-content: flex-end;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  border-radius: var(--radius-md);
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  transition: var(--transition);
}

.action-primary {
  background: var(--color-primary);
  color: white;
}

.action-primary:hover {
  opacity: 0.92;
}

.empty-text {
  color: var(--color-text-muted);
  font-size: 14px;
}
/* "평가가 없다" 와 "못 불러왔다" 는 색으로도 구분한다 */
.error-text {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-text-secondary);
}

@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}

@media (max-width: 992px) {
  .page-layout {
    grid-template-columns: 1fr;
  }

  .recommend-grid,
  .loading-row,
  .course-meta-grid {
    grid-template-columns: 1fr;
  }

  .summary-cards {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .profile-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .course-card-top {
    flex-direction: column;
  }

  .summary-cards {
    grid-template-columns: 1fr;
  }
}
</style>