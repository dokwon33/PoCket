import { defineStore } from 'pinia'
import { ref } from 'vue'
import { courseApi } from '@/api/course.js'
import { CATEGORIES } from '@/domain/pocket.js'
import { primeHosts } from '@/domain/hosts.js'

export const ALL_CATEGORIES = 'ALL'
export const ALL_PRICES = 'ALL'
export const DEFAULT_SORT = 'default'

/**
 * 정렬 기준
 *
 * "최신순" 은 넣지 않는다. course-service 는 createdAt 을 내려주지만
 * 지금 등록된 슬롯의 createdAt 이 사실상 한 시점에 몰려 있어
 * 최신순을 눌러도 순서가 바뀌지 않는다. 동작하지 않는 버튼은 두지 않는다.
 */
export const SORT_OPTIONS = [
  { code: DEFAULT_SORT, label: '기본순' },
  { code: 'price-asc', label: '실증비 낮은순' },
  { code: 'price-desc', label: '실증비 높은순' },
  { code: 'runs-desc', label: '실증 많은순' }
]

/**
 * 실증비 구간
 *
 * 경계는 실제 등록된 슬롯 분포를 보고 잡았다. 구간마다 슬롯이 고르게 들어가야
 * 필터가 쓸모 있다. 한 구간에 몰리면 누른 의미가 없다.
 */
export const PRICE_BANDS = [
  { code: ALL_PRICES, label: '전체', min: 0, max: Infinity },
  { code: 'under-100', label: '100만 미만', min: 0, max: 1_000_000 },
  { code: '100-200', label: '100만 ~ 200만', min: 1_000_000, max: 2_000_000 },
  { code: '200-350', label: '200만 ~ 350만', min: 2_000_000, max: 3_500_000 },
  { code: 'over-350', label: '350만 이상', min: 3_500_000, max: Infinity }
]

const bandByCode = Object.fromEntries(PRICE_BANDS.map((b) => [b.code, b]))

/** 코드에 해당하는 구간. 모르는 코드는 '전체' 로 떨어진다. */
export function priceBand(code) {
  return bandByCode[code] || bandByCode[ALL_PRICES]
}

export const useCourseStore = defineStore('course', () => {
  const courses = ref([])
  const selectedCourse = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // 필터는 라벨이 아니라 enum 코드로 관리한다.
  // 라벨로 비교하면 라벨을 바꾸는 순간 필터가 조용히 깨진다.
  const selectedCategory = ref(ALL_CATEGORIES)

  // 탐색 조건. 화면을 옮겼다 돌아와도 유지된다.
  const query = ref('')
  const selectedPriceBand = ref(ALL_PRICES)
  const sortBy = ref(DEFAULT_SORT)

  const categoryFilters = [
    { code: ALL_CATEGORIES, label: '전체' },
    ...CATEGORIES.map(({ code, label }) => ({ code, label }))
  ]

  // 백엔드 응답을 그대로 쓴다. category 는 enum 코드로 보존하고,
  // 사람이 읽는 라벨은 화면에서 domain/pocket.js 로 붙인다.
  function normalizeCourse(course) {
    if (!course || typeof course !== 'object') return course

    return {
      ...course,
      category: course.category ? String(course.category).toUpperCase() : '',
      enrollmentCount: Number(course.enrollmentCount ?? course.enrollment_count ?? 0)
    }
  }

  function unwrap(payload) {
    if (Array.isArray(payload?.data)) return payload.data
    if (Array.isArray(payload)) return payload
    return []
  }

  async function fetchCourses() {
    loading.value = true
    error.value = null

    try {
      const res = await courseApi.getAll()
      courses.value = unwrap(res.data).map(normalizeCourse)
      primeHosts(courses.value)
    } catch (e) {
      console.error('[CourseStore] fetchCourses failed:', e)
      error.value = '테스트베드 목록을 불러오지 못했습니다.'
      courses.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchCourse(id) {
    loading.value = true
    error.value = null

    try {
      const res = await courseApi.getById(id)
      const raw =
        res.data?.data && typeof res.data.data === 'object'
          ? res.data.data
          : res.data

      selectedCourse.value = normalizeCourse(raw)
      primeHosts([selectedCourse.value])
    } catch (e) {
      console.error('[CourseStore] fetchCourse failed:', e)
      error.value = '실증 슬롯 정보를 불러오지 못했습니다.'
      selectedCourse.value = null
    } finally {
      loading.value = false
    }
  }

  // 주소창에서도 들어오는 값이라 모르는 코드는 '전체' 로 떨어뜨린다.
  // 검증이 없으면 ?cat=xxx 하나로 목록이 통째로 빈다.
  function setCategory(code) {
    selectedCategory.value = categoryFilters.some((c) => c.code === code) ? code : ALL_CATEGORIES
  }

  function setQuery(text) {
    query.value = String(text ?? '')
  }

  function setPriceBand(code) {
    selectedPriceBand.value = bandByCode[code] ? code : ALL_PRICES
  }

  function setSort(code) {
    sortBy.value = SORT_OPTIONS.some((s) => s.code === code) ? code : DEFAULT_SORT
  }

  /** 조건을 모두 기본값으로 되돌린다 */
  function resetFilters() {
    selectedCategory.value = ALL_CATEGORIES
    query.value = ''
    selectedPriceBand.value = ALL_PRICES
    sortBy.value = DEFAULT_SORT
  }

  return {
    courses,
    selectedCourse,
    loading,
    error,
    categoryFilters,
    selectedCategory,
    query,
    selectedPriceBand,
    sortBy,
    normalizeCourse,
    fetchCourses,
    fetchCourse,
    setCategory,
    setQuery,
    setPriceBand,
    setSort,
    resetFilters
  }
})
