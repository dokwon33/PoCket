/**
 * 호스트(테스트베드 제공자) 이름 해석
 *
 * course-service 의 응답에는 `instructorId` 만 있고 이름이 없다.
 * 백엔드를 고치지 않기로 했으므로, user-service 에서 이름을 한 번만 받아
 * 캐시해 두고 화면에서 이어 붙인다.
 *
 * 목록을 그릴 때마다 카드가 각자 요청하면 N+1 이 되므로,
 * 화면이 데이터를 받은 직후 primeHosts() 로 한 번에 채운다.
 */
import { reactive } from 'vue'
import { userApi } from '@/api/user.js'

const names = reactive({})
const inflight = new Map()

function idOf(course) {
  return course?.instructorId ?? course?.instructor_id ?? null
}

/** 사용자 id 로 이름을 한 번에 받아 캐시한다 (호스트 외 평가자 이름에도 쓴다) */
export async function primeUsers(ids) {
  const wanted = [...new Set((ids || []).filter((v) => v != null))].filter(
    (id) => !(id in names) && !inflight.has(id)
  )
  if (!wanted.length) return

  await Promise.all(
    wanted.map((id) => {
      const p = userApi
        .getById(id)
        .then((res) => {
          const body = res.data?.data ?? res.data
          if (body?.name) names[id] = body.name
        })
        .catch((e) => console.warn('[PoCket] 사용자 이름 조회 실패:', id, e?.response?.status))
        .finally(() => inflight.delete(id))
      inflight.set(id, p)
      return p
    })
  )
}

/** 캐시된 이름. 없으면 null (호출부가 대체 문구를 정한다) */
export function userName(id) {
  return names[id] ?? null
}

/** 캐시에 있으면 이름, 없으면 식별자로 대체. 절대 빈 문자열을 내지 않는다. */
export function hostName(course) {
  // 백엔드가 나중에 이름을 실어 보내면 그것을 우선 쓴다
  if (course?.instructorName) return course.instructorName

  const id = idOf(course)
  if (id == null) return '호스트 미상'
  return names[id] || `호스트 #${id}`
}

/** 목록에 등장하는 호스트 이름을 한 번에 받아 캐시한다. 실패해도 화면은 그대로 동작한다. */
export async function primeHosts(courses) {
  const ids = [...new Set((courses || []).map(idOf).filter((v) => v != null))].filter(
    (id) => !(id in names) && !inflight.has(id)
  )
  if (!ids.length) return

  await Promise.all(
    ids.map((id) => {
      const p = userApi
        .getById(id)
        .then((res) => {
          const body = res.data?.data ?? res.data
          if (body?.name) names[id] = body.name
        })
        .catch((e) => {
          console.warn('[PoCket] 호스트 이름 조회 실패:', id, e?.response?.status)
        })
        .finally(() => inflight.delete(id))
      inflight.set(id, p)
      return p
    })
  )
}
