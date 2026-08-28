<template>
  <article class="match-card">
    <div class="mc-head">
      <div class="mc-score" :title="`매칭 스코어 ${pct}%`">
        <svg class="ring" viewBox="0 0 44 44" aria-hidden="true">
          <circle class="ring-bg" cx="22" cy="22" r="19" />
          <circle
            class="ring-fg"
            cx="22" cy="22" r="19"
            :stroke-dasharray="CIRC"
            :stroke-dashoffset="CIRC * (1 - match.score)"
          />
        </svg>
        <span class="mc-pct">{{ pct }}</span>
        <span class="sr-only">매칭 스코어 100점 만점에 {{ pct }}점</span>
      </div>

      <div class="mc-title-wrap">
        <span class="badge" :style="categoryStyle(slot?.category)">
          {{ categoryLabel(slot?.category) }}
        </span>
        <router-link :to="`/testbeds/${match.courseId}`" class="mc-title">
          {{ slot?.title || `슬롯 #${match.courseId}` }}
        </router-link>
        <div class="mc-meta">
          <span>{{ hostName(slot) }}</span>
          <span class="mc-fee">₩{{ formatFee(slot?.price) }}</span>
        </div>
      </div>
    </div>

    <!-- 맞는 점과 걸리는 점을 나란히 둔다.
         좋은 점만 나열하면 광고로 읽힌다. 안 맞는 점을 같이 말해야 판단이 된다. -->
    <div class="mc-evidence">
      <div v-if="match.matched?.length" class="ev-group ev-ok">
        <h4 class="ev-label">맞는 점</h4>
        <ul>
          <li v-for="(item, i) in match.matched" :key="`m${i}`">
            <Icon name="check" :size="13" class="ev-icon" />
            <span>{{ item }}</span>
          </li>
        </ul>
      </div>

      <div v-if="match.concerns?.length" class="ev-group ev-warn">
        <h4 class="ev-label">걸리는 점</h4>
        <ul>
          <li v-for="(item, i) in match.concerns" :key="`c${i}`">
            <Icon name="alert" :size="13" class="ev-icon" />
            <span>{{ item }}</span>
          </li>
        </ul>
      </div>
    </div>

    <p v-if="match.reason" class="mc-reason">{{ match.reason }}</p>

    <div class="mc-actions">
      <router-link :to="`/testbeds/${match.courseId}`" class="btn btn-primary btn-sm">
        현장 자세히 보기
      </router-link>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import Icon from '@/components/Icon.vue'
import { categoryLabel, categoryStyle, formatFee } from '@/domain/pocket.js'
import { hostName } from '@/domain/hosts.js'

const props = defineProps({
  /** { courseId, score, matched[], concerns[], reason } */
  match: { type: Object, required: true },
  /** 응답은 courseId 만 준다. 제목·금액은 이미 받아 둔 목록에서 붙인다. */
  slot: { type: Object, default: null }
})

const CIRC = 2 * Math.PI * 19
const pct = computed(() => Math.round((props.match?.score ?? 0) * 100))
</script>

<style scoped>
.match-card {
  padding: 20px 22px;
  border-radius: var(--radius-xl);
  background: var(--glass-bg);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-edge);
  box-shadow: var(--shadow-glass);
  transition: var(--transition);
}
.match-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-glass), 0 22px 52px rgba(36, 34, 73, 0.12);
}

.mc-head {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

/* 매칭 스코어 — 덱이 약속한 '매칭 스코어 기반' 을 눈에 보이게 한다 */
.mc-score {
  position: relative;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
}
.ring { width: 44px; height: 44px; transform: rotate(-90deg); }
.ring-bg,
.ring-fg {
  fill: none;
  stroke-width: 4;
  stroke-linecap: round;
}
.ring-bg { stroke: var(--color-bg-tertiary); }
.ring-fg {
  stroke: var(--color-primary);
  transition: stroke-dashoffset 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}
.mc-pct {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -0.04em;
  color: var(--color-text-primary);
}

.mc-title-wrap { min-width: 0; flex: 1; }
.mc-title-wrap .badge { margin-bottom: 7px; }

.mc-title {
  display: block;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: -0.035em;
  color: var(--color-text-primary);
  text-decoration: none;
}
.mc-title:hover { color: var(--color-link); text-decoration: underline; }

.mc-meta {
  margin-top: 6px;
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: 13px;
  color: var(--color-text-secondary);
}
.mc-fee {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--color-text-primary);
}

.mc-evidence {
  margin-top: 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.ev-group {
  padding: 12px 14px;
  border-radius: var(--radius-md);
}
.ev-ok { background: var(--color-primary-light); }
.ev-warn { background: #FDF3EC; }

.ev-label {
  margin-bottom: 7px;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--color-text-muted);
}
.ev-group ul { list-style: none; display: flex; flex-direction: column; gap: 6px; }
.ev-group li {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--color-text-secondary);
}
.ev-icon { margin-top: 2px; flex-shrink: 0; }
.ev-ok .ev-icon { color: var(--color-primary); }
.ev-warn .ev-icon { color: #B4560F; }

.mc-reason {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--glass-edge);
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--color-text-secondary);
}

.mc-actions {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
}
.btn-sm {
  padding: 9px 18px;
  font-size: 13.5px;
  border-radius: var(--radius-pill);
  text-decoration: none;
}

@media (max-width: 720px) {
  .mc-evidence { grid-template-columns: 1fr; }
}

@media (prefers-reduced-transparency: reduce) {
  .match-card {
    background: var(--color-bg-primary);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    border-color: var(--color-border);
  }
}
</style>
