<template>
  <div
    v-if="mounted"
    class="portal"
    :class="{ 'is-opening': opening }"
    role="presentation"
    aria-hidden="true"
  >
    <!-- 왼쪽 문 : 스타트업 -->
    <div class="door door-left">
      <div class="door-face face-startup">
        <span class="wordmark">PoCket</span>
        <div class="panel-copy">
          <p class="eyebrow">FOR STARTUPS</p>
          <h2 class="headline">검증할 현장을<br />찾고 있나요?</h2>
          <p class="desc">AI가 조건에 맞는 테스트베드를 추천해드려요.</p>
        </div>
      </div>
    </div>

    <!-- 오른쪽 문 : 호스트 -->
    <div class="door door-right">
      <div class="door-face face-host">
        <div class="panel-copy">
          <p class="eyebrow">FOR HOSTS</p>
          <h2 class="headline">먼저 써보고<br />싶으신가요?</h2>
          <p class="desc">우리 현장을 실증 슬롯으로 등록해보세요.</p>
        </div>
      </div>
    </div>

    <!-- 이음새 위의 로고 배지 : 문이 갈라지기 직전에 먼저 사라진다 -->
    <div class="seam-badge" :class="{ 'is-gone': badgeGone }">
      <img src="@/assets/images/logo/pocket-symbol-color.svg" alt="" />
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const STORAGE_KEY = 'pocket.portal.seen'

// 타이밍 (ms)
const HOLD = 1500      // 읽을 시간
const BADGE_OUT = 320  // 배지가 먼저 사라지는 시간
const DOOR_OPEN = 1100 // 문이 열리는 시간 — CSS transition 과 맞춰야 함

const mounted = ref(false)
const opening = ref(false)
const badgeGone = ref(false)

let timers = []
const later = (fn, ms) => timers.push(setTimeout(fn, ms))

// 사파리 프라이빗 모드 등에서는 sessionStorage 접근 자체가 throw 한다
function alreadySeen() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1')
  } catch {
    /* 저장 못 해도 이번 진입은 정상 동작한다 */
  }
}

function unlockScroll() {
  document.body.style.overflow = ''
}

onMounted(() => {
  if (alreadySeen()) return

  markSeen()
  mounted.value = true
  document.body.style.overflow = 'hidden'

  // 모션을 줄이도록 설정한 사용자에게는 문을 흔들지 않고 바로 걷는다
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    later(() => {
      mounted.value = false
      unlockScroll()
    }, 900)
    return
  }

  later(() => { badgeGone.value = true }, HOLD)
  later(() => { opening.value = true }, HOLD + BADGE_OUT)
  later(() => {
    mounted.value = false
    unlockScroll()
  }, HOLD + BADGE_OUT + DOOR_OPEN)
})

onBeforeUnmount(() => {
  timers.forEach(clearTimeout)
  timers = []
  unlockScroll()
})
</script>

<style scoped>
.portal {
  position: fixed;
  inset: 0;
  z-index: 9999;
  overflow: hidden;
  /* 문이 앞으로 열려 보이도록 시점을 화면 앞쪽에 둔다 */
  perspective: 1600px;
  perspective-origin: 50% 45%;
}

/* ---------- 문짝 ---------- */
.door {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 50%;
  transform-style: preserve-3d;
  transition:
    transform 1.1s cubic-bezier(0.66, 0, 0.2, 1),
    opacity 1.1s ease-in;
}
.door-left {
  left: 0;
  transform-origin: left center;
}
.door-right {
  right: 0;
  transform-origin: right center;
}

/* 열림 : 자유단(가운데 쪽 모서리)이 보는 사람 쪽으로 젖혀진다 */
.portal.is-opening .door-left {
  transform: rotateY(-102deg);
  opacity: 0;
}
.portal.is-opening .door-right {
  transform: rotateY(102deg);
  opacity: 0;
}

.door-face {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  backface-visibility: hidden;
}

.face-startup {
  background: linear-gradient(160deg, #4f5ce5 0%, #3730a3 100%);
  align-items: flex-end;
  text-align: right;
  padding: 40px 56px 40px 40px;
  /* 가운데 이음새 */
  box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.35);
}
.face-host {
  background: linear-gradient(200deg, #8b5cf6 0%, #6d28d9 100%);
  align-items: flex-start;
  text-align: left;
  padding: 40px 40px 40px 56px;
}

/* ---------- 내용 ---------- */
/* 워드마크는 흐름에서 빼낸다.
   플로우 안에 두면 왼쪽 문에서만 세로 공간을 먹어 양쪽 헤드라인이 어긋난다. */
.wordmark {
  position: absolute;
  top: 40px;
  left: 40px;
  font-family: 'Space Grotesk', 'Plus Jakarta Sans', sans-serif;
  font-weight: 700;
  font-size: 20px;
  letter-spacing: -0.4px;
  color: #fff;
}

.panel-copy {
  margin: auto 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 320px;
}

.eyebrow {
  font-family: 'Space Grotesk', 'Plus Jakarta Sans', sans-serif;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1.6px;
  color: rgba(255, 255, 255, 0.75);
}

.headline {
  font-family: 'Space Grotesk', 'Plus Jakarta Sans', 'Noto Sans KR', sans-serif;
  font-size: 34px;
  font-weight: 700;
  line-height: 1.28;
  letter-spacing: -0.8px;
  color: #fff;
}

.desc {
  font-size: 14px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.75);
}

/* ---------- 이음새 위 로고 배지 ---------- */
.seam-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 84px;
  height: 84px;
  margin: -42px 0 0 -42px;
  border-radius: 22px;
  background: #fff;
  border: 1px solid #e4e3f5;
  box-shadow: 0 18px 40px rgba(30, 27, 75, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.32s ease, transform 0.32s ease;
}
.seam-badge img {
  width: 42px;
  height: 42px;
}
.seam-badge.is-gone {
  opacity: 0;
  transform: scale(0.86);
}

/* ---------- 좁은 화면 : 위아래로 나뉜다 ---------- */
@media (max-width: 720px) {
  .door {
    width: 100%;
    height: 50%;
    top: auto;
    bottom: auto;
  }
  .door-left {
    top: 0;
    transform-origin: center top;
  }
  .door-right {
    bottom: 0;
    transform-origin: center bottom;
  }
  .portal.is-opening .door-left {
    transform: rotateX(102deg);
  }
  .portal.is-opening .door-right {
    transform: rotateX(-102deg);
  }
  .face-startup,
  .face-host {
    align-items: center;
    text-align: center;
    padding: 32px 24px;
    box-shadow: none;
  }
  .face-startup {
    box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.35);
  }
  .wordmark {
    left: 50%;
    transform: translateX(-50%);
    top: 28px;
  }
  .headline {
    font-size: 26px;
  }
}
</style>
