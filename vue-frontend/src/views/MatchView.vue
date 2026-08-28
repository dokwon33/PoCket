<template>
  <div class="page-wrapper">
    <AppHeader />
    <div class="page-layout">
      <AppSidebar />

      <main class="main-content">
        <div class="content-header">
          <div>
            <h1 class="page-title">
              AI 매칭
              <span v-if="isStub" class="stub-tag" title="백엔드 연동 전입니다">연동 전</span>
            </h1>
            <p class="page-subtitle">
              산업군 여덟 칸으로는 담기지 않는 조건이 있습니다.
              전원 · 네트워크 · 유동인구 · 설치 조건처럼 현장 설명에만 적힌 내용을 읽어
              맞는 곳을 찾아 드립니다.
            </p>
          </div>
        </div>

        <!-- 입력 -->
        <form class="ask" @submit.prevent="run">
          <label class="ask-label" for="match-query">검증하려는 것을 그대로 적어 주세요</label>
          <textarea
            id="match-query"
            v-model="query"
            class="ask-input"
            rows="4"
            :maxlength="MAX_QUERY"
            :placeholder="PLACEHOLDER"
            @keydown.meta.enter="run"
            @keydown.ctrl.enter="run"
          ></textarea>

          <div class="ask-row">
            <label class="field">
              <span class="field-label">예산 (원)</span>
              <input v-model="budget" type="number" min="0" step="10000" class="field-input" placeholder="3000000" />
            </label>
            <label class="field">
              <span class="field-label">기간 (개월)</span>
              <input v-model="months" type="number" min="1" max="24" class="field-input" placeholder="3" />
            </label>

            <span class="counter" :class="{ near: query.length > MAX_QUERY - 100 }">
              {{ query.length }} / {{ MAX_QUERY }}
            </span>

            <button type="submit" class="btn btn-primary ask-btn" :disabled="loading || !query.trim()">
              <Icon name="sparkle" :size="16" />
              {{ loading ? '현장을 읽는 중…' : '현장 찾기' }}
            </button>
          </div>

          <!-- 무엇을 적어야 할지 모르는 사람을 위한 출발점 -->
          <div v-if="!ran" class="examples">
            <span class="ex-label">예시</span>
            <button v-for="(ex, i) in EXAMPLES" :key="i" type="button" class="ex-chip" @click="useExample(ex)">
              {{ ex.short }}
            </button>
          </div>
        </form>

        <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>

        <!-- 로딩 -->
        <div v-if="loading" class="result-area">
          <p class="progress-line">{{ progressText }}</p>
          <div v-for="i in 3" :key="i" class="skeleton-match"></div>
        </div>

        <!-- 폴백 안내 : AI 가 죽어도 화면이 비지 않는다 -->
        <div v-else-if="fellBack" class="result-area">
          <div class="fallback-note" role="status">
            <strong>AI 매칭을 사용할 수 없어 기본 추천을 보여 드립니다.</strong>
            <span>조건을 읽지 않고 산업군과 실증 실적만으로 고른 결과입니다.</span>
          </div>
          <div class="course-grid">
            <CourseCard v-for="c in fallbackSlots" :key="c.id" :course="c" />
          </div>
        </div>

        <!-- 결과 -->
        <div v-else-if="results" class="result-area">
          <div class="result-head">
            <p class="result-summary">{{ results.summary }}</p>
            <span class="result-stamp">
              {{ results.model }} · {{ (results.elapsedMs / 1000).toFixed(1) }}초
            </span>
          </div>

          <div v-if="results.matches.length" class="match-list">
            <MatchResultCard
              v-for="m in results.matches"
              :key="m.courseId"
              :match="m"
              :slot="slotOf(m.courseId)"
            />
          </div>

          <p v-else class="empty-text">
            조건에 맞는 현장을 찾지 못했습니다. 조건을 조금 넓혀 다시 시도해 보세요.
          </p>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
/**
 * AI 실증 매칭
 *
 * 계약은 recommend-service/AI-MATCHING.md 에 있고, 백엔드 구현 전까지는 스텁이 답한다.
 * 이 화면은 어느 쪽이 답하는지 모른다 — api/match.js 가 감춘다.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import Icon from '@/components/Icon.vue'
import CourseCard from '@/components/CourseCard.vue'
import MatchResultCard from '@/components/MatchResultCard.vue'
import { matchApi } from '@/api/match.js'
import { useCourseStore } from '@/store/course.js'
import { primeMyEnrollments } from '@/domain/myEnrollments.js'
import { apiErrorMessage } from '@/domain/pocket.js'

const MAX_QUERY = 1000

const PLACEHOLDER =
  '예) 무인 주문 로봇을 3개월간 검증하려 합니다. 220V 전원과 유선 인터넷이 필요하고, 하루 방문객 300명 이상인 매장이면 좋겠습니다.'

const EXAMPLES = [
  {
    short: '무인 주문 로봇',
    query:
      '무인 주문 로봇을 3개월간 검증하려 합니다. 220V 전원과 유선 인터넷이 필요하고, 하루 방문객 300명 이상인 매장이면 좋겠습니다.',
    budget: 3000000,
    months: 3
  },
  {
    short: '천장형 카메라',
    query: '천장에 카메라를 설치해 동선을 분석하려 합니다. 영상 데이터를 받을 수 있어야 합니다.',
    budget: 5000000,
    months: 2
  },
  {
    short: '스마트 진열대',
    query: '스마트 진열대를 매장에 놓고 판매 데이터를 비교하려 합니다. 진열 면적이 확보되어야 합니다.',
    budget: 2500000,
    months: 6
  }
]

/** 모델 호출은 2~3초가 걸린다. 침묵하면 멈춘 것처럼 보인다. */
const PROGRESS_STEPS = [
  '현장 설명을 읽는 중…',
  '조건과 대조하는 중…',
  '맞는 곳을 고르는 중…'
]

const courseStore = useCourseStore()
const { courses } = storeToRefs(courseStore)

const query = ref('')
const budget = ref('')
const months = ref('')

const loading = ref(false)
const ran = ref(false)
const results = ref(null)
const formError = ref('')
const fellBack = ref(false)

const isStub = matchApi.isStub

const progressStep = ref(0)
const progressText = computed(() => PROGRESS_STEPS[progressStep.value] ?? PROGRESS_STEPS[0])
let progressTimer = null

const slotById = computed(() => Object.fromEntries((courses.value || []).map((c) => [String(c.id), c])))
const slotOf = (id) => slotById.value[String(id)] ?? null

/** AI 를 못 쓸 때 보여줄 대체 — 조건은 못 읽지만 화면이 비지는 않는다 */
const fallbackSlots = computed(() =>
  [...(courses.value || [])]
    .sort((a, b) => Number(b.enrollmentCount ?? 0) - Number(a.enrollmentCount ?? 0))
    .slice(0, 3)
)

function useExample(ex) {
  query.value = ex.query
  budget.value = String(ex.budget)
  months.value = String(ex.months)
}

function startProgress() {
  progressStep.value = 0
  progressTimer = setInterval(() => {
    progressStep.value = Math.min(progressStep.value + 1, PROGRESS_STEPS.length - 1)
  }, 700)
}
function stopProgress() {
  clearInterval(progressTimer)
  progressTimer = null
}

async function run() {
  const text = query.value.trim()
  formError.value = ''

  // 서버도 400 을 주지만, 왕복을 기다리게 할 이유가 없다
  if (!text) {
    formError.value = '검증하려는 내용을 적어 주세요.'
    return
  }
  if (text.length > MAX_QUERY) {
    formError.value = `${MAX_QUERY}자 이내로 적어 주세요.`
    return
  }

  loading.value = true
  fellBack.value = false
  results.value = null
  startProgress()

  try {
    const body = { query: text, limit: 5 }
    if (Number(budget.value) > 0) body.budget = Number(budget.value)
    if (Number(months.value) > 0) body.durationMonths = Number(months.value)

    const res = await matchApi.search(body, courses.value)

    // 응답이 계약과 다르면 조용히 비는 대신 그렇다고 말한다
    if (!res || !Array.isArray(res.matches)) {
      throw Object.assign(new Error('bad shape'), { shape: true })
    }
    results.value = res
    ran.value = true
  } catch (e) {
    const status = e?.response?.status

    // 503 은 계약에 있는 상황이다 — 오류가 아니라 폴백으로 다룬다
    if (status === 503) {
      fellBack.value = true
      ran.value = true
    } else if (e.shape) {
      formError.value = '응답 형식이 예상과 다릅니다. 백엔드 명세를 확인해 주세요.'
    } else if (status === 429) {
      const wait = e?.response?.data?.retryAfterSec
      formError.value = wait
        ? `요청이 많습니다. ${wait}초 후 다시 시도해 주세요.`
        : '요청이 많습니다. 잠시 후 다시 시도해 주세요.'
    } else {
      formError.value = apiErrorMessage(e, '매칭에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    }
  } finally {
    stopProgress()
    loading.value = false
  }
}

onMounted(() => {
  // 스텁이 훑을 원본이자, 결과 카드에 제목·금액을 붙일 출처
  if (!courses.value?.length) courseStore.fetchCourses()
  primeMyEnrollments()
})

onBeforeUnmount(stopProgress)
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

.main-content { min-width: 0; }

.content-header { margin-bottom: 24px; }

.page-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.04em;
  color: var(--color-text-primary);
}

/* 스텁으로 도는 동안 그 사실을 숨기지 않는다 */
.stub-tag {
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  border: 1px dashed var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-text-muted);
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0;
}

.page-subtitle {
  margin-top: 10px;
  max-width: 62ch;
  font-size: 14.5px;
  line-height: 1.7;
  color: var(--color-text-secondary);
}

/* 입력 */
.ask {
  padding: 20px 22px;
  border-radius: var(--radius-xl);
  background: var(--glass-bg);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-edge);
  box-shadow: var(--shadow-glass);
}

.ask-label {
  display: block;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-secondary);
}

.ask-input {
  width: 100%;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  font-family: inherit;
  font-size: 14.5px;
  line-height: 1.7;
  color: var(--color-text-primary);
  resize: vertical;
  transition: var(--transition);
}
.ask-input::placeholder { color: var(--color-text-muted); }
.ask-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.ask-row {
  margin-top: 14px;
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.field { display: flex; flex-direction: column; gap: 5px; }
.field-label {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--color-text-muted);
}
.field-input {
  width: 130px;
  padding: 9px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  font-size: 13.5px;
  color: var(--color-text-primary);
}
.field-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.counter {
  margin-left: auto;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--color-text-muted);
}
.counter.near { color: var(--color-danger); font-weight: 600; }

.ask-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  white-space: nowrap;
}

.examples {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.ex-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
}
.ex-chip {
  padding: 6px 13px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-text-secondary);
  transition: var(--transition);
}
.ex-chip:hover {
  border-color: var(--color-primary);
  color: var(--color-link);
}

.form-error {
  margin-top: 12px;
  padding: 11px 14px;
  border-radius: var(--radius-md);
  background: #FDECEC;
  color: #A32020;
  font-size: 13.5px;
  font-weight: 600;
}

/* 결과 */
.result-area { margin-top: 28px; }

.result-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.result-summary {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
}
/* 어떤 모델이 얼마나 걸려 판단했는지 — 근거이자 감사 기록 */
.result-stamp {
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  color: var(--color-text-muted);
}

.match-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.progress-line {
  margin-bottom: 14px;
  font-size: 13.5px;
  color: var(--color-text-secondary);
}

.skeleton-match {
  height: 168px;
  margin-bottom: 14px;
  border-radius: var(--radius-xl);
  background: linear-gradient(90deg, #f2f2f5 25%, #e6e6eb 50%, #f2f2f5 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer { to { background-position: -200% 0; } }

.fallback-note {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  background: #FDF3EC;
  color: #7A3E0C;
  font-size: 13.5px;
  line-height: 1.6;
}

.course-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.empty-text {
  padding: 60px 0;
  text-align: center;
  font-size: 15px;
  color: var(--color-text-muted);
}

@media (max-width: 992px) {
  .page-layout { grid-template-columns: 1fr; }
  .course-grid { grid-template-columns: 1fr; }
  .counter { margin-left: 0; }
}

@media (prefers-reduced-transparency: reduce) {
  .ask {
    background: var(--color-bg-primary);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    border-color: var(--color-border);
  }
}
</style>
