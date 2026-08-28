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
          <div
            v-for="item in enrollments"
            :key="item.id"
            class="enrollment-card"
            :class="{ unseen: isUnseen(item), open: isOpen(item) }"
          >
            <!--
              카드 머리를 눌러 펼친다. 펼치는 순간 '확인함' 으로 기록되고
              내비게이션 배지가 그만큼 줄어든다.
              button 으로 감싸야 키보드(Enter·Space)로도 열린다.
            -->
            <button
              type="button"
              class="enroll-head"
              :aria-expanded="isOpen(item)"
              :aria-controls="`enroll-detail-${item.id}`"
              @click="toggle(item)"
            >
              <SlotThumb class="enroll-thumb" :course="slotOf(item)" :icon-size="30" />

              <div class="enroll-info">
                <div class="enroll-tags">
                  <span class="badge" :style="categoryStyle(slotOf(item).category)">
                    {{ categoryLabel(slotOf(item).category) }}
                  </span>
                  <!-- 확인 전인 확정 건임을 카드에서도 알린다 -->
                  <span v-if="isUnseen(item)" class="new-tag">확인 전</span>
                </div>
                <h3 class="enroll-title">{{ slotOf(item).title || item.course?.title }}</h3>
                <p class="enroll-instructor">호스트: {{ resolveHost(slotOf(item)) }}</p>
              </div>

              <div class="enroll-status">
                <span :class="['status-badge', `status-${enrollmentStatus(item.status).tone}`]">
                  {{ enrollmentStatus(item.status).label }}
                </span>
                <!-- 배지가 '확인' 기준으로 바뀌었으므로, 평가 유도는 여기서 맡는다 -->
                <span v-if="pendingOf(item) && !writtenOf(item)" class="await-review">평가 대기</span>
                <Icon name="chevron" :size="18" class="chev" />
              </div>
            </button>

            <!-- 상세 -->
            <div v-if="isOpen(item)" :id="`enroll-detail-${item.id}`" class="enroll-detail">
              <dl class="detail-grid">
                <div class="detail-item">
                  <dt>신청일</dt>
                  <dd>{{ formatDate(item.createdAt) || '-' }}</dd>
                </div>
                <div class="detail-item">
                  <dt>실증비</dt>
                  <dd>₩{{ formatFee(paymentOf(item)?.amount ?? slotOf(item).price) }}</dd>
                </div>
                <div class="detail-item">
                  <dt>결제 상태</dt>
                  <dd>{{ paymentOf(item) ? paymentStatus(paymentOf(item).status).label : '조회 중' }}</dd>
                </div>
                <div class="detail-item">
                  <dt>산업군</dt>
                  <dd>{{ categoryLabel(slotOf(item).category) }}</dd>
                </div>
              </dl>

              <p v-if="slotOf(item).description" class="detail-desc">
                {{ slotOf(item).description }}
              </p>

              <div class="detail-actions">
                <span v-if="pendingOf(item) && !writtenOf(item)" class="detail-hint">
                  실증이 끝나면 평가를 남겨 주세요. 다음 사람이 이 현장을 고를 근거가 됩니다.
                </span>

                <div class="detail-buttons">
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
import { refreshPendingReviews } from '@/domain/pendingReviews.js'
import { isSeen, loadSeen, markSeen } from '@/domain/seenEnrollments.js'
import { paymentApi } from '@/api/payment.js'
import { useAuthStore } from '@/store/auth.js'
import { apiErrorMessage, category, categoryLabel, categoryStyle, enrollmentStatus, formatFee, paymentStatus } from '@/domain/pocket.js'
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

/* ── 펼침과 '확인함' ──────────────────────────────────────
   카드를 펼치는 순간 확인한 것으로 기록한다. 그 기록이 내비게이션 배지를 줄인다.
   접어도 다시 늘어나지는 않는다 — 이미 봤기 때문이다. */
const openIds = ref(new Set())

const isOpen = (item) => openIds.value.has(item?.id)

/** 확정됐는데 아직 확인하지 않은 건 */
const isUnseen = (item) =>
  Boolean(pendingOf(item)) && !isSeen(item?.id)

function toggle(item) {
  const next = new Set(openIds.value)
  if (next.has(item.id)) next.delete(item.id)
  else {
    next.add(item.id)
    // 확정 건만 알림 대상이다. 결제 대기 중인 건은 셀 이유가 없다.
    if (pendingOf(item)) markSeen(item.id)
  }
  openIds.value = next
}

/* ── 결제 내역 (상세에 금액·상태를 보여주기 위해) ── */
const payments = ref({})
const paymentOf = (item) => payments.value[item?.courseId] || null

async function loadPayments() {
  if (!auth.user?.id) return
  try {
    const res = await paymentApi.listByUser(auth.user.id)
    const list = Array.isArray(res.data) ? res.data : res.data?.data || []
    // courseId 로 묶는다. 같은 슬롯을 두 번 결제할 일은 없다.
    payments.value = Object.fromEntries(list.map((p) => [p.courseId, p]))
  } catch (e) {
    // 상세의 금액 칸만 비고 나머지는 그대로 동작한다
    console.warn('[Enrollment] 결제 내역 조회 실패:', e?.response?.status)
  }
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

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
  // 내비게이션의 '남길 차례' 배지도 같이 줄어야 한다
  await refreshPendingReviews()
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
    await Promise.all([fillSlots(enrollments.value), loadReviews(), loadPayments()])
  } catch (e) {
    console.error('[EnrollmentView] failed to load enrollments:', e)
    enrollments.value = []
    // 빈 배열로 두고 빈 상태를 그리면 "신청이 사라졌다"고 읽힌다
    loadError.value = apiErrorMessage(e, '신청 내역을 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 이 화면에 직접 들어온 경우에도 확인 목록이 있어야 '확인 전' 표시가 맞는다
  loadSeen(auth.user?.id)
  load()
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
  background: var(--glass-bg);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-edge);
  box-shadow: var(--shadow-glass);
  border-radius: var(--radius-xl);
  overflow: hidden;
  transition: var(--transition);
}

.enrollment-card:hover {
  box-shadow: var(--shadow-sm);
}

/* 확인 전인 확정 건 — 색만으로 알리지 않고 '확인 전' 글자를 같이 붙인다 */
.enrollment-card.unseen {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-glass), inset 0 0 0 1px var(--color-primary);
}

/* 카드 머리 전체가 버튼이다. 기본 버튼 모양을 지우고 카드처럼 보이게 한다. */
.enroll-head {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: var(--transition);
}
.enroll-head:hover { background: rgba(255, 255, 255, 0.35); }

.enroll-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.new-tag {
  padding: 3px 9px;
  border-radius: var(--radius-pill);
  background: var(--color-primary);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}

.await-review {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--color-text-muted);
}

.chev {
  color: var(--color-text-muted);
  transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}
.enrollment-card.open .chev { transform: rotate(180deg); }

/* 상세 */
.enroll-detail {
  padding: 4px 20px 18px 20px;
  border-top: 1px solid var(--glass-edge);
  margin-top: -2px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  padding: 16px 0 14px;
}

.detail-item dt {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--color-text-muted);
  margin-bottom: 5px;
}
.detail-item dd {
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
}

.detail-desc {
  padding: 12px 14px;
  border-radius: var(--radius-md);
  background: var(--color-bg-tertiary);
  font-size: 13px;
  line-height: 1.7;
  color: var(--color-text-secondary);
}

.detail-actions {
  margin-top: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.detail-hint {
  font-size: 12.5px;
  color: var(--color-text-muted);
}

.detail-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

@media (max-width: 720px) {
  .detail-grid { grid-template-columns: repeat(2, 1fr); }
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
