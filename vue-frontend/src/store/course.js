import { defineStore } from 'pinia'
import { ref } from 'vue'
import { courseApi } from '@/api/course.js'
import { CATEGORIES } from '@/domain/pocket.js'

export const ALL_CATEGORIES = 'ALL'

export const useCourseStore = defineStore('course', () => {
  const courses = ref([])
  const selectedCourse = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // 필터는 라벨이 아니라 enum 코드로 관리한다.
  // 라벨로 비교하면 라벨을 바꾸는 순간 필터가 조용히 깨진다.
  const selectedCategory = ref(ALL_CATEGORIES)

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
    } catch (e) {
      console.error('[CourseStore] fetchCourse failed:', e)
      error.value = '실증 슬롯 정보를 불러오지 못했습니다.'
      selectedCourse.value = null
    } finally {
      loading.value = false
    }
  }

  function setCategory(code) {
    selectedCategory.value = code
  }

  return {
    courses,
    selectedCourse,
    loading,
    error,
    categoryFilters,
    selectedCategory,
    normalizeCourse,
    fetchCourses,
    fetchCourse,
    setCategory
  }
})
