<template>
  <router-link :to="`/testbeds/${slot.id}`" class="course-card" :class="{ closed, mine }">
    <!-- 산업군 타일 -->
    <SlotThumb class="card-thumb" :course="slot" :icon-size="42" />

    <!-- 내용 -->
    <div class="card-body">
      <div class="card-tags">
        <span class="badge" :style="categoryStyle(slot.category)">{{ cat.label }}</span>
        <!-- 목록에서 이미 신청한 건을 구분하지 못하면 상세까지 들어가야 안다 -->
        <span v-if="mine" class="mine-tag">{{ mineLabel }}</span>
      </div>
      <h3 class="card-title">{{ slot.title }}</h3>
      <div class="card-meta">
        <span class="host">{{ hostName }}</span>
        <span class="fee">₩{{ formatFee(slot.price) }}</span>
      </div>
      <div class="card-footer">
        <span class="runs">실증 진행 {{ runCount }}건</span>
        <!-- 마감을 목록에서 알 수 없으면 상세까지 들어가서야 헛걸음을 안다 -->
        <span v-if="closed" class="closed-tag">마감</span>
      </div>
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue'
import SlotThumb from '@/components/SlotThumb.vue'
import { category, categoryStyle, courseStatus, enrollmentStatus, formatFee } from '@/domain/pocket.js'
import { isMine, myStatusOf } from '@/domain/myEnrollments.js'
import { hostName as resolveHost } from '@/domain/hosts.js'

// prop 이름은 백엔드 응답 형태(course)를 그대로 받되, 화면에서는 실증 슬롯으로 읽는다.
const props = defineProps({
  course: { type: Object, required: true }
})

const slot = computed(() => props.course)
const cat = computed(() => category(props.course?.category))

const hostName = computed(() => resolveHost(props.course))

/** 모집 마감 여부. COURSE_STATUS 의 tone 이 단일 출처다. */
const closed = computed(() => courseStatus(props.course?.status).tone === 'off')

/** 내가 이미 신청한 슬롯인가 */
const mine = computed(() => isMine(props.course))
const mineLabel = computed(() => enrollmentStatus(myStatusOf(props.course)).label)

const runCount = computed(() =>
  Number(props.course?.enrollmentCount ?? props.course?.enrollment_count ?? 0).toLocaleString()
)
</script>

<style scoped>
.course-card {
  display: flex;
  flex-direction: column;
  background: var(--glass-bg);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-edge);
  box-shadow: var(--shadow-glass);
  border-radius: var(--radius-xl);
  overflow: hidden;
  transition: var(--transition);
  cursor: pointer;
}
/* 들어올릴 때만 유리 그림자로 바뀌며 떠오른다 */
.course-card:hover {
  transform: translateY(-6px);
  background: var(--glass-bg-strong);
  box-shadow: var(--shadow-glass), 0 28px 64px rgba(36,34,73,0.14);
}
.course-card:active { transform: translateY(-1px) scale(0.995); }
.card-thumb {
  position: relative;
  height: 136px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
/* 유리 위로 떨어지는 빛 — 단색 타일을 입체로 만든다 */
.card-thumb::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 55%);
  pointer-events: none;
}
/* 썸네일은 SlotThumb(자식 컴포넌트) 안에 있다.
   scoped 스타일은 자식 내부에 닿지 않으므로 :deep() 이 필요하고,
   클래스명도 .thumb-icon 이 아니라 SlotThumb 이 실제로 붙이는 .thumb-symbol 이다.
   둘 다 어긋나 있어서 카드 hover 확대가 그동안 동작하지 않았다. */
.card-thumb :deep(.thumb-symbol),
.card-thumb :deep(.thumb-photo) { transition: var(--transition); }
.course-card:hover :deep(.thumb-symbol),
.course-card:hover :deep(.thumb-photo) { transform: scale(1.06); }
.card-body {
  padding: 18px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}
.card-tags { align-self: flex-start; }
.card-title {
  font-size: 15.5px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--color-text-primary);
  line-height: 1.45;
}
.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.host {
  font-size: 13px;
  color: var(--color-text-secondary);
}
/* 금액은 이 카드에서 가장 강한 정보 — 크기와 자간으로 못박는다 */
.fee {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.035em;
  color: var(--color-text-primary);
}
.card-footer {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--glass-edge);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.runs {
  font-size: 12px;
  color: var(--color-text-muted);
}

/* 마감된 슬롯은 목록에서 한눈에 걸러져야 한다 */
/* 이미 신청한 슬롯 — 목록에서 바로 구분된다 */
.card-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.mine-tag {
  padding: 3px 9px;
  border-radius: var(--radius-pill);
  background: var(--color-primary-light);
  color: var(--color-link);
  font-size: 11.5px;
  font-weight: 700;
}
.course-card.mine {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-glass), inset 0 0 0 1px var(--color-primary);
}

.closed-tag {
  flex-shrink: 0;
  padding: 3px 9px;
  border-radius: var(--radius-pill);
  background: var(--color-bg-tertiary);
  color: var(--color-text-muted);
  font-size: 11.5px;
  font-weight: 600;
}
/* 글자에 opacity 를 걸면 제목 3.52:1 로 AA 가 깨진다.
   마감은 .closed-tag 가 이미 명시하므로 흐림은 썸네일에만 둔다. */
.course-card.closed .card-thumb { opacity: 0.55; }
.course-card.closed .card-title,
.course-card.closed .fee { color: var(--color-text-secondary); }

/* 투명도를 줄이도록 설정한 사용자에게는 유리를 불투명하게 —
   가드가 없으면 설정을 켜도 blur 와 반투명이 그대로 남는다. */
@media (prefers-reduced-transparency: reduce) {
  .course-card {
    background: var(--color-bg-primary);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    border-color: var(--color-border);
  }
}
</style>
