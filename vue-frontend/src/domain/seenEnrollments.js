/**
 * 확인한 실증 건
 *
 * 지금까지 '내 실증' 배지는 **평가를 남겼는가**를 기준으로 삼았다.
 * 그래서 실증이 확정된 것을 이미 확인했어도, 평가를 쓰기 전까지는 숫자가
 * 영영 내려가지 않았다. 알림이라기보다 밀린 숙제 표시에 가까웠다.
 *
 * 알림은 "새로 생긴 일이 있다"를 알리는 것이고, 확인하면 꺼지는 게 맞다.
 * 그래서 기준을 **확인했는가**로 바꾼다. 평가 유도는 배지가 아니라
 * 카드에 남는 '평가 대기' 표시가 맡는다.
 *
 * 백엔드에 읽음 상태를 저장할 API 가 없어 브라우저에 남긴다.
 * 그래서 이 기록은 **이 브라우저에만** 있고 기기를 옮기면 따라가지 않는다.
 */
import { ref } from 'vue'

const PREFIX = 'pocket.seen-enrollments.v1'

/**
 * 같은 브라우저를 여러 계정이 쓸 수 있으므로 사용자별로 나눠 담는다.
 * 한 칸에 몰아 두면 A 가 확인한 건이 B 의 알림까지 꺼 버린다.
 */
function keyFor(userId) {
  return `${PREFIX}.${userId ?? 'anon'}`
}

/** 스토리지를 못 쓰는 환경(시크릿 모드·차단)에서도 화면은 그대로 동작해야 한다 */
function read(userId) {
  try {
    const raw = localStorage.getItem(keyFor(userId))
    const parsed = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(parsed) ? parsed.map(String) : [])
  } catch {
    return new Set()
  }
}

function write(userId, set) {
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify([...set]))
  } catch {
    // 용량 초과나 쓰기 차단. 기록을 못 남길 뿐 화면은 계속 쓸 수 있다.
  }
}

/** 현재 사용자의 확인 목록. 화면이 반응하도록 ref 로 들고 있는다. */
export const seenIds = ref(new Set())

let currentUserId = null

/** 로그인 직후·화면 진입 시 한 번 부른다 */
export function loadSeen(userId) {
  currentUserId = userId ?? null
  seenIds.value = read(currentUserId)
}

export function isSeen(enrollmentId) {
  return seenIds.value.has(String(enrollmentId))
}

/** 카드를 펼쳐 내용을 확인했을 때 */
export function markSeen(enrollmentId) {
  if (enrollmentId == null) return
  const id = String(enrollmentId)
  if (seenIds.value.has(id)) return

  // Set 을 직접 add 하면 참조가 그대로라 반응성이 걸리지 않는다
  const next = new Set(seenIds.value)
  next.add(id)
  seenIds.value = next
  write(currentUserId, next)
}

/** 로그아웃 시 — 다음 사용자에게 남지 않도록 메모리만 비운다 (저장분은 유지) */
export function clearSeenMemory() {
  currentUserId = null
  seenIds.value = new Set()
}
