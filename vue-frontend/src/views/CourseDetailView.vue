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

            <!-- 신청 전에 알아야 할 것들.
                 메타 스트립 아래가 비어 있어 결정에 쓸 정보가 없었다. -->
            <div class="facts">
              <div v-if="hostProfile" class="fact-card host-profile">
                <div class="host-avatar" aria-hidden="true">{{ hostProfile.name.charAt(0) }}</div>
                <div class="host-body">
                  <div class="host-name">{{ hostProfile.name }}</div>
                  <div class="host-meta">
                    현장 {{ hostProfile.slots }}곳 · 실증 {{ hostProfile.runs.toLocaleString() }}건 진행
                    <template v-if="reputation?.reviewCount">
                      · 평판 {{ (reputation.averageRating || 0).toFixed(1) }}
                      ({{ reputation.reviewCount }}건)
                    </template>
                  </div>
                  <div v-if="hostProfile.since" class="host-since">
                    {{ hostProfile.since }}부터 PoCket에서 활동
                  </div>
                </div>
              </div>

              <!-- 평균만 보면 4.5 가 '다 4.5' 인지 '5와 3의 평균' 인지 알 수 없다 -->
              <div v-if="reputation?.reviewCount" class="fact-card">
                <div class="fact-label">호스트가 받은 별점</div>
                <ul class="rating-bars">
                  <li v-for="b in ratingBars" :key="b.star" class="rating-row">
                    <span class="rating-star">★{{ b.star }}</span>
                    <span class="rating-track">
                      <span class="rating-fill" :style="{ width: b.pct + '%' }"></span>
                    </span>
                    <span class="rating-num">{{ b.count }}</span>
                  </li>
                </ul>
              </div>

              <div v-if="runRank" class="fact-card fact-line">
                <Icon name="target" :size="17" :stroke-width="1.6" class="fact-icon" />
                <span>{{ runRank }}</span>
              </div>
            </div>
          </div>

          <!-- 우측 결제/신청 카드 -->
          <div class="enroll-card fade-in">
            <SlotThumb class="enroll-thumb" :course="course" :icon-size="52" />

            <div class="enroll-body">
              <div class="enroll-price">₩{{ displayPrice }}</div>
              <!-- 금액만 있으면 비싼지 싼지 알 수 없다. 같은 산업군과 견줘 준다. -->
              <p v-if="priceCompare" class="price-compare">{{ priceCompare }}</p>

              <button
                class="btn btn-primary btn-full"
                @click="handlePrimaryAction"
                :disabled="buttonDisabled"
              >
                <span v-if="enrolling">처리 중...</span>
                <span v-else>{{ buttonLabel }}</span>
              </button>

              <div v-show="enrollError" class="error-msg" role="alert">{{ enrollError }}</div>

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

      <!-- 현장 후기
           평판은 위 메타에 숫자로만 있어서, 실제로 어땠는지는 알 수 없었다.
           수백만 원짜리 결정을 별점 하나로 내리게 하면 안 된다. -->
      <section class="reviews-section">
        <div class="reviews-head">
          <h2 class="section-title">현장 후기</h2>
          <span v-if="slotReviews.length" class="reviews-count">{{ slotReviews.length }}건</span>
        </div>

        <div v-if="reviewsLoading" class="reviews-loading">
          <div v-for="i in 2" :key="i" class="review-skeleton"></div>
        </div>

        <p v-else-if="reviewsError" class="reviews-empty">
          {{ reviewsError }}
          <button type="button" class="text-btn" @click="loadSlotReviews()">다시 시도</button>
        </p>

        <ul v-else-if="slotReviews.length" class="review-list">
          <li v-for="r in slotReviews" :key="r.id" class="review-item">
            <div class="review-top">
              <StarRating :model-value="r.rating" readonly :size="14" />
              <span class="review-author">{{ maskName(userName(r.reviewerId) || '') }}</span>
              <span class="review-role">{{ reviewerRoleLabel(r.reviewerRole) }}</span>
              <span class="review-date">{{ formatDate(r.createdAt) }}</span>
            </div>
            <p v-if="r.comment" class="review-comment">{{ r.comment }}</p>
          </li>
        </ul>

        <template v-else>
          <p class="reviews-empty">
            아직 이 현장에 남겨진 후기가 없습니다. 실증이 끝나면 신청자가 남길 수 있습니다.
          </p>

          <!-- 위 메타의 '호스트 평판' 은 호스트가 받은 전체 평가다.
               이 슬롯 후기가 없을 때 그 숫자만 보이면 서로 어긋난 것처럼 읽힌다.
               같은 호스트의 다른 현장 후기를 보여줘 앞뒤를 맞춘다. -->
          <div v-if="otherReviews.length" class="other-reviews">
            <h3 class="other-title">
              이 호스트의 다른 현장 후기
              <span class="reviews-count">{{ otherReviews.length }}건</span>
            </h3>
            <ul class="review-list">
              <li v-for="r in otherReviews" :key="r.id" class="review-item">
                <div class="review-top">
                  <StarRating :model-value="r.rating" readonly :size="14" />
                  <span class="review-author">{{ maskName(userName(r.reviewerId) || '') }}</span>
                  <span class="review-role">{{ reviewerRoleLabel(r.reviewerRole) }}</span>
                  <span class="review-date">{{ formatDate(r.createdAt) }}</span>
                </div>
                <router-link :to="`/testbeds/${r.courseId}`" class="review-slot">
                  {{ reviewSlotTitle(r.courseId) }}
                </router-link>
                <p v-if="r.comment" class="review-comment">{{ r.comment }}</p>
              </li>
            </ul>
          </div>
        </template>
      </section>

      <!-- 이 호스트의 다른 현장
           후기가 없는 새 슬롯일수록 호스트가 어떤 규모로 운영하는지가 판단 근거가 된다. -->
      <section v-if="hostSlots.length" class="host-section">
        <div class="reviews-head">
          <h2 class="section-title">이 호스트의 다른 현장</h2>
          <span class="reviews-count">{{ hostSummary }}</span>
        </div>
        <div class="host-grid">
          <CourseCard v-for="c in hostSlots" :key="c.id" :course="c" />
        </div>
      </section>
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
import { refreshMyEnrollments } from '@/domain/myEnrollments.js'
import { rememberSlot } from '@/domain/recentSlots.js'
import { useAuthStore } from '@/store/auth.js'
import {
  category,
  categoryLabel,
  categoryStyle,
  courseStatus,
  isHost,
  formatFee,
  maskName,
  reviewerRoleLabel,
  apiErrorMessage
} from '@/domain/pocket.js'
import { hostName as resolveHost, primeHosts, primeUsers, userName } from '@/domain/hosts.js'
import StarRating from '@/components/StarRating.vue'
import Icon from '@/components/Icon.vue'
import CourseCard from '@/components/CourseCard.vue'
import { reviewApi } from '@/api/review.js'
import { courseApi } from '@/api/course.js'
import PaymentConfirmModal from '@/components/PaymentConfirmModal.vue'

const route = useRoute()
const router = useRouter()
const courseStore = useCourseStore()
const auth = useAuthStore()

const enrolling = ref(false)
const enrollError = ref('')
const enrollmentStatus = ref('NONE')
/* 신청 이력이 도착하기 전에는 버튼을 잠근다.
   초깃값 'NONE' 만 믿고 누르면 결제 확인 시트가 뜨고 백엔드가 409 로 거절한다. */
const statusLoading = ref(true) // NONE | PENDING | ACTIVE

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
  if (statusLoading.value) return '신청 이력 확인 중…'
  if (enrollmentStatus.value === 'ACTIVE') return '내 실증 목록으로 이동'
  if (enrollmentStatus.value === 'PENDING') return '확정 처리 중…'
  if (closed.value) return '모집이 마감된 슬롯입니다'
  return '실증비 결제하고 신청하기'
})

const buttonDisabled = computed(() => {
  if (enrolling.value) return true
  if (statusLoading.value) return true
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
    statusLoading.value = false
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
  } finally {
    statusLoading.value = false
  }
}

/* ── 현장 후기 ────────────────────────────────────────────
   review-service 에는 "이 슬롯의 평가" 를 묻는 API 가 없다.
   호스트가 받은 평가를 통째로 받아 courseId 로 이 슬롯 것만 걸러낸다. */
const slotReviews = ref([])
/* 이 슬롯 후기가 없을 때 보여줄, 같은 호스트의 다른 현장 후기 */
const otherReviews = ref([])
const otherSlotTitles = ref({})
const reviewsLoading = ref(true)
const reviewsError = ref('')

const reviewSlotTitle = (id) => otherSlotTitles.value[id] || `실증 슬롯 #${id}`

async function loadSlotReviews() {
  const instructorId = course.value?.instructorId ?? course.value?.instructor_id
  const courseId = course.value?.id
  if (!instructorId || !courseId) {
    reviewsLoading.value = false
    return
  }

  reviewsLoading.value = true
  reviewsError.value = ''
  try {
    const res = await reviewApi.receivedBy(instructorId)
    const all = Array.isArray(res.data) ? res.data : res.data?.data || []

    hostReviews.value = all   // 별점 분포는 호스트가 받은 전체를 쓴다
    const newest = (a, b) => String(b.createdAt).localeCompare(String(a.createdAt))
    slotReviews.value = all.filter((r) => Number(r.courseId) === Number(courseId)).sort(newest)

    // 이 슬롯 후기가 없을 때만 다른 현장 것을 보여준다. 최근 3건이면 충분하다.
    otherReviews.value = slotReviews.value.length
      ? []
      : all.filter((r) => Number(r.courseId) !== Number(courseId)).sort(newest).slice(0, 3)

    // 작성자 이름을 붙인다. 실패해도 별점과 본문은 그대로 보인다.
    const shown = [...slotReviews.value, ...otherReviews.value]
    await primeUsers(shown.map((r) => r.reviewerId))
    await fillOtherSlotTitles()
  } catch (e) {
    console.warn('[CourseDetail] 후기 조회 실패:', e?.response?.status)
    reviewsError.value = apiErrorMessage(e, '후기를 불러오지 못했습니다.')
  } finally {
    reviewsLoading.value = false
  }
}

/* 다른 현장 후기는 어느 슬롯 것인지 밝혀야 의미가 있다 */
async function fillOtherSlotTitles() {
  const ids = [...new Set(otherReviews.value.map((r) => r.courseId).filter((v) => v != null))]
  if (!ids.length) return

  const fetched = await Promise.all(
    ids.map((id) =>
      courseApi
        .getById(id)
        .then((res) => [id, (res.data?.data ?? res.data)?.title])
        .catch(() => null)
    )
  )
  otherSlotTitles.value = Object.fromEntries(fetched.filter((x) => x && x[1]))
}

/* ── 같은 산업군 대비 실증비 · 이 호스트의 다른 현장 ─────────
   둘 다 전체 슬롯 목록 하나로 계산한다. 요청은 한 번만 나간다. */
const peers = ref([])

function median(nums) {
  if (!nums.length) return 0
  const a = [...nums].sort((x, y) => x - y)
  const m = Math.floor(a.length / 2)
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2
}

/*
 * 평균이 아니라 중간값을 쓴다.
 * 한 슬롯이 극단적으로 비싸면 평균이 통째로 끌려가 "평균보다 훨씬 싸다" 는
 * 엉뚱한 말이 된다. 실제로 F&B 는 시험용 슬롯 하나 때문에 평균이 17,962,500,
 * 중간값은 그 10분의 1 수준이다.
 */
const priceCompare = computed(() => {
  const price = Number(course.value?.price ?? 0)
  const cat = course.value?.category
  if (!price || !cat) return ''

  const sameCategory = peers.value.filter(
    (c) => c.category === cat && courseStatus(c.status).tone !== 'off'
  )
  if (sameCategory.length < 3) return ''   // 표본이 적으면 비교가 오해를 만든다

  const label = categoryLabel(cat)
  const cheaper = sameCategory.filter((c) => Number(c.price ?? 0) < price).length
  const rank = sameCategory.length - cheaper // 비싼 순 등수

  /*
   * 배수(중간값 대비 몇 %)가 아니라 백분위를 쓴다.
   * 한 슬롯이 극단적으로 비싸면 배수가 무너진다 — 실제로 '중간값보다 6016% 높음'
   * 같은 문구가 나왔다. 백분위는 이상값이 있어도 항상 0~100 안에 머문다.
   */
  const pct = Math.round((rank / sameCategory.length) * 100)
  if (pct <= 25) return `${label} ${sameCategory.length}건 중 상위 ${pct}% · 비싼 편`
  if (pct >= 75) return `${label} ${sameCategory.length}건 중 하위 ${100 - pct}% · 저렴한 편`
  return `${label} ${sameCategory.length}건 중 중간 수준`
})

/* ── 실증 진행 순위 ── */
const runRank = computed(() => {
  const cat = course.value?.category
  const runs = Number(course.value?.enrollmentCount ?? course.value?.enrollment_count ?? 0)
  if (!cat) return ''

  const same = peers.value.filter((c) => c.category === cat)
  if (same.length < 3) return ''

  const above = same.filter(
    (c) => Number(c.enrollmentCount ?? c.enrollment_count ?? 0) > runs
  ).length
  return `${categoryLabel(cat)} ${same.length}건 중 실증 진행 ${above + 1}위`
})

/* ── 별점 분포 ── */
const hostReviews = ref([])

const ratingBars = computed(() => {
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: hostReviews.value.filter((r) => Number(r.rating) === star).length
  }))
  const max = Math.max(1, ...counts.map((c) => c.count))
  return counts.map((c) => ({ ...c, pct: Math.round((c.count / max) * 100) }))
})

/* ── 호스트 요약 ── */
const hostProfile = computed(() => {
  const hostId = course.value?.instructorId ?? course.value?.instructor_id
  if (!hostId) return null

  const mine = peers.value.filter((c) => (c.instructorId ?? c.instructor_id) === hostId)
  if (!mine.length) return null

  const since = mine
    .map((c) => c.createdAt)
    .filter(Boolean)
    .sort()[0]

  return {
    name: displayHostName.value,
    slots: mine.length,
    runs: mine.reduce((sum, c) => sum + Number(c.enrollmentCount ?? c.enrollment_count ?? 0), 0),
    since: since ? `${new Date(since).getFullYear()}년 ${new Date(since).getMonth() + 1}월` : null
  }
})

/** 같은 호스트의 다른 슬롯. 실증 진행이 많은 순으로 최대 3건. */
const hostSlots = computed(() => {
  const hostId = course.value?.instructorId ?? course.value?.instructor_id
  if (!hostId) return []
  return peers.value
    .filter((c) => (c.instructorId ?? c.instructor_id) === hostId && c.id !== course.value?.id)
    .sort((a, b) => Number(b.enrollmentCount ?? 0) - Number(a.enrollmentCount ?? 0))
    .slice(0, 3)
})

const hostSummary = computed(() => {
  const hostId = course.value?.instructorId ?? course.value?.instructor_id
  const mine = peers.value.filter((c) => (c.instructorId ?? c.instructor_id) === hostId)
  const runs = mine.reduce((sum, c) => sum + Number(c.enrollmentCount ?? 0), 0)
  return `현장 ${mine.length}곳 · 실증 ${runs.toLocaleString()}건`
})

async function loadPeers() {
  try {
    const res = await courseApi.getCourses()
    const list = Array.isArray(res.data?.data) ? res.data.data : []
    peers.value = list.map((c) => ({
      ...c,
      category: c.category ? String(c.category).toUpperCase() : ''
    }))
    await primeHosts(hostSlots.value)
  } catch (e) {
    // 비교는 부가 정보다. 실패해도 본문은 그대로 보인다.
    console.warn('[CourseDetail] 비교용 슬롯 목록 조회 실패:', e?.response?.status)
    peers.value = []
  }
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`
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
    // 목록·랜딩·추천이 보는 캐시를 갱신해 '신청함' 표시가 바로 붙게 한다
    refreshMyEnrollments()
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

/*
 * 슬롯 하나를 통째로 다시 불러온다.
 *
 * 라우터는 같은 컴포넌트로 이동할 때 인스턴스를 재사용한다. 예전에는
 * onMounted 에서 route.params.id 를 한 번만 읽어서, 후기 안의 다른 슬롯
 * 링크를 누르면 URL 만 바뀌고 화면은 이전 슬롯 그대로 남았다.
 */
async function loadSlot(id) {
  // 이전 슬롯의 값이 잠깐 보이지 않도록 먼저 비운다
  slotReviews.value = []
  hostReviews.value = []
  otherReviews.value = []
  otherSlotTitles.value = {}
  reviewsError.value = ''
  reviewsLoading.value = true
  statusLoading.value = true
  enrollError.value = ''
  reputation.value = null

  await courseStore.fetchCourse(id)

  // 목록으로 돌아왔을 때 다시 찾지 않도록 남긴다 (이 브라우저에만 남는다)
  if (courseStore.selectedCourse) rememberSlot(courseStore.selectedCourse)

  loadReputation(courseStore.selectedCourse?.instructorId)
  loadSlotReviews()
  loadPeers()
  await loadEnrollmentStatus()
}

onMounted(() => loadSlot(route.params.id))

// 같은 화면 안에서 다른 슬롯으로 이동하는 경우
watch(
  () => route.params.id,
  (id, prev) => {
    if (id && id !== prev) loadSlot(id)
  }
)

watch(
  () => courseStore.selectedCourse,
  async (value) => {
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

/* 투명도를 줄이도록 설정한 사용자에게는 유리를 불투명하게 —
   가드가 없으면 설정을 켜도 blur 와 반투명이 그대로 남는다. */
@media (prefers-reduced-transparency: reduce) {
  .detail-meta {
    background: var(--color-bg-primary);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    border-color: var(--color-border);
  }
}

/* ── 현장 후기 ─────────────────────────────────────────────
   마이페이지의 평가 목록과 같은 규격을 쓴다 — 같은 것이 다르게 보이면 안 된다 */
/* 히어로(.detail-hero-inner)와 같은 폭·좌우 여백을 써야 세로선이 맞는다 */
.reviews-section {
  max-width: 1100px;
  margin: 0 auto;
  padding: 8px 24px 44px;
}

.reviews-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 18px;
}
.section-title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.035em;
  color: var(--color-text-primary);
}
.reviews-count {
  font-size: 13.5px;
  color: var(--color-text-muted);
}

.review-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  flex-wrap: wrap;
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
.review-comment {
  margin-top: 10px;
  font-size: 14.5px;
  line-height: 1.7;
  color: var(--color-text-secondary);
}

/* ── 신청 전 정보 블록 ───────────────────────────────────── */
.facts {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 520px;
}

.fact-card {
  padding: 18px 20px;
  border-radius: var(--radius-lg);
  background: var(--glass-bg);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-edge);
  box-shadow: var(--shadow-glass);
}
.fact-label {
  font-size: 12.5px;
  color: var(--color-text-muted);
  margin-bottom: 12px;
}
.fact-line {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--color-text-secondary);
}
.fact-icon { color: var(--color-link); }

/* 호스트 소개 */
.host-profile {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}
.host-avatar {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-light);
  color: var(--color-link);
  font-size: 17px;
  font-weight: 700;
}
.host-body { min-width: 0; }
.host-name {
  font-size: 15.5px;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--color-text-primary);
}
.host-meta {
  margin-top: 4px;
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--color-text-secondary);
}
.host-since {
  margin-top: 2px;
  font-size: 12.5px;
  color: var(--color-text-muted);
}

/* 별점 분포 */
.rating-bars {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.rating-row {
  display: grid;
  grid-template-columns: 30px 1fr 28px;
  align-items: center;
  gap: 10px;
}
.rating-star {
  font-size: 12.5px;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}
.rating-track {
  height: 8px;
  border-radius: var(--radius-pill);
  background: var(--color-bg-tertiary);
  overflow: hidden;
}
.rating-fill {
  display: block;
  height: 100%;
  border-radius: var(--radius-pill);
  background: #F2A93B;
}
.rating-num {
  font-size: 12.5px;
  color: var(--color-text-secondary);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-transparency: reduce) {
  .fact-card {
    background: var(--color-bg-primary);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    border-color: var(--color-border);
  }
}

/* 가격 비교 — 금액 바로 아래, 결정하는 자리에 붙는다 */
.price-compare {
  margin-top: -8px;
  margin-bottom: 14px;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--color-text-muted);
}

/* 이 호스트의 다른 현장 */
.host-section {
  max-width: 1100px;
  margin: 0 auto;
  padding: 8px 24px 72px;
}
.host-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
@media (max-width: 900px) {
  .host-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 600px) {
  .host-grid { grid-template-columns: minmax(0, 1fr); }
}

/* 다른 현장 후기 — 이 슬롯 것과 섞이지 않게 한 칸 띄우고 제목을 단다 */
.other-reviews {
  margin-top: 26px;
}
.other-title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 14px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-text-secondary);
}
.review-slot {
  display: inline-block;
  margin-top: 8px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--color-link);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.reviews-empty {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--color-text-muted);
}

.reviews-loading {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.review-skeleton {
  height: 92px;
  border-radius: var(--radius-lg);
  background: linear-gradient(90deg, var(--color-bg-secondary) 25%, var(--color-bg-tertiary) 50%, var(--color-bg-secondary) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
  to { background-position: -200% 0; }
}

@media (prefers-reduced-transparency: reduce) {
  .review-item {
    background: var(--color-bg-primary);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    border-color: var(--color-border);
  }
}
</style>
