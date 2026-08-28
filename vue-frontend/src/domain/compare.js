/**
 * 슬롯 비교함
 *
 * 실증 장소를 정하는 일은 금액 하나로 끝나지 않는다. 실증비 · 진행 실적 ·
 * 호스트 평판을 같이 놓고 봐야 하는데, 지금은 상세 페이지를 오가며
 * 기억에 의존해 비교해야 한다.
 *
 * 담아 둔 목록은 화면을 옮겨도 유지되지만 새로고침하면 비워진다.
 * 비교는 지금 이 자리에서 끝나는 일이라 남겨 둘 이유가 없다.
 */
import { computed, ref } from 'vue'

/** 나란히 놓고 읽을 수 있는 한계. 넘어가면 표가 아니라 목록이 된다. */
export const COMPARE_MAX = 3

const picked = ref([])

export const compareList = computed(() => picked.value)
export const compareCount = computed(() => picked.value.length)
export const compareFull = computed(() => picked.value.length >= COMPARE_MAX)

export function isPicked(course) {
  const id = course?.id ?? course
  return picked.value.some((s) => String(s.id) === String(id))
}

/**
 * 담거나 뺀다.
 * 이미 가득 찼는데 새 슬롯을 담으려 하면 아무 일도 하지 않고 false 를 돌려준다.
 * 호출부가 그 사실을 사용자에게 알린다 — 조용히 무시하면 버튼이 고장 난 것처럼 보인다.
 */
export function toggleCompare(course) {
  if (!course?.id) return false

  if (isPicked(course)) {
    picked.value = picked.value.filter((s) => String(s.id) !== String(course.id))
    return true
  }

  if (picked.value.length >= COMPARE_MAX) return false

  picked.value = [...picked.value, course]
  return true
}

export function removeCompare(id) {
  picked.value = picked.value.filter((s) => String(s.id) !== String(id))
}

export function clearCompare() {
  picked.value = []
}
