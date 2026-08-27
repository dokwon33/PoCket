import axios from 'axios'
import { useAuthStore } from '@/store/auth.js'
import { markAuthExpired } from '@/domain/session.js'

/**
 * 상호 평가 서비스 (review-service)
 *
 * 다른 API 와 달리 **게이트웨이를 거치지 않고** 브라우저가 8090 을 직접 호출한다.
 * 그래서 baseURL 이 따로 필요하다. 토큰은 이 서비스가 직접 검증하므로
 * Authorization 헤더는 기존과 동일하게 붙인다. CORS 는 서비스가 허용해 준다.
 */
const BASE_URL = import.meta.env.VITE_REVIEW_SERVICE_URL || 'http://localhost:8090'

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

client.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`
  }
  return config
})

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      console.error('[ReviewAPI] 401 Unauthorized', err.config?.url)
      markAuthExpired()
    }
    return Promise.reject(err)
  }
)

export const reviewApi = {
  /** 평가 등록. revieweeId 는 호스트가 평가할 때만 필수 */
  create({ enrollmentId, revieweeId, rating, comment }) {
    return client.post('/api/reviews', { enrollmentId, revieweeId, rating, comment })
  },
  update(reviewId, { rating, comment }) {
    return client.put(`/api/reviews/${reviewId}`, { rating, comment })
  },
  remove(reviewId) {
    return client.delete(`/api/reviews/${reviewId}`)
  },

  /** 내가 아직 남기지 않은 확정 실증 건 (스타트업 입장) */
  myPending() {
    return client.get('/api/reviews/me/pending')
  },
  myWritten() {
    return client.get('/api/reviews/me/written')
  },

  /* 아래 셋은 공개 — 로그인 없이도 조회된다 */
  receivedBy(userId) {
    return client.get(`/api/reviews/user/${userId}`)
  },
  reputation(userId) {
    return client.get(`/api/reviews/user/${userId}/reputation`)
  },
  byEnrollment(enrollmentId) {
    return client.get(`/api/reviews/enrollment/${enrollmentId}`)
  }
}
