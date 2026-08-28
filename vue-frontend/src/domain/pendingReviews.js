/**
 * 아직 확인하지 않은 확정 실증 건수
 *
 * 실증이 확정되면 사용자가 알아야 한다. 결제가 끝났고 현장에 나갈 차례라는
 * 뜻이기 때문이다. 그래서 내비게이션에 건수를 띄운다.
 *
 * 기준이 '평가를 남겼는가' 가 아니라 **'확인했는가'** 인 이유:
 * 앞의 기준으로는 확정 내용을 이미 본 뒤에도 평가를 쓰기 전까지 숫자가 내려가지
 * 않았다. 알림이 아니라 밀린 숙제 표시가 된다. 알림은 확인하면 꺼져야 한다.
 * 평가 유도는 '내 실증' 카드에 남는 '평가 대기' 표시가 맡는다.
 *
 * GET /api/reviews/me/pending 은 이미 있는 API 다. 이 API 는 설계상 스타트업
 * 전용이라(review_service.get_pending 이 자기 신청 건만 훑는다) 호스트에게는
 * 언제나 빈 배열이 온다. 배지도 스타트업에게만 보여준다.
 */
import { computed, ref } from 'vue'
import { reviewApi } from '@/api/review.js'
import { seenIds } from '@/domain/seenEnrollments.js'

/** 평가를 남기지 않은 확정 건의 enrollmentId 목록 (확인 여부와 무관) */
export const pendingEnrollmentIds = ref([])

/**
 * 배지에 찍히는 수 — 확정됐고 아직 **확인하지 않은** 건.
 * 확인 목록이 바뀌면 이 값도 따라 바뀐다.
 */
export const pendingReviewCount = computed(
  () => pendingEnrollmentIds.value.filter((id) => !seenIds.value.has(String(id))).length
)

const loaded = ref(false)
let inflight = null

/**
 * 한 번만 받아 캐시한다. 헤더와 사이드바가 동시에 불러도 요청은 하나다.
 * 실패해도 조용히 넘어간다 — 배지가 안 붙을 뿐 화면은 그대로 동작한다.
 */
export function primePendingReviews({ force = false } = {}) {
  if (force) {
    loaded.value = false
    inflight = null
  }
  if (loaded.value) return Promise.resolve()
  if (inflight) return inflight

  inflight = reviewApi
    .myPending()
    .then((res) => {
      const list = Array.isArray(res.data) ? res.data : res.data?.data
      pendingEnrollmentIds.value = Array.isArray(list)
        ? list.map((r) => r?.enrollmentId).filter((v) => v != null)
        : []
      loaded.value = true
    })
    .catch((e) => {
      pendingEnrollmentIds.value = []
      console.warn('[PoCket] 확정 실증 건수 조회 실패:', e?.response?.status)
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}

/** 평가를 남기거나 지운 직후처럼 목록이 달라졌을 때 */
export function refreshPendingReviews() {
  return primePendingReviews({ force: true })
}

/** 로그아웃 시 다음 사용자에게 남지 않도록 */
export function clearPendingReviews() {
  pendingEnrollmentIds.value = []
  loaded.value = false
  inflight = null
}
