<template>
  <div class="overlay" @click.self="requestClose">
    <div
      ref="sheet"
      class="sheet"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="labelledby"
      tabindex="-1"
      @keydown.tab="trapTab"
    >
      <slot />
    </div>
  </div>
</template>

<script setup>
/**
 * 모달 껍데기
 *
 * 오버레이·유리 시트·Esc 닫기·배경 스크롤 잠금처럼 모든 모달이 똑같이 해야 하는 일만 담는다.
 * 내용과 닫기 조건(예: 저장 중에는 못 닫음)은 사용하는 쪽이 정한다.
 */
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  /** 저장 중처럼 닫으면 안 되는 상황에서 true */
  locked: { type: Boolean, default: false },
  /** 시트 제목의 id. 스크린리더가 대화상자 이름으로 읽는다. */
  labelledby: { type: String, default: undefined }
})
const emit = defineEmits(['close'])

function requestClose() {
  if (!props.locked) emit('close')
}

function onKeydown(e) {
  if (e.key === 'Escape') requestClose()
}

/*
 * 포커스 관리
 *
 * 이게 없으면 모달을 열어도 포커스는 오버레이 뒤 트리거 버튼에 남는다.
 * Tab 을 누르면 시트가 아니라 가려진 배경 카드로 넘어가서, 별점이나 저장
 * 버튼에 닿으려면 페이지를 한 바퀴 돌아야 한다.
 */
const sheet = ref(null)
let restoreTo = null

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'

function focusables() {
  return [...(sheet.value?.querySelectorAll(FOCUSABLE) ?? [])].filter(
    (el) => el.offsetParent !== null || el === document.activeElement
  )
}

function trapTab(e) {
  const els = focusables()
  if (!els.length) return
  const first = els[0]
  const last = els[els.length - 1]

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  document.body.style.overflow = 'hidden'

  restoreTo = document.activeElement
  nextTick(() => (focusables()[0] ?? sheet.value)?.focus())
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
  // 열기 전에 있던 자리로 돌려놓는다
  restoreTo?.focus?.()
})
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(36, 34, 73, 0.28);
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
}

.sheet {
  width: 100%;
  max-width: 460px;
  padding: 32px;
  border-radius: var(--radius-xl);
  background: var(--glass-bg-strong);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-edge);
  box-shadow: var(--shadow-glass), 0 32px 80px rgba(36, 34, 73, 0.22);
  animation: rise 0.24s var(--ease-out) both;
}
@keyframes rise {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to   { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .sheet { animation: none; }
}

/* 투명도를 줄이도록 설정한 사용자에게는 유리를 불투명하게 —
   가드가 없으면 설정을 켜도 blur 와 반투명이 그대로 남는다. */
@media (prefers-reduced-transparency: reduce) {
  .sheet {
    background: var(--color-bg-primary);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    border-color: var(--color-border);
  }
}
</style>
