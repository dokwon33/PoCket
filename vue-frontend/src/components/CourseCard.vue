<template>
  <router-link :to="`/testbeds/${slot.id}`" class="course-card">
    <!-- 산업군 타일 -->
    <div class="card-thumb" :style="{ background: cat.tint }">
      <span class="thumb-icon" aria-hidden="true">{{ cat.icon }}</span>
    </div>

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
import { category, categoryStyle, formatFee } from '@/domain/pocket.js'

// prop 이름은 백엔드 응답 형태(course)를 그대로 받되, 화면에서는 실증 슬롯으로 읽는다.
const props = defineProps({
  course: { type: Object, required: true }
})

const slot = computed(() => props.course)
const cat = computed(() => category(props.course?.category))

const hostName = computed(() =>
  props.course?.instructorName ||
  props.course?.instructor?.name ||
  '호스트 미상'
)

const runCount = computed(() =>
  Number(props.course?.enrollmentCount ?? props.course?.enrollment_count ?? 0).toLocaleString()
)
</script>

<style scoped>
.course-card {
  display: flex;
  flex-direction: column;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: var(--transition);
  cursor: pointer;
}
.course-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-border-hover);
}
.card-thumb {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.thumb-icon {
  font-size: 40px;
  line-height: 1;
}
.card-body {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}
.badge { align-self: flex-start; }
.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.4;
}
.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.host {
  font-size: 12px;
  color: var(--color-text-secondary);
}
.fee {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
}
.card-footer {
  margin-top: 2px;
}
.runs {
  font-size: 11px;
  color: var(--color-text-muted);
}
</style>
