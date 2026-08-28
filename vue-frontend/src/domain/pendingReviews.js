/**
 * 남길 차례인 평가 건수
 *
 * 양면 시장에서 평가는 저절로 쌓이지 않는다. 실증이 끝나도 사용자가 평가
 * 화면까지 스스로 찾아가지 않으면 후기는 영영 비어 있고, 다음 사람이 장소를
 * 고를 근거도 없다. 그래서 "남길 차례" 를 내비게이션이 먼저 말한다.
 *
 * GET /api/reviews/me/pending 은 이미 있는 API 다 (내 실증 화면에서만 쓰고 있었다).
 * 백엔드는 그대로 두고 호출 지점만 넓혔다.
 *
 * 이 API 는 설계상 스타트업 전용이다. review_service.get_pending 이 자기
 * 신청 건만 훑고 호스트가 등록한 슬롯은 건너뛰므로, 호스트 계정에서는 항상
 * 빈 배열이 온다. 배지도 스타트업에게만 보여준다.
 */
import { ref } from 'vue'
import { reviewApi } from '@/api/review.js'

export const pendingReviewCount = ref(0)

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
      pendingReviewCount.value = Array.isArray(list) ? list.length : 0
      loaded.value = true
    })
    .catch((e) => {
      pendingReviewCount.value = 0
      console.warn('[PoCket] 평가 대기 건수 조회 실패:', e?.response?.status)
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}

/** 평가를 남기거나 지운 직후처럼 숫자가 달라졌을 때 */
export function refreshPendingReviews() {
  return primePendingReviews({ force: true })
}

/** 로그아웃 시 다음 사용자에게 남지 않도록 */
export function clearPendingReviews() {
  pendingReviewCount.value = 0
  loaded.value = false
  inflight = null
}
