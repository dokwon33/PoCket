<template>
  <ModalSheet labelledby="compare-title" @close="emit('close')">
    <div class="compare">
      <div class="compare-head">
        <div>
          <h2 id="compare-title" class="compare-title">담아 둔 실증 슬롯 비교</h2>
          <p class="compare-sub">{{ slots.length }}개를 나란히 놓고 봅니다.</p>
        </div>
        <button type="button" class="close-btn" aria-label="닫기" @click="emit('close')">
          <Icon name="x" :size="16" />
        </button>
      </div>

      <!-- 좁은 화면에서 표가 잘리지 않도록 가로로만 스크롤한다 -->
      <div class="table-scroll">
        <table class="compare-table">
          <caption class="sr-only">담아 둔 실증 슬롯의 항목별 비교</caption>
          <thead>
            <tr>
              <th scope="col" class="row-label"><span class="sr-only">비교 항목</span></th>
              <th v-for="slot in slots" :key="slot.id" scope="col" class="slot-head">
                <span class="badge" :style="categoryStyle(slot.category)">
                  {{ categoryLabel(slot.category) }}
                </span>
                <router-link :to="`/testbeds/${slot.id}`" class="slot-title" @click="emit('close')">
                  {{ slot.title }}
                </router-link>
                <button type="button" class="drop-btn" @click="removeCompare(slot.id)">비교에서 빼기</button>
              </th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <th scope="row" class="row-label">실증비</th>
              <td v-for="slot in slots" :key="slot.id" :class="{ best: isBest('price', slot) }">
                <span class="value">₩{{ formatFee(slot.price) }}</span>
                <span v-if="isBest('price', slot)" class="best-tag">최저</span>
              </td>
            </tr>

            <tr>
              <th scope="row" class="row-label">같은 산업군 안에서</th>
              <td v-for="slot in slots" :key="slot.id" class="muted">
                {{ priceStanding(slot) }}
              </td>
            </tr>

            <tr>
              <th scope="row" class="row-label">실증 진행</th>
              <td v-for="slot in slots" :key="slot.id" :class="{ best: isBest('runs', slot) }">
                <span class="value">{{ runsOf(slot).toLocaleString() }}건</span>
                <span v-if="isBest('runs', slot)" class="best-tag">최다</span>
              </td>
            </tr>

            <tr>
              <th scope="row" class="row-label">호스트</th>
              <td v-for="slot in slots" :key="slot.id">
                <span class="value-sm">{{ hostName(slot) }}</span>
              </td>
            </tr>

            <tr>
              <th scope="row" class="row-label">호스트 평판</th>
              <td v-for="slot in slots" :key="slot.id" :class="{ best: isBest('rating', slot) }">
                <template v-if="loadingReputation">
                  <span class="muted">확인 중…</span>
                </template>
                <template v-else-if="ratingOf(slot) != null">
                  <span class="value">{{ ratingOf(slot).toFixed(1) }}</span>
                  <span class="muted"> ({{ reviewCountOf(slot) }}건)</span>
                  <span v-if="isBest('rating', slot)" class="best-tag">최고</span>
                </template>
                <template v-else>
                  <!-- 0.0 으로 적으면 '평가가 나쁘다' 로 읽힌다. 없는 것은 없다고 쓴다. -->
                  <span class="muted">받은 평가 없음</span>
                </template>
              </td>
            </tr>

            <tr>
              <th scope="row" class="row-label">신청 상태</th>
              <td v-for="slot in slots" :key="slot.id">
                <span v-if="isMine(slot)" class="mine-tag">{{ mineLabel(slot) }}</span>
                <span v-else class="muted">미신청</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="compare-foot">
        <button type="button" class="btn btn-outline" @click="clearAll">전부 비우기</button>
        <button type="button" class="btn btn-primary" @click="emit('close')">닫기</button>
      </div>
    </div>
  </ModalSheet>
</template>

<script setup>
/**
 * 슬롯 비교
 *
 * 값은 전부 이미 받아온 목록과 공개 평판 API 로 만든다.
 * 백엔드에 비교용 엔드포인트를 새로 만들지 않았다.
 */
import { computed, onMounted, ref } from 'vue'
import ModalSheet from '@/components/ModalSheet.vue'
import Icon from '@/components/Icon.vue'
import { reviewApi } from '@/api/review.js'
import { hostName } from '@/domain/hosts.js'
import { isMine, myStatusOf } from '@/domain/myEnrollments.js'
import { compareList, clearCompare, removeCompare } from '@/domain/compare.js'
import {
  categoryLabel,
  categoryStyle,
  courseStatus,
  enrollmentStatus,
  formatFee
} from '@/domain/pocket.js'

const props = defineProps({
  /** 백분위를 재려면 비교 대상뿐 아니라 전체 슬롯이 필요하다 */
  peers: { type: Array, default: () => [] }
})
const emit = defineEmits(['close'])

const slots = compareList

const runsOf = (slot) => Number(slot?.enrollmentCount ?? slot?.enrollment_count ?? 0)
const mineLabel = (slot) => enrollmentStatus(myStatusOf(slot)).label

/* ── 호스트 평판 ── */
const reputations = ref({})
const loadingReputation = ref(true)

const hostIdOf = (slot) => slot?.instructorId ?? slot?.instructor_id ?? null

function ratingOf(slot) {
  const rep = reputations.value[hostIdOf(slot)]
  // 평가가 0건이면 averageRating 이 null 로 온다 — 0 으로 바꾸지 않는다
  return rep?.reviewCount ? rep.averageRating ?? null : null
}
function reviewCountOf(slot) {
  return reputations.value[hostIdOf(slot)]?.reviewCount ?? 0
}

onMounted(async () => {
  const ids = [...new Set(slots.value.map(hostIdOf).filter((v) => v != null))]
  const results = await Promise.all(
    ids.map((id) =>
      reviewApi
        .reputation(id)
        .then((res) => [id, res.data])
        .catch(() => [id, null])
    )
  )
  reputations.value = Object.fromEntries(results.filter(([, v]) => v))
  loadingReputation.value = false
})

/* ── 항목별 최선 ── */

/**
 * 값이 모두 같으면 아무 데도 표시하지 않는다.
 * 셋 다 같은데 하나만 '최저' 가 붙으면 없는 차이를 만들어 낸다.
 */
function bestValue(metric) {
  const values = slots.value
    .map((s) => (metric === 'price' ? Number(s.price ?? 0) : metric === 'runs' ? runsOf(s) : ratingOf(s)))
    .filter((v) => v != null && !Number.isNaN(v))

  if (values.length < 2) return null
  const best = metric === 'price' ? Math.min(...values) : Math.max(...values)
  return values.every((v) => v === best) ? null : best
}

const bests = computed(() => ({
  price: bestValue('price'),
  runs: bestValue('runs'),
  rating: bestValue('rating')
}))

function isBest(metric, slot) {
  const target = bests.value[metric]
  if (target == null) return false
  const value = metric === 'price' ? Number(slot.price ?? 0) : metric === 'runs' ? runsOf(slot) : ratingOf(slot)
  return value === target
}

/**
 * 같은 산업군 안에서의 가격 위치.
 * 상세 화면과 같은 방식(백분위)을 쓴다 — 이상값이 있어도 0~100 을 벗어나지 않는다.
 */
function priceStanding(slot) {
  const price = Number(slot?.price ?? 0)
  const cat = slot?.category
  if (!price || !cat) return '-'

  const sameCategory = props.peers.filter(
    (c) => c.category === cat && courseStatus(c.status).tone !== 'off'
  )
  if (sameCategory.length < 3) return '표본 부족'

  const cheaper = sameCategory.filter((c) => Number(c.price ?? 0) < price).length
  const pct = Math.round(((sameCategory.length - cheaper) / sameCategory.length) * 100)

  if (pct <= 25) return `상위 ${pct}% · 비싼 편`
  if (pct >= 75) return `하위 ${100 - pct}% · 저렴한 편`
  return '중간 수준'
}

function clearAll() {
  clearCompare()
  emit('close')
}
</script>

<style scoped>
.compare {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-height: min(78vh, 720px);
}

.compare-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.compare-title {
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.035em;
  color: var(--color-text-primary);
}

.compare-sub {
  margin-top: 5px;
  font-size: 13.5px;
  color: var(--color-text-secondary);
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  transition: var(--transition);
}
.close-btn:hover { background: var(--color-border); color: var(--color-text-primary); }

.table-scroll {
  overflow: auto;
  margin: 0 -4px;
  padding: 0 4px;
}

.compare-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
}

.compare-table th,
.compare-table td {
  padding: 12px 14px;
  text-align: left;
  vertical-align: top;
  border-bottom: 1px solid var(--color-border);
}

.row-label {
  width: 132px;
  min-width: 132px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.slot-head {
  min-width: 190px;
  display: table-cell;
}

.slot-head .badge { margin-bottom: 8px; }

.slot-title {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.45;
  letter-spacing: -0.03em;
  color: var(--color-text-primary);
  text-decoration: none;
}
.slot-title:hover { color: var(--color-link); text-decoration: underline; }

.drop-btn {
  padding: 0;
  background: none;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.drop-btn:hover { color: var(--color-danger); }

.value {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--color-text-primary);
}
.value-sm {
  font-size: 13.5px;
  color: var(--color-text-primary);
}
.muted {
  font-size: 12.5px;
  color: var(--color-text-muted);
}

/* 가장 나은 값 — 색만으로 알리지 않는다. 글자 배지를 같이 붙인다. */
.best { background: var(--color-primary-light); }
.best-tag {
  margin-left: 6px;
  padding: 2px 7px;
  border-radius: var(--radius-pill);
  background: var(--color-primary);
  color: #fff;
  font-size: 10.5px;
  font-weight: 700;
  vertical-align: middle;
}

.mine-tag {
  padding: 3px 9px;
  border-radius: var(--radius-pill);
  background: var(--color-primary-light);
  color: var(--color-link);
  font-size: 11.5px;
  font-weight: 700;
}

.compare-foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 640px) {
  .row-label { width: 104px; min-width: 104px; }
  .slot-head { min-width: 160px; }
}
</style>
