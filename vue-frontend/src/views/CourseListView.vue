<template>
  <div class="page-wrapper">
    <AppHeader />
    <div class="page-layout">
      <!-- 사이드바 -->
      <AppSidebar />

      <!-- 메인 -->
      <main class="main-content">
        <div class="content-header">
          <div>
            <h1 class="page-title">테스트베드 탐색</h1>
            <p class="page-subtitle" v-if="host">
              호스트 계정으로 등록한 실증 슬롯을 확인하고 새 슬롯을 추가할 수 있습니다.
            </p>
            <p class="page-subtitle" v-else>
              산업군별 실증 현장을 살펴보고 우리 제품에 맞는 테스트베드를 신청하세요.
            </p>
          </div>

          <router-link
            v-if="host"
            to="/testbeds/new"
            class="btn btn-primary create-course-btn"
          >
            실증 슬롯 등록
          </router-link>
        </div>

        <!-- 검색 · 정렬 -->
        <div class="explore-bar">
          <div class="search-box">
            <Icon name="search" :size="17" class="search-icon" />
            <input
              v-model="queryText"
              type="search"
              class="search-input"
              placeholder="현장 · 산업군 · 호스트로 검색"
              autocomplete="off"
              aria-label="실증 슬롯 검색"
            />
            <button
              v-if="queryText"
              type="button"
              class="search-clear"
              aria-label="검색어 지우기"
              @click="queryText = ''"
            >
              <Icon name="x" :size="13" />
            </button>
          </div>

          <label class="sort-box">
            <span class="sr-only">정렬 기준</span>
            <select v-model="sortCode" class="sort-select">
              <option v-for="opt in sortOptions" :key="opt.code" :value="opt.code">
                {{ opt.label }}
              </option>
            </select>
          </label>
        </div>

        <!-- 산업군 -->
        <div class="filter-bar">
          <button
            v-for="cat in categoryFilters"
            :key="cat.code"
            :class="['filter-chip', { active: selectedCategory === cat.code }]"
            @click="selectCategory(cat.code)"
          >
            {{ cat.label }}
          </button>
        </div>

        <!-- 실증비 구간 : 개수를 같이 보여준다. 눌러도 0건이면 누를 이유가 없다 -->
        <div class="filter-bar price-bar">
          <button
            v-for="band in priceBands"
            :key="band.code"
            :class="['filter-chip', 'chip-sm', { active: selectedPriceBand === band.code }]"
            :disabled="priceCounts[band.code] === 0 && selectedPriceBand !== band.code"
            @click="courseStore.setPriceBand(band.code)"
          >
            {{ band.label }}
            <span class="chip-count">{{ priceCounts[band.code] }}</span>
          </button>
        </div>

        <!-- 결과 요약 -->
        <div v-if="!loading && !error && !authExpired" class="result-line">
          <span class="result-count">{{ filteredSlots.length }}개 슬롯</span>
          <button v-if="filtersActive" type="button" class="reset-btn" @click="courseStore.resetFilters()">
            조건 초기화
          </button>
        </div>

        <!-- 로딩 -->
        <div v-if="loading" class="loading-grid">
          <div v-for="i in 6" :key="i" class="skeleton-card">
            <div class="skeleton-thumb"></div>
            <div class="skeleton-body">
              <div class="skeleton-line short"></div>
              <div class="skeleton-line"></div>
              <div class="skeleton-line medium"></div>
            </div>
          </div>
        </div>

        <!-- 인증 만료 : "데이터 없음" 과 구분해서 말한다 -->
        <SessionExpiredNotice v-else-if="authExpired" />

        <!-- 요청 실패도 "데이터 없음" 과 구분한다 -->
        <LoadFailedNotice
          v-else-if="error"
          title="테스트베드 목록을 불러오지 못했습니다"
          :message="error"
          @retry="courseStore.fetchCourses()"
        />

        <!-- 슬롯 그리드 -->
        <div v-else-if="filteredSlots.length" class="course-grid fade-in">
          <CourseCard
            v-for="slot in filteredSlots"
            :key="slot.id"
            :course="slot"
          />
        </div>

        <!-- 빈 상태 : 조건 때문에 비었는지, 원래 없는지를 구분해서 말한다 -->
        <div v-else class="empty-state">
          <template v-if="filtersActive">
            <p>조건에 맞는 실증 슬롯이 없습니다.</p>
            <button type="button" class="btn btn-secondary empty-action-btn" @click="courseStore.resetFilters()">
              조건 초기화
            </button>
          </template>

          <template v-else>
            <p>아직 등록된 실증 슬롯이 없습니다.</p>

            <router-link
              v-if="host"
              to="/testbeds/new"
              class="btn btn-primary empty-action-btn"
            >
              첫 실증 슬롯 등록하기
            </router-link>
          </template>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { primeMyEnrollments } from '@/domain/myEnrollments.js'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import CourseCard from '@/components/CourseCard.vue'
import Icon from '@/components/Icon.vue'
import SessionExpiredNotice from '@/components/SessionExpiredNotice.vue'
import LoadFailedNotice from '@/components/LoadFailedNotice.vue'
import { authExpired } from '@/domain/session.js'
import {
  useCourseStore,
  ALL_CATEGORIES,
  ALL_PRICES,
  DEFAULT_SORT,
  SORT_OPTIONS,
  PRICE_BANDS
} from '@/store/course.js'
import { useAuthStore } from '@/store/auth.js'
import { isHost } from '@/domain/pocket.js'
import { matchesPrice, matchesQuery, sortSlots } from '@/domain/slotSearch.js'

const courseStore = useCourseStore()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

// storeToRefs 로 꺼내야 반응성이 유지된다.
// 그냥 구조분해하면 loading 이 최초 값(false)으로 고정돼 스켈레톤이 뜨지 않는다.
const { loading, error, selectedCategory, courses, query, selectedPriceBand, sortBy } =
  storeToRefs(courseStore)

const categoryFilters = courseStore.categoryFilters
const sortOptions = SORT_OPTIONS
const priceBands = PRICE_BANDS

const host = computed(() => isHost(auth.user?.role))

// v-model 이 스토어를 직접 쓰지 않도록 액션을 거친다 (검증이 액션 안에 있다)
const queryText = computed({
  get: () => query.value,
  set: (value) => courseStore.setQuery(value)
})
const sortCode = computed({
  get: () => sortBy.value,
  set: (value) => courseStore.setSort(value)
})

/**
 * 산업군 + 검색어까지만 적용한 중간 집합.
 *
 * 실증비 구간 칩에 붙는 개수는 이 집합을 기준으로 센다.
 * 구간을 고른 뒤에 세면 고른 구간만 1 이상이고 나머지가 전부 0 이 되어
 * 다른 구간으로 옮겨갈 수가 없다.
 */
const basePool = computed(() => {
  if (!Array.isArray(courses.value)) return []
  return courses.value.filter(
    (c) =>
      // 필터는 enum 코드로 비교한다 (라벨 비교는 라벨 변경 시 조용히 깨진다)
      (selectedCategory.value === ALL_CATEGORIES || c.category === selectedCategory.value) &&
      matchesQuery(c, query.value)
  )
})

const priceCounts = computed(() =>
  Object.fromEntries(
    PRICE_BANDS.map((band) => [band.code, basePool.value.filter((c) => matchesPrice(c, band.code)).length])
  )
)

const filteredSlots = computed(() =>
  sortSlots(
    basePool.value.filter((c) => matchesPrice(c, selectedPriceBand.value)),
    sortBy.value
  )
)

const filtersActive = computed(
  () =>
    selectedCategory.value !== ALL_CATEGORIES ||
    query.value.trim() !== '' ||
    selectedPriceBand.value !== ALL_PRICES ||
    sortBy.value !== DEFAULT_SORT
)

function selectCategory(code) {
  courseStore.setCategory(code)
}

/* ------------------------------------------------------------------ *
 * 주소창 동기화
 *
 * 조건을 걸어둔 화면을 새로고침하거나 링크로 건네면 그대로 열려야 한다.
 * 스토어와 주소창 양쪽이 서로를 갱신하므로, 값이 이미 같으면 쓰지 않는 것으로
 * 순환을 끊는다. 플래그 대신 비교로 막는 편이 타이밍에 덜 의존한다.
 * ------------------------------------------------------------------ */

/** 우리가 쓰지 않는 쿼리(예: ?dev=1)는 건드리지 않고 남긴다 */
function queryFromState() {
  const { q: _q, cat: _cat, price: _price, sort: _sort, ...rest } = route.query
  const next = { ...rest }

  const text = query.value.trim()
  if (text) next.q = text
  if (selectedCategory.value !== ALL_CATEGORIES) next.cat = selectedCategory.value
  if (selectedPriceBand.value !== ALL_PRICES) next.price = selectedPriceBand.value
  if (sortBy.value !== DEFAULT_SORT) next.sort = sortBy.value

  return next
}

function sameQuery(a, b) {
  const keysA = Object.keys(a)
  return keysA.length === Object.keys(b).length && keysA.every((k) => String(a[k]) === String(b[k]))
}

function applyFromUrl() {
  const q = route.query
  courseStore.setQuery(typeof q.q === 'string' ? q.q : '')
  courseStore.setCategory(typeof q.cat === 'string' ? q.cat : ALL_CATEGORIES)
  courseStore.setPriceBand(typeof q.price === 'string' ? q.price : ALL_PRICES)
  courseStore.setSort(typeof q.sort === 'string' ? q.sort : DEFAULT_SORT)
}

watch([query, selectedCategory, selectedPriceBand, sortBy], () => {
  const next = queryFromState()
  if (sameQuery(next, route.query)) return
  // replace 라 뒤로가기가 필터 변경 하나하나를 되짚지 않는다
  router.replace({ query: next })
})

// 뒤로가기·앞으로가기로 주소가 바뀌었을 때 화면을 맞춘다
watch(
  () => route.query,
  (q) => {
    if (sameQuery(queryFromState(), q)) return
    applyFromUrl()
  }
)

onMounted(() => {
  applyFromUrl()

  // 알아듣지 못한 값(?cat=NONSENSE 등)은 상태에서 이미 걸러졌다.
  // 주소창까지 맞춰두지 않으면 화면은 '전체' 인데 URL 은 아니라고 말하는 상태가 남는다.
  const cleaned = queryFromState()
  if (!sameQuery(cleaned, route.query)) router.replace({ query: cleaned })

  courseStore.fetchCourses()
  // 어느 슬롯을 이미 신청했는지 카드에 표시하기 위해
  primeMyEnrollments()
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

/* 사이드바 */








/* 메인 */
.main-content {
  min-width: 0;
}

.content-header {
  margin-bottom: 28px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.04em;
  color: var(--color-text-primary);
}

.page-subtitle {
  margin-top: 8px;
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--color-text-secondary);
}

.create-course-btn {
  white-space: nowrap;
  text-decoration: none;
}

/* 검색 · 정렬 */
.explore-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: var(--color-text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 11px 38px 11px 40px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--glass-edge);
  background: var(--glass-bg-thin);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  box-shadow: inset 0 1px 0 var(--glass-highlight), var(--shadow-sm);
  font-size: 14px;
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
  transition: var(--transition);
}
.search-input::placeholder { color: var(--color-text-muted); }
.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: inset 0 1px 0 var(--glass-highlight), 0 0 0 3px var(--color-primary-light);
}
/* 브라우저 기본 X 는 유리 배경에서 형태가 어긋난다 — 우리 버튼을 쓴다 */
.search-input::-webkit-search-cancel-button { display: none; }

.search-clear {
  position: absolute;
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  transition: var(--transition);
}
.search-clear:hover { background: var(--color-border); color: var(--color-text-primary); }

.sort-box { flex-shrink: 0; }

.sort-select {
  height: 100%;
  padding: 11px 34px 11px 16px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--glass-edge);
  background: var(--glass-bg-thin);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  box-shadow: inset 0 1px 0 var(--glass-highlight), var(--shadow-sm);
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--color-text-secondary);
  cursor: pointer;
  appearance: none;
  /* 화살표는 배경 이미지로 — 외부 아이콘 없이 select 안에 넣는 유일한 방법 */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none' stroke='%235F6280' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  transition: var(--transition);
}
.sort-select:hover { color: var(--color-link); }

/* 필터 */
.filter-bar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 32px;
}

.filter-bar + .price-bar { margin-top: -22px; }

.chip-sm {
  padding: 7px 14px;
  font-size: 12.5px;
}

.chip-count {
  margin-left: 6px;
  font-variant-numeric: tabular-nums;
  opacity: 0.65;
}

.filter-chip:disabled {
  opacity: 0.42;
  cursor: not-allowed;
  transform: none;
  box-shadow: inset 0 1px 0 var(--glass-highlight), var(--shadow-sm);
}

/* 결과 요약 */
.result-line {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: -18px 0 18px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.result-count { font-variant-numeric: tabular-nums; }

.reset-btn {
  padding: 0;
  background: none;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-link);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.reset-btn:hover { color: var(--color-primary); }

.filter-chip {
  padding: 9px 18px;
  border-radius: var(--radius-pill);
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: -0.02em;
  border: 1px solid var(--glass-edge);
  background: var(--glass-bg-thin);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  box-shadow: inset 0 1px 0 var(--glass-highlight), var(--shadow-sm);
  color: var(--color-text-secondary);
  transition: var(--transition);
  cursor: pointer;
}

.filter-chip:hover {
  color: var(--color-link);
  transform: translateY(-1px);
  box-shadow: inset 0 1px 0 var(--glass-highlight), var(--shadow-md);
}
.filter-chip:active { transform: scale(0.97); }

.filter-chip.active {
  background: var(--color-primary);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 1px 2px rgba(36,34,73,0.10), 0 6px 18px rgba(80,101,192,0.30);
}

/* 슬롯 그리드 */
.course-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

/* 스켈레톤 */
.loading-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.skeleton-card {
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.skeleton-thumb {
  height: 120px;
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

.skeleton-line.medium {
  width: 70%;
}

@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}

/* 빈 상태 */
.empty-state {
  text-align: center;
  padding: 80px 0;
  color: var(--color-text-muted);
  font-size: 15px;
}

.empty-action-btn {
  display: inline-flex;
  margin-top: 16px;
  text-decoration: none;
}

@media (max-width: 992px) {
  .page-layout {
    grid-template-columns: 1fr;
  }

  .course-grid,
  .loading-grid {
    grid-template-columns: 1fr;
  }

  .content-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .explore-bar {
    flex-direction: column;
  }

  .sort-select { width: 100%; }
}

/* 투명도를 줄이도록 설정한 사용자에게는 유리를 불투명하게 —
   가드가 없으면 설정을 켜도 blur 와 반투명이 그대로 남는다. */
@media (prefers-reduced-transparency: reduce) {
  .filter-chip,
  .search-input,
  .sort-select {
    background-color: var(--color-bg-primary);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    border-color: var(--color-border);
  }
}
</style>
