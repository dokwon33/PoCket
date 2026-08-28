/**
 * AI 실증 매칭
 *
 * 계약은 recommend-service/AI-MATCHING.md 에 있다. 백엔드 구현이 나오기 전까지는 스텁이 답한다.
 * 전환 지점은 이 파일 하나뿐이고, 화면 코드는 어느 쪽인지 알 필요가 없다.
 *
 *   vue-frontend/.env
 *   VITE_MATCH_API=1     ← 이 값이 있으면 실제 엔드포인트를 호출한다
 *
 * 경로가 /api/recommend/match 인 이유:
 * API 게이트웨이가 프리빌트 이미지라 새 라우트 prefix 를 추가할 수 없다.
 * 이미 라우팅되는 /api/recommend/** 아래에 붙여야 통과한다.
 */
import api from './index.js'
import { stubMatch } from '@/domain/matchStub.js'

const USE_REAL_API = Boolean(import.meta.env.VITE_MATCH_API)

/** 스텁이 즉답하면 화면이 깜빡이고 끝난다. 실제 모델의 체감을 남긴다. */
const STUB_DELAY_MS = 900

export const matchApi = {
  /**
   * @param {object} body  { query, budget?, durationMonths?, categories?, limit? }
   * @param {Array}  slots 스텁이 훑을 슬롯 목록. 실제 API 를 쓸 때는 무시된다.
   */
  async search(body, slots) {
    if (USE_REAL_API) {
      const res = await api.post('/api/recommend/match', body, { timeout: 20000 })
      // 게이트웨이가 { success, data } 로 감싸는 경우와 그대로 주는 경우를 모두 받는다
      return res.data?.matches ? res.data : res.data?.data
    }

    // 스텁 계산은 몇 ms 만에 끝나 elapsedMs 가 0 으로 찍힌다.
    // 화면이 "0.0초" 라고 말하면 아무 일도 안 한 것처럼 보이므로,
    // 호출부가 실제로 기다린 시간을 대신 넣는다.
    const started = Date.now()
    await new Promise((resolve) => setTimeout(resolve, STUB_DELAY_MS))
    const res = stubMatch(body, slots)
    return { ...res, elapsedMs: Date.now() - started }
  },

  /** 화면이 '연동 전' 임을 알려야 할 때 */
  isStub: !USE_REAL_API
}
