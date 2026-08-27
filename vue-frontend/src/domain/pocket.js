/**
 * PoCket 도메인 매핑 — 단일 진실 공급원(single source of truth)
 *
 * 백엔드는 온라인 교육 템플릿 그대로다(course / enrollment / instructor …).
 * 화면에 보이는 실증 도메인 용어는 전부 여기서만 정의하고, 컴포넌트는 여기서 가져다 쓴다.
 * 백엔드 코드는 한 줄도 수정하지 않는다 — 네트워크로는 enum 코드가 오가고, 사람이 읽는
 * 말은 이 파일이 붙인다.
 *
 * ⚠️ 라벨을 바꾸고 싶으면 이 파일만 고칠 것. 화면 파일에 문자열을 흩뿌리지 말 것.
 */

/* ------------------------------------------------------------------ *
 * 어휘 — 템플릿 개념 → PoCket 용어
 * ------------------------------------------------------------------ */
export const TERMS = {
  slot: '실증 슬롯',
  slotPlural: '실증 슬롯',
  slotList: '테스트베드',
  host: '테스트베드 호스트',
  hostShort: '호스트',
  startup: '스타트업',
  application: '실증 신청',
  applicationList: '내 실증',
  fee: '실증비',
  industry: '산업군',
  runCount: '실증 진행',
  recommend: '스케일업 추천'
}

/* ------------------------------------------------------------------ *
 * 산업군 — Course.Category enum 8종
 *
 * enum 값은 백엔드 고정이라 추가/삭제 불가. 라벨만 우리가 정한다.
 * tint/ink 는 WCAG AA(4.5:1) 검증을 통과한 쌍이다. 임의로 바꾸지 말 것.
 * ------------------------------------------------------------------ */
export const CATEGORIES = [
  { code: 'BACKEND',      label: 'F&B',       icon: 'cup', tint: '#FAEBE5', ink: '#BD430F' },
  { code: 'FRONTEND',     label: '리테일',     icon: 'storefront', tint: '#F8E7F0', ink: '#B6206B' },
  { code: 'DEVOPS',       label: '물류',       icon: 'package', tint: '#EBE7F8', ink: '#4620B6' },
  { code: 'DATA_SCIENCE', label: '헬스케어',   icon: 'health', tint: '#E7F8F5', ink: '#157965' },
  { code: 'MOBILE',       label: '오피스',     icon: 'office', tint: '#E7F0F8', ink: '#206BB6' },
  { code: 'SECURITY',     label: '보안·관제',  icon: 'shield', tint: '#F2E9F7', ink: '#812BAB' },
  { code: 'DATABASE',     label: '데이터센터', icon: 'server', tint: '#E7F4F8', ink: '#1A7393' },
  { code: 'OTHER',        label: '기타',       icon: 'pin', tint: '#F2F0EE', ink: '#7B6B47' }
]

const CATEGORY_BY_CODE = Object.fromEntries(CATEGORIES.map(c => [c.code, c]))

/**
 * enrollment-service 는 응답 전에 enum 을 한글로 바꿔서 보낸다.
 *   case "BACKEND" -> "백엔드"  (DATA_SCIENCE 등은 default 로 통과)
 * 백엔드를 고칠 수 없으므로 그 값도 원래 코드로 되돌려 받아준다.
 */
const LEGACY_LABEL_TO_CODE = {
  '백엔드': 'BACKEND',
  '프론트엔드': 'FRONTEND',
  'DEVOPS': 'DEVOPS',
  '데이터': 'DATA_SCIENCE',
  'AI': 'DATA_SCIENCE'
}

const UNKNOWN_CATEGORY = {
  code: '',
  label: '미분류',
  icon: 'pin',
  tint: '#F2F0EE',
  ink: '#7B6B47'
}

/** enum 코드로 산업군 정보를 찾는다. 모르는 값이 와도 화면이 깨지지 않도록 폴백을 준다. */
export function category(code) {
  if (!code) return UNKNOWN_CATEGORY
  const raw = String(code)
  return (
    CATEGORY_BY_CODE[raw.toUpperCase()] ||
    CATEGORY_BY_CODE[LEGACY_LABEL_TO_CODE[raw]] ||
    CATEGORY_BY_CODE[LEGACY_LABEL_TO_CODE[raw.toUpperCase()]] ||
    UNKNOWN_CATEGORY
  )
}

export function categoryLabel(code) {
  return category(code).label
}

/** 배지·썸네일에 그대로 바인딩할 인라인 스타일. 클래스를 파일마다 중복 정의하지 않기 위함. */
export function categoryStyle(code) {
  const c = category(code)
  return { background: c.tint, color: c.ink }
}

/* ------------------------------------------------------------------ *
 * 역할 — User.Role enum
 * ------------------------------------------------------------------ */
export const ROLES = {
  INSTRUCTOR: { label: TERMS.host, short: TERMS.hostShort },
  STUDENT: { label: TERMS.startup, short: TERMS.startup }
}

export function roleLabel(role) {
  return ROLES[role]?.label || '알 수 없음'
}

export const isHost = (role) => role === 'INSTRUCTOR'

/** review-service 의 reviewerRole 은 User.Role 과 값이 다르다 (HOST / STARTUP) */
export function reviewerRoleLabel(role) {
  return role === 'HOST' ? TERMS.hostShort : TERMS.startup
}

/**
 * 이름 가운데 가리기
 *
 *   노윤성   -> 노*성
 *   김강    -> 김*
 *   홍길동전 -> 홍**전
 *
 * 평가는 공개되는 정보라 전체 이름을 그대로 노출하지 않는다.
 */
export function maskName(name) {
  const s = String(name ?? '').trim()
  if (!s) return '익명'
  if (s.length === 1) return s
  if (s.length === 2) return `${s[0]}*`
  return `${s[0]}${'*'.repeat(s.length - 2)}${s[s.length - 1]}`
}

/* ------------------------------------------------------------------ *
 * 상태 — Enrollment / Payment / Course
 *
 * tone 은 화면에서 색을 고르는 힌트다: wait(대기) / done(완료) / off(종료·실패)
 * ------------------------------------------------------------------ */
export const ENROLLMENT_STATUS = {
  PENDING: { label: '승인 대기', tone: 'wait' },
  ACTIVE: { label: '실증 확정', tone: 'done' },
  CANCELLED: { label: '취소', tone: 'off' }
}

export const PAYMENT_STATUS = {
  PENDING: { label: '결제 대기', tone: 'wait' },
  COMPLETED: { label: '결제 완료', tone: 'done' },
  FAILED: { label: '결제 실패', tone: 'off' },
  CANCELLED: { label: '취소', tone: 'off' }
}

export const COURSE_STATUS = {
  ACTIVE: { label: '모집 중', tone: 'done' },
  INACTIVE: { label: '마감', tone: 'off' }
}

const statusOf = (map, value, fallback) =>
  map[value] || { label: fallback, tone: 'off' }

export const enrollmentStatus = (v) => statusOf(ENROLLMENT_STATUS, v, '상태 미상')
export const paymentStatus = (v) => statusOf(PAYMENT_STATUS, v, '상태 미상')
export const courseStatus = (v) => statusOf(COURSE_STATUS, v, '상태 미상')

/* ------------------------------------------------------------------ *
 * 금액
 * ------------------------------------------------------------------ */
export function formatFee(value) {
  const n = Number(value ?? 0)
  return Number.isNaN(n) ? '0' : n.toLocaleString()
}

/* ------------------------------------------------------------------ *
 * 백엔드가 만든 사용자 노출 문장 대체
 *
 * recommend-service 는 "BACKEND 카테고리 기반 추천 강의입니다" 처럼 enum 원시값과
 * 교육 용어가 섞인 문장을 내려준다. 그 message 는 버리고, 같이 오는 basedOnCategory
 * 코드로 우리가 다시 조립한다.
 * ------------------------------------------------------------------ */
export function recommendMessage(basedOnCategory) {
  if (!basedOnCategory) {
    return '아직 실증 이력이 없어 인기 있는 테스트베드를 먼저 보여드립니다.'
  }
  return `${categoryLabel(basedOnCategory)} 분야 실증 이력을 기반으로 추천했습니다.`
}

/* ------------------------------------------------------------------ *
 * 에러 문구
 *
 * 백엔드 message 를 그대로 노출하면 "이미 수강신청한 강의입니다" 처럼 교육 용어가
 * 화면에 튀어나온다. 알려진 상태코드는 우리 문구로 덮고, 나머지는 일반 문구를 쓰되
 * 원본은 콘솔에 남겨 디버깅이 막히지 않게 한다.
 * ------------------------------------------------------------------ */
export function apiErrorMessage(err, fallback = '요청을 처리하지 못했습니다.', overrides = {}) {
  const status = err?.response?.status
  const raw = err?.response?.data?.message

  if (raw) console.warn('[PoCket] 백엔드 원본 메시지:', status, raw)

  if (overrides[status]) return overrides[status]

  switch (status) {
    case 400:
      return '입력값을 다시 확인해 주세요.'
    case 401:
      return '로그인이 필요합니다.'
    case 403:
      return '권한이 없습니다.'
    case 404:
      return '대상을 찾을 수 없습니다.'
    case 409:
      return '이미 처리된 요청입니다.'
    default:
      return fallback
  }
}
