/**
 * AI 매칭 스텁
 *
 * 백엔드에 POST /api/recommend/match 가 아직 없다. 계약(recommend-service/AI-MATCHING.md)은
 * 확정했으므로 화면은 먼저 만들고, 응답만 여기서 흉내 낸다.
 *
 * 결과를 하드코딩하지 않는 이유:
 * 시연 중 누가 예시와 다른 문장을 넣으면 바로 들통난다. 그래서 실제로 받아온
 * 91개 슬롯의 설명문을 훑어 조건을 맞춰 본다. 문장을 '이해' 하지는 못하지만
 * 아무 입력에나 반응은 한다 — 그리고 이 스텁이 못 하는 일이 바로
 * 진짜 모델이 필요한 이유이기도 하다.
 *
 * 응답 모양은 실제 API 와 한 글자도 다르지 않다. 전환은 api/match.js 한 곳에서만
 * 일어나고 화면 코드는 손대지 않는다.
 */
import { categoryLabel } from '@/domain/pocket.js'

/**
 * 조건 사전
 *
 * 사용자가 쓸 법한 말(ask)과 슬롯 설명문에 나올 법한 말(has)을 따로 둔다.
 * 양쪽 어휘가 다르기 때문이다 — 스타트업은 "전기", 호스트는 "220V 콘센트"라고 쓴다.
 * 이 어휘 간극을 사전으로 메우는 것이 스텁의 한계이자, 모델이 필요한 지점이다.
 */
const CONDITIONS = [
  {
    key: 'power',
    label: '전원',
    ask: /220v|380v|전원|전기|콘센트|전력|배선/i,
    has: /220v|380v|콘센트|전력|전용선|전원|배선/i,
    matchedText: (m) => `전원 조건 충족 (${m})`,
    missText: '설명문에 전원 관련 언급이 없습니다'
  },
  {
    key: 'network',
    label: '네트워크',
    ask: /유선|인터넷|네트워크|와이파이|wi-?fi|기가|5g|lte|통신/i,
    has: /기가|유선망|와이파이|wi-?fi|5g|lte|네트워크|인터넷/i,
    matchedText: (m) => `네트워크 제공 (${m})`,
    missText: '네트워크 환경이 명시되어 있지 않습니다'
  },
  {
    key: 'traffic',
    label: '유동인구',
    ask: /방문객|유동인구|이용객|고객|사람|트래픽|명/i,
    has: /방문객|유동인구|이용객|일\s*평균|하루\s*\d/i,
    matchedText: (m) => `방문 규모 확인 (${m})`,
    missText: '유동인구 정보가 없습니다'
  },
  {
    key: 'space',
    label: '공간',
    ask: /면적|평|㎡|좌석|층|공간|자리|크기/i,
    has: /\d+\s*석|\d+\s*평|㎡|면적|\d+\s*층|매장|창고/i,
    matchedText: (m) => `공간 규모 명시 (${m})`,
    missText: '면적·좌석 정보가 없습니다'
  },
  {
    key: 'install',
    label: '설치',
    ask: /설치|거치|천장|벽면|고정|부착|배치/i,
    has: /천장|벽면|거치|설치|고정|배치/i,
    matchedText: (m) => `설치 조건 언급 (${m})`,
    missText: '설치 방식에 대한 언급이 없습니다'
  },
  {
    key: 'data',
    label: '데이터',
    ask: /데이터|로그|영상|cctv|센서|측정|수집|통계/i,
    has: /데이터|로그|영상|cctv|센서|측정|수집|통계/i,
    matchedText: (m) => `데이터 제공 (${m})`,
    missText: '실증 데이터 제공 여부가 불분명합니다'
  }
]

/** 시간대 제약은 '맞는 점' 이 아니라 늘 '걸리는 점' 으로 읽힌다 */
const TIME_LIMIT = /피크[^.,]*|야간[^.,]*|주말[^.,]*|평일[^.,]*|\d+~\d+시[^.,]*/i

const norm = (v) => String(v ?? '').toLowerCase()

/**
 * 설명문에서 조건에 걸린 '절' 을 통째로 오려 낸다.
 *
 * 글자 수로 잘라내면 "명 규모. 실증 전용 전원과 유선망을 제공하며, 운" 처럼
 * 앞뒤가 깨져 읽을 수 없는 조각이 나온다. 문장 부호로 나눈 뒤 걸린 절만
 * 통째로 꺼내야 사람이 읽을 수 있는 근거가 된다.
 */
function excerpt(text, regex) {
  const full = String(text ?? '')
  if (!regex.test(full)) return null

  const clauses = full
    .split(/(?<=[.!?])\s+|(?<=[,·])\s*/)
    .map((c) => c.trim())
    .filter(Boolean)

  const found = clauses.find((c) => regex.test(c))
  if (!found) return null

  const clean = found.replace(/^[^가-힣a-zA-Z0-9(]+/, '').replace(/[.,·\s]+$/, '')
  return clean.length > 42 ? `${clean.slice(0, 42)}…` : clean
}

/** 입력에서 "300명", "3개월", "500만원" 같은 수치 요구를 뽑는다 */
function parseNumbers(query) {
  const people = query.match(/(\d[\d,]*)\s*명/)
  const months = query.match(/(\d+)\s*(?:개월|달)/)
  return {
    people: people ? Number(people[1].replace(/,/g, '')) : null,
    months: months ? Number(months[1]) : null
  }
}

/** 슬롯 설명문에 적힌 방문객 수 */
function slotTraffic(description) {
  const m = String(description ?? '').match(/(\d[\d,]*)\s*명/)
  return m ? Number(m[1].replace(/,/g, '')) : null
}

function scoreSlot(slot, { asked, wanted, budget }) {
  const desc = slot.description || ''
  const matched = []
  const concerns = []

  // 1) 사용자가 물어본 조건만 본다. 묻지 않은 것을 맞췄다고 자랑하지 않는다.
  let hit = 0
  for (const cond of asked) {
    const piece = excerpt(desc, cond.has)
    if (piece) {
      hit += 1
      matched.push(cond.matchedText(piece))
    } else {
      concerns.push(cond.missText)
    }
  }

  // 2) 수치 요구 — 방문객
  if (wanted.people != null) {
    const actual = slotTraffic(desc)
    if (actual != null && actual >= wanted.people) {
      matched.push(`방문객 ${actual.toLocaleString()}명 (요청 ${wanted.people.toLocaleString()}명 이상)`)
      hit += 1
    } else if (actual != null) {
      concerns.push(`방문객 ${actual.toLocaleString()}명으로 요청하신 ${wanted.people.toLocaleString()}명에 못 미칩니다`)
    }
  }

  // 3) 예산
  const price = Number(slot.price ?? 0)
  let budgetScore = 0.5
  if (budget) {
    if (price <= budget) {
      budgetScore = 1
      matched.push(`실증비 ${price.toLocaleString()}원 · 예산 안에 들어옵니다`)
    } else {
      const over = (price - budget) / budget
      budgetScore = Math.max(0, 1 - over)
      concerns.push(`실증비가 예산보다 ${Math.round(over * 100)}% 높습니다`)
    }
  }

  // 4) 시간대 제약은 늘 짚어 준다 — 가서야 알면 늦다
  const timeNote = excerpt(desc, TIME_LIMIT)
  if (timeNote) concerns.push(`시간대 제약: ${timeNote}`)

  // 5) 실적은 보조 신호
  const runs = Number(slot.enrollmentCount ?? 0)
  const runScore = Math.min(runs / 30, 1)

  const condScore = asked.length ? hit / (asked.length + (wanted.people != null ? 1 : 0)) : 0.5
  // 상한을 0.95 로 둔다. 키워드로 맞춘 결과에 99% 를 붙이면 과신으로 읽히고,
  // 실제 모델이 붙을 때 점수가 오히려 낮아지는 역전이 생긴다.
  const score = Math.min(0.95, 0.6 * condScore + 0.25 * budgetScore + 0.15 * runScore)

  return { courseId: slot.id, score, matched, concerns, slot }
}

function buildReason(entry, asked) {
  const { matched, concerns, slot } = entry
  const parts = []

  if (matched.length) {
    const labels = asked.filter((c) => c.has.test(slot.description || '')).map((c) => c.label)
    parts.push(
      labels.length
        ? `${labels.join(' · ')} 조건을 충족하는 현장입니다.`
        : '요청하신 조건에 부합하는 현장입니다.'
    )
  } else {
    parts.push(`${categoryLabel(slot.category)} 현장이지만 요청 조건과 겹치는 설명이 적습니다.`)
  }

  const runs = Number(slot.enrollmentCount ?? 0)
  if (runs >= 20) parts.push(`실증을 ${runs}건 진행한 이력이 있습니다.`)

  if (concerns.length) parts.push(`다만 ${concerns[0]}.`.replace(/\.\.$/, '.'))

  return parts.join(' ')
}

/**
 * 실제 API 와 동일한 모양의 응답을 만든다.
 * @param {object} body  요청 본문 (query, budget, durationMonths, categories, limit)
 * @param {Array}  slots 이미 받아 둔 전체 슬롯 목록
 */
export function stubMatch(body, slots) {
  const started = Date.now()
  const query = String(body?.query ?? '')
  const q = norm(query)
  const limit = Math.min(Math.max(Number(body?.limit) || 5, 1), 10)

  const asked = CONDITIONS.filter((c) => c.ask.test(q))
  const wanted = parseNumbers(query)
  const budget = Number(body?.budget) || null

  let pool = Array.isArray(slots) ? slots.filter((s) => s && s.id != null) : []
  if (Array.isArray(body?.categories) && body.categories.length) {
    pool = pool.filter((s) => body.categories.includes(s.category))
  }

  const scored = pool
    .map((s) => scoreSlot(s, { asked, wanted, budget }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  const matches = scored.map((e) => ({
    courseId: e.courseId,
    score: Number(e.score.toFixed(2)),
    matched: e.matched.slice(0, 4),
    concerns: e.concerns.slice(0, 2),
    reason: buildReason(e, asked)
  }))

  const condNames = asked.map((c) => c.label)
  const summary = matches.length
    ? condNames.length
      ? `${condNames.join(' · ')} 조건을 기준으로 ${matches.length}곳을 골랐습니다.`
      : `입력하신 내용을 기준으로 ${matches.length}곳을 골랐습니다.`
    : '조건에 맞는 현장을 찾지 못했습니다.'

  return {
    matches,
    summary,
    // 스텁임을 응답에 남긴다. 화면이 이걸 보고 '연동 전' 배지를 띄운다.
    model: 'stub-keyword-v1',
    elapsedMs: Math.max(1, Date.now() - started)
  }
}
