<template>
  <span class="count">{{ display }}</span>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { portalActive } from '@/domain/intro.js'

const props = defineProps({
  to: { type: Number, required: true },
  duration: { type: Number, default: 2000 },
  delay: { type: Number, default: 0 }
})

const value = ref(0)
const display = ref('0')

let raf = null
let timer = null
let started = false

// 빠르게 튀어나갔다가 부드럽게 멈춘다 — "촤르르륵" 은 감속 곡선에서 나온다
const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))

function render(n) {
  display.value = Math.round(n).toLocaleString()
}

function run(startedAt) {
  const step = (now) => {
    // rAF 의 now 는 "콜백이 불린 시각"이 아니라 "그 프레임이 시작된 시각"이다.
    // setTimeout 이 프레임 시작 직후에 발화하면 startedAt 이 다음 now 보다 뒤가 되어
    // t 가 음수가 된다. easeOutExpo(-0.1) = -1 이라 -3,109,837 같은 값이 한 번 번쩍한다.
    // 상한(1)만이 아니라 하한(0)도 막아야 한다.
    const t = Math.min(Math.max((now - startedAt) / props.duration, 0), 1)
    value.value = props.to * easeOutExpo(t)
    render(value.value)
    if (t < 1) raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)
}

function start() {
  if (started) return
  started = true

  // 모션을 줄이도록 설정한 사용자에게는 최종값만 보여준다
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    render(props.to)
    return
  }

  timer = setTimeout(() => run(performance.now()), props.delay)
}

onMounted(() => {
  render(0)
  // 진입 포털이 화면을 덮고 있는 동안 세면 문이 열렸을 때 이미 끝나 있다.
  // 포털이 걷힌 뒤에 시작한다.
  if (!portalActive.value) start()
})

watch(portalActive, (active) => {
  if (!active) start()
})

onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
  if (timer) clearTimeout(timer)
})
</script>

<style scoped>
/* 자릿수마다 폭이 달라지면 숫자가 굴러갈 때 레이아웃이 덜덜 떨린다 */
.count {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1;
}
</style>
