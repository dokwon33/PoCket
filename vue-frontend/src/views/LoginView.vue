<template>
  <div class="login-page">
    <div class="login-layout">
      <!-- 좌측 브랜딩 -->
      <div class="login-left">
        <div class="brand">
          <img src="@/assets/images/logo/pocket-symbol-inverse.svg" alt="PoCket" class="brand-logo" />
          <span class="brand-name">PoCket</span>
        </div>
        <div class="brand-content">
          <h2>제품을 검증할<br>현장을 만나세요</h2>
          <p>로그인하고 우리 제품에 맞는 실증 테스트베드를 확인하세요.</p>
          <ul class="feature-list">
            <li v-for="f in features" :key="f">
              <span class="dot"></span>{{ f }}
            </li>
          </ul>
        </div>
      </div>

      <!-- 우측 -->
      <div class="login-right">
        <div class="login-box fade-in-up">
          <router-link to="/" class="back-link">← 홈으로</router-link>

          <!-- 로그인 : 우리 화면에서 자격증명을 받아 인증 서버로 전달한다 -->
          <div v-if="!showRegister" class="section">
            <h3 class="section-title">로그인</h3>
            <p class="section-desc">PoCket 계정으로 로그인합니다.</p>

            <form class="form" @submit.prevent="handleLogin" novalidate>
              <div class="form-group">
                <label class="form-label" for="login-email">이메일</label>
                <input
                  id="login-email"
                  v-model.trim="loginForm.username"
                  type="email"
                  class="form-input"
                  placeholder="user@example.com"
                  autocomplete="username"
                  required
                />
              </div>
              <div class="form-group">
                <label class="form-label" for="login-password">비밀번호</label>
                <input
                  id="login-password"
                  v-model="loginForm.password"
                  type="password"
                  class="form-input"
                  placeholder="비밀번호"
                  autocomplete="current-password"
                  required
                />
              </div>

              <div v-if="error" class="error-msg">{{ error }}</div>

              <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
                <span v-if="loading">로그인 중...</span>
                <span v-else>로그인</span>
              </button>
            </form>

            <div class="switch-link">
              계정이 없으신가요?
              <router-link to="/register" class="text-link">회원가입</router-link>
            </div>
          </div>

          <!-- 회원가입 영역 -->
          <div v-else class="section">
            <h3 class="section-title">회원가입</h3>
            <form @submit.prevent="handleRegister" class="form">
              <div class="form-group">
                <label class="form-label">이름</label>
                <input v-model="registerForm.name" type="text" class="form-input" placeholder="홍길동" required />
              </div>
              <div class="form-group">
                <label class="form-label">이메일</label>
                <input v-model="registerForm.email" type="email" class="form-input" placeholder="user@example.com" required />
              </div>
              <div class="form-group">
                <label class="form-label">비밀번호</label>
                <input v-model="registerForm.password" type="password" class="form-input" placeholder="8자 이상" required />
              </div>
              <div class="form-group">
                <label class="form-label">역할</label>
                <select v-model="registerForm.role" class="form-input">
                  <option value="STUDENT">스타트업 — 실증할 제품이 있어요</option>
                  <option value="INSTRUCTOR">테스트베드 호스트 — 현장을 제공해요</option>
                </select>
              </div>
              <div v-if="error" class="error-msg">{{ error }}</div>
              <div v-if="success" class="success-msg">{{ success }}</div>
              <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
                <span v-if="loading">가입 중...</span>
                <span v-else>회원가입</span>
              </button>
            </form>
            <div class="switch-link">
              이미 계정이 있으신가요?
              <router-link to="/login" class="text-link">로그인</router-link>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth.js'
import { authApi } from '@/api/auth.js'
import { apiErrorMessage } from '@/domain/pocket.js'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

// /login 은 로그인, /register 는 회원가입. 같은 화면을 경로로 나눈다.
const showRegister = computed(() => route.name === 'Register')
const loading = ref(false)
const error = ref('')
const success = ref('')

const loginForm = ref({ username: '', password: '' })
const registerForm = ref({ name: '', email: '', password: '', role: 'STUDENT' })

const AUTH_SERVER_URL = import.meta.env.VITE_AUTH_SERVER_URL || 'http://localhost:8080'

const features = ['AI 테스트베드 추천', '실증 신청·승인 관리', '실증 이력과 상호 평가']

/**
 * 로그인
 *
 * 인증 서버의 폼 로그인(POST /login)에 자격증명을 그대로 전달해 세션을 만들고,
 * 그 다음 평소처럼 Authorization Code 흐름으로 토큰을 받는다.
 * 토큰 발급 경로는 바뀌지 않는다 — 자격증명 입력 화면만 우리 쪽으로 가져온 것이다.
 *
 * 비밀번호는 이 함수 밖으로 나가지 않는다. 저장하지도, 로그로 남기지도 않는다.
 */
/** 인증 서버가 살아 있는지 확인. /login 은 CORS 가 열려 있어 프로브로 쓸 수 있다. */
async function authServerReachable() {
  try {
    await fetch(`${AUTH_SERVER_URL}/login`, { method: 'GET', cache: 'no-store' })
    return true
  } catch {
    return false
  }
}

function proceedToAuthorize() {
  loginForm.value.password = ''   // 화면 상태에 남기지 않는다
  auth.redirectToLogin()          // 세션이 생겼으니 인가 코드 발급으로
}

/**
 * 로그인
 *
 * 인증 서버의 폼 로그인(POST /login)으로 세션을 만들고, 그 다음 평소처럼
 * Authorization Code 흐름으로 토큰을 받는다. 토큰 발급 경로는 바뀌지 않는다.
 *
 * 성공/실패 판별이 까다로운 이유:
 *   실패 → 302 → /login?error  (CORS 헤더 있음 → fetch 가 정상 종료)
 *   성공 → 302 → /             (게이트웨이가 CORS 없이 401 → fetch 가 예외)
 * 즉 "예외가 났다"가 곧 실패는 아니다. 서버 생존을 한 번 더 확인해
 * 진짜 네트워크 오류와 구분한다.
 *
 * 비밀번호는 이 함수 밖으로 나가지 않는다. 저장하지도, 로그로 남기지도 않는다.
 */
async function handleLogin() {
  error.value = ''

  if (!loginForm.value.username || !loginForm.value.password) {
    error.value = '이메일과 비밀번호를 입력해 주세요.'
    return
  }

  loading.value = true
  try {
    const res = await fetch(`${AUTH_SERVER_URL}/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        username: loginForm.value.username,
        password: loginForm.value.password
      })
    })

    if (res.url.includes('error') || res.status === 401 || res.status === 403) {
      error.value = '이메일 또는 비밀번호가 올바르지 않습니다.'
      return
    }

    proceedToAuthorize()
  } catch (e) {
    if (await authServerReachable()) {
      // 서버는 멀쩡하다 → 성공 후 리다이렉트 도착지에서 CORS 로 막힌 것이다.
      proceedToAuthorize()
      return
    }
    console.error('[Login] 인증 서버에 연결할 수 없습니다:', e)
    error.value = '인증 서버에 연결할 수 없습니다. 컨테이너 상태를 확인해 주세요.'
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  error.value = ''
  success.value = ''
  loading.value = true
  try {
    await authApi.register(registerForm.value)
    success.value = '회원가입 완료! 로그인 화면으로 이동합니다.'
    registerForm.value = { name: '', email: '', password: '', role: 'STUDENT' }
    setTimeout(() => router.push('/login'), 1500)
  } catch (e) {
    error.value = apiErrorMessage(e, '회원가입에 실패했습니다.', {
      409: '이미 가입된 이메일입니다.'
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: stretch;
}
.login-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
  min-height: 100vh;
}
.login-left {
  background: var(--gradient-brand-deep);
  padding: 48px;
  display: flex;
  flex-direction: column;
  gap: 48px;
}
.brand { display: flex; align-items: center; gap: 10px; }
.brand-logo { width: 40px; height: 40px; object-fit: contain; }
.brand-name { font-size: 18px; font-weight: 700; color: #fff; }
.brand-content h2 {
  font-size: 32px; font-weight: 700; color: #fff;
  line-height: 1.35; margin-bottom: 14px;
}
.brand-content p { font-size: 15px; color: rgba(255,255,255,0.75); margin-bottom: 28px; }
.feature-list { list-style: none; display: flex; flex-direction: column; gap: 12px; }
.feature-list li { display: flex; align-items: center; gap: 10px; font-size: 14px; color: rgba(255,255,255,0.85); }
.dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,0.6); flex-shrink: 0; }

.login-right {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  background: var(--color-bg-primary);
}
.login-box { width: 100%; max-width: 400px; }
.back-link {
  display: inline-block;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 32px;
  transition: var(--transition);
}
.back-link:hover { color: var(--color-primary); }

.section { display: flex; flex-direction: column; gap: 16px; }
.section-title { font-size: 22px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 4px; }
.section-desc { font-size: 14px; color: var(--color-text-secondary); margin-bottom: 4px; }

.form { display: flex; flex-direction: column; gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 13px; font-weight: 500; color: var(--color-text-secondary); }
.form-input {
  padding: 14px 16px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 15px;
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
  transition: var(--transition);
  outline: none;
}
.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(80, 101, 192, 0.14);
}
.btn-full { width: 100%; padding: 15px; font-size: 16px; justify-content: center; margin-top: 4px; }

.redirecting {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  padding: 8px 0 28px;
}
.redirecting .section-title { margin: 4px 0 0; }
.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.text-link {
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: underline;
}

.switch-link {
  text-align: center;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 4px;
}
.text-btn {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 0 2px;
  text-decoration: underline;
}
.error-msg {
  padding: 10px 14px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--radius-md);
  font-size: 13px;
  color: #dc2626;
}
.success-msg {
  padding: 10px 14px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: var(--radius-md);
  font-size: 13px;
  color: #16a34a;
}
</style>
