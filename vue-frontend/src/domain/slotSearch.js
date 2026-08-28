/**
 * 슬롯 탐색 — 검색 · 구간 · 정렬
 *
 * course-service 의 GET /api/courses 는 파라미터를 받지 않는다.
 * 컨트롤러 시그니처가 getAllCourses() 로 인자가 없어서 page·size·q 를 실어 보내도
 * 바인딩될 자리가 없다. 대신 등록된 슬롯 전체를 한 번에 내려주므로
 * 검색·필터·정렬은 모두 받아온 배열 위에서 한다.
 *
 * 여기 있는 함수는 전부 순수 함수다. 입력 배열을 바꾸지 않는다.
 */
import { priceBand } from '@/store/course.js'
import { category } from '@/domain/pocket.js'
import { hostName } from '@/domain/hosts.js'

/** 검색 비교용으로 다듬는다 — 대소문자와 앞뒤 공백을 없앤다 */
function norm(value) {
  return String(value ?? '').toLowerCase().trim()
}

/**
 * 한 슬롯이 검색어에 걸리는가.
 *
 * 제목·설명뿐 아니라 산업군 라벨과 호스트 이름도 본다.
 * 사용자는 "물류" 나 "강남" 으로도 찾으려 하지, 제목에 든 단어만 치지 않는다.
 */
export function matchesQuery(slot, needle) {
  const q = norm(needle)
  if (!q) return true

  const haystack = [
    slot?.title,
    slot?.description,
    category(slot?.category).label,
    hostName(slot)
  ]

  return haystack.some((field) => norm(field).includes(q))
}

/** 실증비가 구간 안에 드는가. 구간 코드가 '전체' 면 항상 참이다. */
export function matchesPrice(slot, bandCode) {
  const band = priceBand(bandCode)
  const price = Number(slot?.price ?? 0)
  if (Number.isNaN(price)) return false
  return price >= band.min && price < band.max
}

const runsOf = (slot) => Number(slot?.enrollmentCount ?? slot?.enrollment_count ?? 0)
const priceOf = (slot) => Number(slot?.price ?? 0)

/**
 * 정렬한 새 배열을 돌려준다.
 *
 * 기본순은 서버가 준 순서를 그대로 둔다 — 서버 순서에도 의미가 있고,
 * 사용자가 아무것도 고르지 않았을 때 임의로 뒤섞을 이유가 없다.
 */
export function sortSlots(slots, sortBy) {
  const list = [...slots]

  switch (sortBy) {
    case 'price-asc':
      return list.sort((a, b) => priceOf(a) - priceOf(b))
    case 'price-desc':
      return list.sort((a, b) => priceOf(b) - priceOf(a))
    case 'runs-desc':
      return list.sort((a, b) => runsOf(b) - runsOf(a))
    default:
      return list
  }
}
