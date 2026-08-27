<template>
  <!-- 개발 서버에서만 존재한다. 운영 빌드에는 이 컴포넌트 자체가 들어가지 않는다. -->
  <div v-if="open" class="devpanel" role="dialog" aria-label="개발 도구">
    <div class="dev-head">
      <span class="dev-title">개발 도구</span>
      <button type="button" class="dev-x" @click="open = false" aria-label="닫기">✕</button>
    </div>

    <p class="dev-desc">
      시연 중 쌓인 <strong>신청 · 결제 · 평가를 전부</strong> 지우고 처음 상태로 되돌립니다.
      실증 슬롯과 계정은 그대로 둡니다.
    </p>

    <p v-if="result" :class="['dev-result', result.ok ? 'is-ok' : 'is-bad']">{{ result.message }}</p>

    <div class="dev-actions">
      <template v-if="!confirming">
        <button type="button" class="dev-btn dev-danger" :disabled="busy" @click="confirming = true">
          데모 데이터 초기화
        </button>
      </template>
      <template v-else>
        <span class="dev-ask">되돌릴 수 없습니다. 진행할까요?</span>
        <button type="button" class="dev-btn" :disabled="busy" @click="confirming = false">취소</button>
        <button type="button" class="dev-btn dev-danger" :disabled="busy" @click="reset">
          {{ busy ? '지우는 중…' : '초기화' }}
        </button>
      </template>
    </div>

    <p class="dev-hint">Ctrl + Alt(⌥) + D 로 여닫습니다 · <code>?dev=1</code> 로도 열립니다</p>
  </div>
</template>

<script setup>
/**
 * 숨은 개발 패널
 *
 * 백엔드에 삭제 API 가 없어(enrollment/payment/course 모두 DELETE 미노출)
 * 초기화는 Vite 개발 서버의 /__dev/reset 이 대신 수행한다.
 * vite.config.js 의 devResetPlugin 을 보라.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'

const open = ref(false)
const confirming = ref(false)
const busy = ref(false)
const result = ref(null)

function onKey(e) {
  // Ctrl + Alt + D
  //
  // ⌘ 도 받지만 맥에서는 ⌘⌥D 를 macOS 가 먼저 가로챈다(Dock 자동 숨기기).
  // 그래서 안내에는 Ctrl 만 적는다.
  //
  // 맥에서 Option 을 누르면 e.key 가 'd' 가 아니라 '∂' 가 된다.
  // e.code 는 물리 키라 배열·조합과 무관하게 'KeyD' 로 온다.
  if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'd' || e.key === 'D' || e.code === 'KeyD')) {
    e.preventDefault()
    open.value = !open.value
    confirming.value = false
    result.value = null
  }
}

async function reset() {
  busy.value = true
  result.value = null
  try {
    const res = await fetch('/__dev/reset', { method: 'POST' })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`)

    result.value = { ok: true, message: '초기화했습니다. 잠시 후 새로고침합니다.' }
    // 화면이 들고 있던 목록·평판이 전부 무효가 됐으므로 통째로 다시 그린다
    setTimeout(() => window.location.replace('/'), 900)
  } catch (e) {
    result.value = { ok: false, message: `실패: ${e.message}` }
    busy.value = false
    confirming.value = false
  }
}

onMounted(() => {
  // 단축키가 OS·확장 프로그램에 막히는 경우를 위한 대비책
  if (new URLSearchParams(location.search).get('dev') === '1') open.value = true
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
/* 개발 도구라 브랜드 토큰을 따르지 않는다 — 서비스 화면과 헷갈리면 안 된다 */
.devpanel {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 9999;
  width: 320px;
  padding: 14px 16px 12px;
  border-radius: 12px;
  background: #1d1f2b;
  color: #E8E9F2;
  border: 1px solid #383B4F;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.42);
  font-size: 13px;
  line-height: 1.6;
}

.dev-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.dev-title {
  font-weight: 700;
  letter-spacing: 0.02em;
}
.dev-x {
  background: none;
  color: #9BA0BF;
  font-size: 13px;
  line-height: 1;
  padding: 2px 4px;
}
.dev-x:hover { color: #E8E9F2; }

.dev-desc {
  color: #B9BDD6;
  margin-bottom: 10px;
}
.dev-desc strong { color: #FFD9A0; }

.dev-result {
  margin-bottom: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 12.5px;
}
.is-ok  { background: #14331F; color: #8FE3AC; }
.is-bad { background: #3A1B1B; color: #F3A3A3; }

.dev-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.dev-ask {
  flex: 1 1 100%;
  color: #FFD9A0;
  font-size: 12.5px;
}
.dev-btn {
  padding: 6px 12px;
  border-radius: 8px;
  background: #2C2F40;
  color: #E8E9F2;
  font-size: 12.5px;
  font-weight: 600;
}
.dev-btn:hover:not(:disabled) { background: #363A4E; }
.dev-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.dev-danger { background: #7A2B2B; }
.dev-danger:hover:not(:disabled) { background: #8F3333; }

.dev-hint code {
  padding: 1px 5px;
  border-radius: 4px;
  background: #2C2F40;
  color: #B9BDD6;
}
.dev-hint {
  margin-top: 10px;
  color: #6E7391;
  font-size: 11.5px;
}
</style>
