<template>
  <div class="login-page">
    <div class="login-center">
      <!-- 브랜드 -->
      <router-link to="/" class="brand">
        <img src="@/assets/images/logo/pocket-symbol-color.svg" alt="" class="brand-logo" />
        <span class="brand-name">PoCket</span>
      </router-link>

      <h1 class="brand-headline">제품을 검증할 현장을 만나세요</h1>

      <div class="login-card fade-in-up">
        <div class="login-box">

          <!-- 로그인 : 우리 화면에서 자격증명을 받아 인증 서버로 전달한다 -->
          <div v-if="!showRegister" class="section">
            <h3 class="section-title">로그인</h3>
            <p class="section-desc">{{ loginDesc }}</p>

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

              <div v-show="error" class="error-msg" role="alert">{{ error }}</div>

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
                <label class="form-label" for="reg-name">이름</label>
                <input id="reg-name" v-model="registerForm.name" type="text" class="form-input" placeholder="홍길동" autocomplete="name" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="reg-email">이메일</label>
                <input id="reg-email" v-model="registerForm.email" type="email" class="form-input" placeholder="user@example.com" autocomplete="email" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="reg-password">비밀번호</label>
                <input id="reg-password" v-model="registerForm.password" type="password" class="form-input" placeholder="8자 이상" autocomplete="new-password" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="reg-role">역할</label>
                <select id="reg-role" v-model="registerForm.role" class="form-input">
                  <option value="STARTUP">스타트업 — 실증할 제품이 있어요</option>
                  <option value="HOST">테스트베드 호스트 — 현장을 제공해요</option>
                </select>
              </div>
              <div v-show="error" class="error-msg" role="alert">{{ error }}</div>
              <div v-show="success" class="success-msg" role="status">{{ success }}</div>
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

      <router-link to="/" class="back-link">← 홈으로</router-link>
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
const REDIRECT_KEY = 'pocket.login.redirect'
const router = useRouter()

// /login 은 로그인, /register 는 회원가입. 같은 화면을 경로로 나눈다.
const showRegister = computed(() => route.name === 'Register')

/*
 * 로그인이 필요해 튕겨 온 사람에게는 이유를 말해 준다.
 * 게이트웨이가 익명 조회를 막기 때문에 '현장 둘러보기' 를 눌러도 여기로 온다.
 * 아무 설명 없이 로그인 화면이 뜨면 잘못 눌렀다고 생각한다.
 */
const loginDesc = computed(() =>
  typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
    ? '테스트베드를 보려면 로그인이 필요합니다. 로그인하면 보시던 곳으로 돌아갑니다.'
    : 'PoCket 계정으로 로그인합니다.'
)
const loading = ref(false)
const error = ref('')
const success = ref('')

const loginForm = ref({ username: '', password: '' })
/*
 * 랜딩의 '스타트업으로 시작하기' / '호스트로 시작하기' 가 ?role= 로 넘겨 준다.
 * 포털이 좌우로 갈라 물어본 답을 여기서 이어받는다 — 다시 고르게 하지 않는다.
 * 값은 반드시 확인한다. 주소창으로 아무 문자열이나 들어올 수 있다.
 */
const ROLES = ['STARTUP', 'HOST']
const initialRole = ROLES.includes(String(route.query.role || '').toUpperCase())
  ? String(route.query.role).toUpperCase()
  : 'STARTUP'

const registerForm = ref({ name: '', email: '', password: '', role: initialRole })

const AUTH_SERVER_URL = import.meta.env.VITE_AUTH_SERVER_URL || 'http://localhost:8080'


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

  // 인가 코드 발급을 위해 인증 서버로 나갔다 오면 라우터 쿼리가 사라진다.
  // 원래 가려던 곳을 왕복 동안 보관해 두고 CallbackView 가 꺼내 쓴다.
  const back = route.query.redirect
  if (typeof back === 'string' && back.startsWith('/')) {
    sessionStorage.setItem(REDIRECT_KEY, back)
  }

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
    registerForm.value = { name: '', email: '', password: '', role: initialRole }
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
/* 좌우 반반 그리드를 걷어내고 화면 가운데 한 덩어리로 세운다.
   배경은 body::before 의 브랜드색 orb 를 그대로 쓴다 — 로그인만 진한
   그라디언트를 깔고 있어서 사이트의 나머지 화면과 따로 놀았다. */
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
}

.login-center {
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}
.brand-logo { width: 36px; height: 36px; object-fit: contain; }
.brand-name {
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--color-text-primary);
}

.brand-headline {
  margin-bottom: 26px;
  font-size: 25px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: -0.04em;
  text-align: center;
  color: var(--color-text-primary);
}

/* 폼을 유리 카드에 담는다 — 목록·상세 카드와 같은 재질 */
.login-card {
  width: 100%;
  padding: 32px 30px;
  border-radius: var(--radius-xl);
  background: var(--glass-bg-strong);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-edge);
  box-shadow: var(--shadow-glass), 0 24px 60px rgba(36, 34, 73, 0.10);
}
.login-box { width: 100%; }

.back-link {
  display: inline-block;
  margin-top: 26px;
  font-size: 13px;
  color: var(--color-text-muted);
  transition: var(--transition);
}
.back-link:hover { color: var(--color-link); }

@media (prefers-reduced-transparency: reduce) {
  .login-card {
    background: var(--color-bg-primary);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    border-color: var(--color-border);
  }
}

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
  color: var(--color-link);
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
  color: var(--color-link);
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

/* ── 반응형 ──────────────────────────────────────────────────
   가운데 한 덩어리라 폭이 좁아져도 구조가 그대로다. 여백과 글자만 줄인다.
   로그인은 비로그인 방문자가 처음 만나는 화면이라 폰에서 깨지면 안 된다. */
@media (max-width: 480px) {
  .login-page { padding: 32px 16px; }
  .brand-headline { font-size: 21px; margin-bottom: 20px; }
  .login-card { padding: 26px 20px; }
}
</style>
