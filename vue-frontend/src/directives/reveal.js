/**
 * v-reveal — 요소가 뷰포트에 들어오면 한 번만 나타난다.
 *
 * 이런 구현의 고질적인 사고는 "CSS 가 먼저 숨기고 JS 가 나중에 보여주는" 구조다.
 * JS 가 한 번이라도 안 돌면 콘텐츠가 영원히 안 보인다.
 * 그래서 숨기는 규칙을 html.reveal-ready 아래에만 두고, 이 모듈이 실제로 동작할 수
 * 있을 때에만 그 플래그를 붙인다. 스크립트가 죽으면 플래그가 없으니 처음부터 다 보인다.
 *
 *   v-reveal                        기본 (아래에서 16px 올라오며 나타남)
 *   v-reveal="120"                  120ms 지연
 *   v-reveal="{ delay: 60, y: 24 }" 지연 + 이동 거리
 */
import { watch } from 'vue'
import { portalActive } from '@/domain/intro.js'

const CLASS_HIDDEN = 'reveal'
const CLASS_SHOWN = 'is-revealed'
const ROOT_FLAG = 'reveal-ready'

/* IntersectionObserver 는 observe 직후 다음 프레임에 반드시 한 번 콜백을 준다.
   이 시간 안에 아무 콜백도 안 오면 관찰이 동작하지 않는 환경으로 보고 전부 보여준다. */
const IO_WATCHDOG_MS = 1200

/* SplitPortal 이 화면을 덮는 총 시간은 HOLD 1500 + BADGE_OUT 320 + DOOR_OPEN 1100
   = 2920ms (components/SplitPortal.vue:46-48). 그보다 넉넉한 상한. */
const PORTAL_MAX_WAIT_MS = 4000

const canObserve = typeof window !== 'undefined' && 'IntersectionObserver' in window

let observer = null
let watchdogTimer = null
let givenUp = false

const tracked = new Set() // 아직 안 나타난 요소
const waiting = new Set() // 포털이 걷히기를 기다리는 요소
let portalStop = null
let portalTimer = null

const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

function normalize(value) {
  if (typeof value === 'number') return { delay: value }
  if (value && typeof value === 'object') return value
  return {}
}

function show(el) {
  tracked.delete(el)
  waiting.delete(el)
  el.classList.add(CLASS_SHOWN)
}

/* 새로고침으로 스크롤이 복원돼 이미 위로 지나간 요소 — 애니메이션 없이 그냥 보여준다 */
function showInstantly(el) {
  el.style.removeProperty('--reveal-delay')
  el.style.setProperty('--reveal-duration', '1ms')
  show(el)
}

/* 포털이 덮고 있는 동안 애니메이션을 돌리면 문이 열렸을 때 이미 끝나 있다.
   CountUp 이 쓰는 것과 같은 신호(portalActive)를 그대로 쓴다. */
function waitForPortal(el) {
  waiting.add(el)
  if (portalStop) return

  const release = () => {
    if (portalTimer) {
      clearTimeout(portalTimer)
      portalTimer = null
    }
    if (portalStop) {
      portalStop()
      portalStop = null
    }
    waiting.forEach(show)
    waiting.clear()
  }

  portalStop = watch(portalActive, (active) => {
    if (!active) release()
  })
  // portalActive 가 어떤 이유로든 안 내려가도 콘텐츠는 반드시 나타나야 한다
  portalTimer = setTimeout(release, PORTAL_MAX_WAIT_MS)
}

/* 관찰이 동작하지 않는다고 판단했을 때 — 숨김 자체를 걷어 낸다.
   플래그를 떼므로 이후에 mount 되는 요소도 숨겨지지 않는다. */
function giveUp() {
  givenUp = true
  watchdogTimer = null
  detachSweep()
  document.documentElement.classList.remove(ROOT_FLAG)
  tracked.forEach((el) => {
    observer?.unobserve(el)
    el.classList.remove(CLASS_HIDDEN)
  })
  tracked.clear()
}

/*
 * 뷰포트 위로 지나가 버린 요소를 건져 낸다.
 *
 * IntersectionObserver 는 교차 "비율이 변할 때" 만 콜백을 준다. 화면 아래(비교차)에서
 * 화면 위(비교차)로 한 번에 점프하면 비율이 계속 0이라 콜백이 아예 오지 않는다.
 * 스크롤바 드래그, End 키, 앵커 이동, 새로고침 후 스크롤 복원에서 실제로 밟는다.
 * 그대로 두면 그 요소들은 opacity:0 으로 영원히 남는다 — 측정으로 확인한 사고다.
 */
let sweepQueued = false

function sweepPassed() {
  sweepQueued = false
  for (const el of [...tracked]) {
    if (el.getBoundingClientRect().bottom <= 0) {
      observer?.unobserve(el)
      showInstantly(el)
    }
  }
  if (!tracked.size) detachSweep()
}

function onScroll() {
  if (sweepQueued) return
  sweepQueued = true
  requestAnimationFrame(sweepPassed)
}

function attachSweep() {
  window.addEventListener('scroll', onScroll, { passive: true })
}

function detachSweep() {
  window.removeEventListener('scroll', onScroll)
}

function onIntersect(entries, obs) {
  if (watchdogTimer) {
    clearTimeout(watchdogTimer)
    watchdogTimer = null
  }

  for (const entry of entries) {
    if (entry.isIntersecting) {
      // 한 번 나타난 것은 다시 숨기지 않는다.
      // 되돌아 스크롤할 때 글이 사라지면 읽을 수가 없다.
      obs.unobserve(entry.target)
      if (portalActive.value) waitForPortal(entry.target)
      else show(entry.target)
      if (!tracked.size) detachSweep()
      continue
    }

    // 뷰포트 위로 이미 지나간 요소 (스크롤 위치 복원 등)
    const rootTop = entry.rootBounds ? entry.rootBounds.top : 0
    if (entry.boundingClientRect.bottom <= rootTop) {
      obs.unobserve(entry.target)
      showInstantly(entry.target)
    }
  }
}

function ensureObserver() {
  if (observer) return observer

  observer = new IntersectionObserver(onIntersect, {
    // threshold 를 0 보다 크게 잡으면 뷰포트보다 큰 요소는 그 비율에 영원히 못 닿는다
    // (최대 ratio = 뷰포트높이/요소높이). 크기와 무관하게 판정하려고 0 으로 두고,
    // 기준선은 rootMargin 의 음수 bottom 으로 올린다. -12% 는 900px 화면에서 108px.
    threshold: 0,
    rootMargin: '0px 0px -12% 0px'
  })
  watchdogTimer = setTimeout(giveUp, IO_WATCHDOG_MS)
  attachSweep()
  return observer
}

export const vReveal = {
  mounted(el, binding) {
    // 아무것도 하지 않는다 = 요소는 처음부터 보인다. 이게 이 디렉티브의 기본 실패 모드다.
    if (!canObserve || givenUp || prefersReducedMotion()) return

    const { delay = 0, y, duration } = normalize(binding.value)
    if (delay) el.style.setProperty('--reveal-delay', `${delay}ms`)
    if (y !== undefined) el.style.setProperty('--reveal-y', typeof y === 'number' ? `${y}px` : y)
    if (duration) el.style.setProperty('--reveal-duration', `${duration}ms`)

    el.classList.add(CLASS_HIDDEN)
    // 숨김 규칙은 여기서 켠다 — 디렉티브가 실제로 돈 뒤에만 켜진다.
    // mounted 훅은 브라우저가 칠하기 전에 끝나므로 깜빡임은 없다.
    document.documentElement.classList.add(ROOT_FLAG)

    tracked.add(el)
    ensureObserver().observe(el)
  },

  unmounted(el) {
    tracked.delete(el)
    waiting.delete(el)
    observer?.unobserve(el)
  }
}
