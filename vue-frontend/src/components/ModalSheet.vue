<template>
  <div class="overlay" @click.self="requestClose">
    <div class="sheet" role="dialog" aria-modal="true">
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
import { onBeforeUnmount, onMounted } from 'vue'

const props = defineProps({
  /** 저장 중처럼 닫으면 안 되는 상황에서 true */
  locked: { type: Boolean, default: false }
})
const emit = defineEmits(['close'])

function requestClose() {
  if (!props.locked) emit('close')
}

function onKeydown(e) {
  if (e.key === 'Escape') requestClose()
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  document.body.style.overflow = 'hidden'
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
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
</style>
