/**
 * 세션 만료 표시
 *
 * 401 이 왔다는 사실만 들고 있는 아주 작은 상태.
 *
 * 개발 중에는 401 이 떠도 로그인 화면으로 튕기지 않는다 — 리다이렉트되는 순간
 * 네트워크 탭과 콘솔이 날아가서 무엇이 401 을 냈는지 볼 수 없기 때문이다.
 * 대신 이 플래그를 세워서, 화면이 "데이터가 없음"과 "받아오지 못함"을 구분해
 * 말할 수 있게 한다. 자동 로그아웃은 운영 빌드에서만 동작한다.
 */
import { ref } from 'vue'

export const authExpired = ref(false)

export function markAuthExpired() {
  authExpired.value = true
}

export function clearAuthExpired() {
  authExpired.value = false
}
