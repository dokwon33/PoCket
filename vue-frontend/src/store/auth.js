import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth.js'
import { clearAuthExpired } from '@/domain/session.js'

const AUTH_SERVER_URL = import.meta.env.VITE_AUTH_SERVER_URL || 'http://localhost:8080'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref(sessionStorage.getItem('access_token') || null)
  const user = ref(JSON.parse(sessionStorage.getItem('user') || 'null'))

  const isAuthenticated = computed(() => !!accessToken.value)
  const isHost = computed(() => user.value?.role === 'HOST')

  function setToken(token) {
    accessToken.value = token
    clearAuthExpired()
    sessionStorage.setItem('access_token', token)
  }

  function setUser(userData) {
    user.value = userData
    sessionStorage.setItem('user', JSON.stringify(userData))
  }

  async function fetchUser() {
    try {
      const res = await authApi.getMe()
      console.log('[AuthStore] /me response =', res.data)

      const userData = res?.data?.data ?? res?.data

      if (!userData || typeof userData !== 'object') {
        throw new Error('사용자 정보 형식이 올바르지 않습니다.')
      }

      setUser(userData)
    } catch (error) {
      console.error('[AuthStore] 사용자 정보 조회 실패:', error)
      clearLocal()
    }
  }

  function clearLocal() {
    accessToken.value = null
    user.value = null
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('user')
  }

  /**
   * 로그아웃
   *
   * 토큰만 지우면 로그아웃이 되지 않는다. 인증 서버의 세션 쿠키가 살아 있어서
   * 다시 로그인을 누르면 서버가 조용히 통과시켜 같은 계정으로 되돌아온다.
   * (localhost 쿠키는 포트를 구분하지 않으므로 :8080 과 :9000 이 같은 세션을 쓴다)
   *
   * 그래서 서버 세션까지 끊는다.
   *
   * @param full  true  = 서버 세션까지 끊고 홈으로 (사용자가 로그아웃 버튼을 누른 경우)
   *              false = 로컬 토큰만 정리 (401 로 만료를 감지한 경우)
   */
  async function logout(full = true) {
    clearLocal()
    if (!full) return

    try {
      // no-cors 라 응답은 못 읽지만 Set-Cookie 는 적용된다.
      // 전체 화면을 인증 서버로 넘기면 스프링 기본 로그아웃 페이지에 착지하게 되므로 쓰지 않는다.
      await fetch(`${AUTH_SERVER_URL}/logout`, {
        method: 'GET',
        credentials: 'include',
        mode: 'no-cors'
      })
    } catch (e) {
      console.warn('[AuthStore] 인증 서버 로그아웃 요청 실패:', e)
    }

    // '/login' 으로 보내면 자동 이동이 걸려 도로 로그인된다. 반드시 홈으로.
    window.location.href = '/'
  }

  // OAuth2 Authorization Code Flow
  function redirectToLogin() {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: import.meta.env.VITE_CLIENT_ID,
      redirect_uri: import.meta.env.VITE_REDIRECT_URI,
      scope: 'openid profile read write'
    })

    window.location.href = `${AUTH_SERVER_URL}/oauth2/authorize?${params.toString()}`
  }

  async function handleCallback(code) {
    const res = await authApi.exchangeCode(code)
    console.log('[AuthStore] token response =', res.data)

    const token = res?.data?.access_token

    if (!token) {
      throw new Error('액세스 토큰을 받지 못했습니다.')
    }

    setToken(token)
    await fetchUser()
  }

  return {
    accessToken,
    user,
    isAuthenticated,
    isHost,
    setToken,
    setUser,
    fetchUser,
    logout,
    redirectToLogin,
    handleCallback
  }
})