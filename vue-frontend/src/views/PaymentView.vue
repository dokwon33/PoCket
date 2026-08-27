<template>
  <div class="page-wrapper">
    <AppHeader />
    <div class="page-layout">
      <AppSidebar />

      <main class="main-content">
        <h1 class="page-title">결제 내역</h1>
        <p class="page-subtitle">실증 신청 시 처리된 실증비 내역입니다.</p>

        <div v-if="loading" class="loading-center">
          <div class="spinner"></div>
        </div>

        <SessionExpiredNotice v-else-if="authExpired" />

        <LoadFailedNotice
          v-else-if="loadError"
          title="결제 내역을 불러오지 못했습니다"
          :message="loadError"
          @retry="load()"
        />

        <ul v-else-if="payments.length" class="payment-list fade-in">
          <li v-for="p in payments" :key="p.paymentId" class="payment-card">
            <div class="pay-main">
              <span class="badge" :style="categoryStyle(slotOf(p).category)">
                {{ categoryLabel(slotOf(p).category) }}
              </span>
              <h3 class="pay-title">
                <router-link :to="`/testbeds/${p.courseId}`">
                  {{ slotOf(p).title || `실증 슬롯 #${p.courseId}` }}
                </router-link>
              </h3>
              <p class="pay-meta">
                <span>{{ formatDate(p.createdAt) }}</span>
                <span class="tx" :title="p.transactionId">거래번호 {{ shortTx(p.transactionId) }}</span>
              </p>
            </div>

            <div class="pay-side">
              <span :class="['status-badge', `status-${paymentStatus(p.status).tone}`]">
                {{ paymentStatus(p.status).label }}
              </span>
              <span class="pay-amount">₩{{ formatFee(p.amount) }}</span>
            </div>
          </li>
        </ul>

        <div v-else class="empty-state">
          <Icon name="inbox" :size="40" :stroke-width="1.4" class="empty-icon" />
          <p>아직 결제 내역이 없습니다.</p>
          <router-link to="/testbeds" class="btn btn-primary" style="margin-top:16px;">
            테스트베드 둘러보기
          </router-link>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import Icon from '@/components/Icon.vue'
import SessionExpiredNotice from '@/components/SessionExpiredNotice.vue'
import LoadFailedNotice from '@/components/LoadFailedNotice.vue'
import { authExpired } from '@/domain/session.js'
import { paymentApi } from '@/api/payment.js'
import { courseApi } from '@/api/course.js'
import { useAuthStore } from '@/store/auth.js'
import { apiErrorMessage, categoryLabel, categoryStyle, formatFee, paymentStatus } from '@/domain/pocket.js'

const auth = useAuthStore()

const payments = ref([])
const slots = ref({})
const loading = ref(true)
const loadError = ref('')

const slotOf = (p) => slots.value[p?.courseId] || {}

/** 결제 응답에는 courseId 만 있다. 어느 슬롯인지 보여주려면 제목을 따로 받아야 한다. */
async function fillSlots(list) {
  const ids = [...new Set(list.map((p) => p?.courseId).filter((v) => v != null))]
  const fetched = await Promise.all(
    ids.map((id) =>
      courseApi
        .getById(id)
        .then((res) => [id, res.data?.data ?? res.data])
        .catch(() => null)
    )
  )
  slots.value = Object.fromEntries(fetched.filter(Boolean))
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/** UUID 전체는 화면에서 의미가 없다. 앞뒤만 남기고 줄인다 (전체는 title 로 확인) */
function shortTx(tx) {
  const s = String(tx || '')
  return s.length > 13 ? `${s.slice(0, 8)}…${s.slice(-4)}` : s || '-'
}

/** 재시도 버튼이 다시 부를 수 있도록 뽑아 둔다 */
async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const res = await paymentApi.listByUser(auth.user?.id)
    const list = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []
    payments.value = list
    await fillSlots(list)
  } catch (e) {
    console.error('[Payment] 결제 내역 조회 실패:', e)
    payments.value = []
    // 방금 결제한 사용자에게 "결제 내역이 없습니다" 라고 하면 안 된다
    loadError.value = apiErrorMessage(e, '결제 내역을 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.page-wrapper { min-height: 100vh; }

.page-layout {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 28px;
}

.main-content { min-width: 0; }

.page-title {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.04em;
  color: var(--color-text-primary);
}
.page-subtitle {
  margin-top: 8px;
  margin-bottom: 28px;
  font-size: 14.5px;
  color: var(--color-text-secondary);
}

.payment-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.payment-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 20px 24px;
  border-radius: var(--radius-xl);
  background: var(--glass-bg);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-edge);
  box-shadow: var(--shadow-glass);
}

.pay-main {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
}
.pay-title {
  font-size: 15.5px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--color-text-primary);
  line-height: 1.45;
}
.pay-title a:hover { text-decoration: underline; }
.pay-meta {
  display: flex;
  gap: 12px;
  font-size: 12.5px;
  color: var(--color-text-muted);
}
.tx { font-variant-numeric: tabular-nums; }

.pay-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}
.pay-amount {
  font-family: var(--font-display);
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.04em;
  color: var(--color-text-primary);
}

.status-badge {
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  font-size: 12px;
  font-weight: 600;
}
.status-done { background: #E1F5EE; color: #0F6E56; }
.status-wait { background: #FAEEDA; color: #854F0B; }
.status-off  { background: #F1EFE8; color: #5F5E5A; }

.loading-center {
  display: flex;
  justify-content: center;
  padding: 64px 0;
}
.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 72px 24px;
  color: var(--color-text-secondary);
}
.empty-icon {
  color: var(--color-text-muted);
  margin-bottom: 12px;
}

@media (max-width: 992px) {
  .page-layout { grid-template-columns: 1fr; }
  .payment-card { flex-direction: column; align-items: flex-start; }
  .pay-side { align-items: flex-start; }
}

/* 투명도를 줄이도록 설정한 사용자에게는 유리를 불투명하게 —
   가드가 없으면 설정을 켜도 blur 와 반투명이 그대로 남는다. */
@media (prefers-reduced-transparency: reduce) {
  .payment-card {
    background: var(--color-bg-primary);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    border-color: var(--color-border);
  }
}
</style>
