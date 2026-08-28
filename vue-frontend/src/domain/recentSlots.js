/**
 * 최근 본 실증 슬롯
 *
 * 실증 장소를 고르는 일은 한 번에 끝나지 않는다. 몇 군데를 오가며 비교하다
 * 목록으로 돌아오면 방금 보던 슬롯을 다시 찾아 들어가야 했다.
 *
 * 백엔드에 조회 이력 API 가 없으므로 브라우저에 남긴다.
 * 그래서 이 기록은 **이 브라우저에만** 있고 기기를 옮기면 따라가지 않는다.
 *
 * 제목·금액을 통째로 저장해 두는 이유:
 * course-service 에 슬롯 수정 API 가 없다(PUT 미구현). 한 번 등록된 슬롯의
 * 내용은 바뀌지 않으므로 스냅숏이 낡을 일이 없고, 목록을 받아오기 전에도
 * 바로 그릴 수 있다.
 */
import { ref } from 'vue'

const KEY = 'pocket.recent-slots.v1'
const LIMIT = 6

/** 스토리지를 못 쓰는 환경(시크릿 모드·차단 설정)에서도 화면은 그대로 동작해야 한다 */
function readAll() {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((s) => s && s.id != null) : []
  } catch {
    return []
  }
}

function writeAll(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // 용량 초과나 쓰기 차단. 기록을 못 남길 뿐 화면은 계속 쓸 수 있다.
  }
}

export const recentSlots = ref(readAll())

/** 상세를 열었을 때 부른다. 이미 있으면 맨 앞으로 끌어올린다. */
export function rememberSlot(course) {
  const id = course?.id
  if (id == null) return

  const entry = {
    id,
    title: course.title ?? '',
    price: Number(course.price ?? 0),
    category: course.category ?? '',
    instructorId: course.instructorId ?? course.instructor_id ?? null
  }

  const next = [entry, ...recentSlots.value.filter((s) => String(s.id) !== String(id))].slice(0, LIMIT)
  recentSlots.value = next
  writeAll(next)
}

/** 목록에서 지금 보고 있는 슬롯은 '최근 본' 에서 빼고 보여줄 때 쓴다 */
export function recentExcept(id) {
  return recentSlots.value.filter((s) => String(s.id) !== String(id))
}

export function clearRecentSlots() {
  recentSlots.value = []
  writeAll([])
}
