/**
 * 내 신청 이력 — 어느 슬롯을 이미 신청했는지
 *
 * 목록·랜딩·추천 세 화면이 각자 조회하면 같은 요청이 세 번 나간다.
 * 한 번 받아 캐시해 두고 화면들이 같이 본다.
 *
 * 백엔드에는 "이 슬롯을 내가 신청했나" 를 묻는 API 가 없다.
 * GET /api/enrollments/my 로 내 전체 목록을 받아 courseId 로 대조한다.
 */
import { reactive, ref } from 'vue'
import { enrollmentApi } from '@/api/enrollment.js'

/** courseId -> 신청 상태 (PENDING | ACTIVE | CANCELLED) */
const byCourse = reactive({})

const loaded = ref(false)
let inflight = null

function unwrap(payload) {
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload)) return payload
  return []
}

/**
 * 한 번만 받아 캐시한다. 여러 화면이 동시에 불러도 요청은 하나다.
 * 실패해도 화면은 그대로 동작한다 — 표시가 안 붙을 뿐이다.
 */
export function primeMyEnrollments({ force = false } = {}) {
  if (force) {
    loaded.value = false
    inflight = null
  }
  if (loaded.value) return Promise.resolve()
  if (inflight) return inflight

  inflight = enrollmentApi
    .getMyEnrollments()
    .then((res) => {
      for (const key of Object.keys(byCourse)) delete byCourse[key]
      for (const item of unwrap(res.data)) {
        const id = item?.courseId ?? item?.course_id
        if (id != null) byCourse[id] = item.status ?? 'ACTIVE'
      }
      loaded.value = true
    })
    .catch((e) => {
      // 호스트 계정은 신청 목록이 없다(403/500). 조용히 넘긴다.
      console.warn('[PoCket] 내 신청 이력 조회 실패:', e?.response?.status)
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}

/** 이 슬롯의 내 신청 상태. 신청한 적 없으면 null */
export function myStatusOf(course) {
  const id = course?.id ?? course
  return id == null ? null : byCourse[id] ?? null
}

/** 취소되지 않은 신청이 있는가 (목록에서 '신청함' 을 붙일 기준) */
export function isMine(course) {
  const s = myStatusOf(course)
  return s === 'PENDING' || s === 'ACTIVE'
}

/** 신청 직후 등 캐시를 무효화해야 할 때 */
export function refreshMyEnrollments() {
  return primeMyEnrollments({ force: true })
}
