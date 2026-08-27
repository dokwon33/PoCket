import api from './index.js'

/**
 * 결제 조회
 *
 * 결제 "실행"은 프론트에서 할 수 없다. POST /api/payments/internal/request 는
 * service.read 스코프(서비스 간 토큰)를 요구하며, 신청 처리 중 enrollment-service 가
 * 대신 호출한다. 프론트에 열려 있는 것은 조회 둘뿐이다.
 */
export const paymentApi = {
  listByUser(userId) {
    return api.get(`/api/payments/user/${userId}`)
  },
  getById(paymentId) {
    return api.get(`/api/payments/${paymentId}`)
  }
}
