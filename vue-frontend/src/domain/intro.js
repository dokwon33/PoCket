/**
 * 진입 포털이 화면을 덮고 있는지 여부.
 *
 * 포털이 전체화면을 가리는 동안 히어로의 카운트업이 뒤에서 돌아버리면,
 * 문이 열렸을 때는 이미 최종 숫자만 남는다. 그래서 포털 상태를 공유한다.
 */
import { ref } from 'vue'

export const portalActive = ref(false)
