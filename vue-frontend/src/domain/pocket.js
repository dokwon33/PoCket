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
  HOST: { label: TERMS.host, short: TERMS.hostShort },
  STARTUP: { label: TERMS.startup, short: TERMS.startup }
}

export function roleLabel(role) {
  return ROLES[role]?.label || '알 수 없음'
}

export const isHost = (role) => role === 'HOST'

/** review-service 의 reviewerRole 은 User.Role 과 값이 같다 (HOST / STARTUP 통일) */
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
/* ------------------------------------------------------------------ *
 * 산업군별 등록 안내
 *
 * courses 에는 스펙을 담을 구조화된 컬럼이 없다. 전부 description 자유
 * 텍스트라 정렬·필터·비교가 되지 않는다. 컬럼을 늘리는 건 백엔드 일이므로,
 * 대신 호스트가 "무엇을 적어야 하는지" 를 알게 해서 내용의 질을 끌어올린다.
 *
 * 항목과 예시는 시드 슬롯 95건의 설명에서 뽑았다 — 신청자가 실제로 궁금해하는
 * 것들이다. 나중에 spec 컬럼이 생기면 이 항목들이 그대로 필드가 된다.
 * ------------------------------------------------------------------ */
export const CATEGORY_SPEC_GUIDE = {
  BACKEND: {
    items: ['일 평균 방문객', '좌석·매장 면적', '전원 사양', '네트워크', '실증 가능 시간대'],
    example:
      '일 평균 방문객 480명, 좌석 42석. 매장 후면에 220V 전용 콘센트 2구와 기가 유선망을 제공합니다. 피크타임(11~14시) 외 시간대 실증 가능.'
  },
  FRONTEND: {
    items: ['일 방문객', '실증 배정 구역', '판매 데이터 제공 여부', '설치 제약'],
    example:
      '주말 일 방문객 6,000명 규모. 진열 매대 12m 구간을 실증 전용으로 배정하며, POS 연동 데이터는 익명화 후 제공합니다.'
  },
  DEVOPS: {
    items: ['연면적', '통로 폭·층고', '온도 조건', '개방 시간대', '장비 반입 동선'],
    example:
      '연면적 12,000㎡ 상온 창고. 통로 폭 3.2m, 층고 9m. 야간 셧다운 시간대 4시간을 실증 슬롯으로 개방합니다.'
  },
  DATA_SCIENCE: {
    items: ['규모·환자 수', 'IRB 등 승인 절차', '데이터 처리 환경', '실증 가능 시간대'],
    example:
      '일 외래 1,200명 규모 3차 병원. IRB 승인 절차를 지원하며, 실증 데이터는 원내 폐쇄망에서만 처리합니다.'
  },
  MOBILE: {
    items: ['상주 인원', '실증 가능 공간', '센서 부착 가능 여부', '네트워크 분리 여부'],
    example:
      '상주 인원 210명. 회의실 6실에 예약·점유 센서를 부착할 수 있으며, 사내 Wi-Fi와 분리된 실증용 VLAN을 제공합니다.'
  },
  SECURITY: {
    items: ['카메라·센서 채널 수', '스트림 제공 방식', '관제 인력 협조', '출입 절차'],
    example:
      'CCTV 64채널 운영. RTSP 스트림 8채널을 실증용으로 분기해 드리며, 관제 요원 교차 검증이 가능합니다.'
  },
  DATABASE: {
    items: ['상면·랙 규모', '전력·냉방 조건', '모니터링 지표 제공', '무중단 제약'],
    example:
      '랙 24구 규모 상면. 흡·배기 온도 로그와 PUE 지표를 실시간 제공하며, 무중단 조건에서 부착형 센서만 허용합니다.'
  },
  OTHER: {
    items: ['현장 규모', '이용량', '기존 설비와의 관계', '실증 가능 시간대'],
    example:
      '노외 주차장 180면. 입출차 일 평균 640대. 기존 인식기와 병렬 설치해 정확도 비교가 가능합니다.'
  }
}

/** 산업군에 맞는 등록 안내. 아직 고르지 않았으면 null */
export function specGuide(code) {
  return CATEGORY_SPEC_GUIDE[String(code || '').toUpperCase()] ?? null
}

/**
 * 실증비 상한
 *
 * courses.price 가 DECIMAL(10,2) 라 정수부가 8자리뿐이다 — 최대 99,999,999.99.
 * 이 값을 넘겨 보내면 DB 가 거절한다:
 *   ERROR 1264 (22003): Out of range value for column 'price'
 * 백엔드를 못 고치므로 입력 단계에서 막는다.
 */
export const PRICE_MAX = 99999999

export const ENROLLMENT_STATUS = {
  // 호스트 승인 단계는 없다. 결제가 확인되면 Kafka 소비 후 자동으로 ACTIVE 가 된다.
  // '승인 대기' 라고 쓰면 사용자가 며칠짜리 심사로 오해한다.
  PENDING: { label: '확정 처리 중', tone: 'wait' },
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
