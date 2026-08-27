<template>
  <router-link :to="`/testbeds/${slot.id}`" class="course-card">
    <!-- 산업군 타일 -->
    <SlotThumb class="card-thumb" :course="slot" :icon-size="42" />

    <!-- 내용 -->
    <div class="card-body">
      <span class="badge" :style="categoryStyle(slot.category)">{{ cat.label }}</span>
      <h3 class="card-title">{{ slot.title }}</h3>
      <div class="card-meta">
        <span class="host">{{ hostName }}</span>
        <span class="fee">₩{{ formatFee(slot.price) }}</span>
      </div>
      <div class="card-footer">
        <span class="runs">실증 진행 {{ runCount }}건</span>
      </div>
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue'
import SlotThumb from '@/components/SlotThumb.vue'
import { category, categoryStyle, formatFee } from '@/domain/pocket.js'
import { hostName as resolveHost } from '@/domain/hosts.js'

// prop 이름은 백엔드 응답 형태(course)를 그대로 받되, 화면에서는 실증 슬롯으로 읽는다.
const props = defineProps({
  course: { type: Object, required: true }
})

const slot = computed(() => props.course)
const cat = computed(() => category(props.course?.category))

const hostName = computed(() => resolveHost(props.course))

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
.thumb-icon {
  opacity: 0.72;
  transition: var(--transition);
}
.course-card:hover .thumb-icon { transform: scale(1.06); }
.card-body {
  padding: 18px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}
.badge { align-self: flex-start; }
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
}
.runs {
  font-size: 12px;
  color: var(--color-text-muted);
}
</style>
