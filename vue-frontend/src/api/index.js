import axios from 'axios'
import { useAuthStore } from '@/store/auth.js'
import { markAuthExpired } from '@/domain/session.js'

const api = axios.create({
  baseURL: '',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      console.error('[API] 401 Unauthorized')
      console.error('[API] response data =', err.response?.data)
      console.error('[API] request url =', err.config?.url)

      // 화면이 "데이터 없음"과 "인증 만료"를 구분해 말할 수 있도록 기록한다
      markAuthExpired()

      // 만료된 토큰은 환경과 무관하게 버린다.
      // 남겨두면 앱이 계속 로그인 상태로 착각해서, 헤더에 로그아웃 버튼이 뜨고
      // guestOnly 가드가 /login 진입을 막아 다시 로그인할 수가 없다.
      const auth = useAuthStore()
      auth.logout(false)   // 로컬 토큰만. 서버 세션은 건드리지 않는다

      // 다만 로그인 화면으로 "튕기는" 것은 운영 빌드에서만.
      // 개발 중에 튕기면 콘솔·네트워크 탭이 날아가 무엇이 401 을 냈는지 볼 수 없다.
      if (!import.meta.env.DEV) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api