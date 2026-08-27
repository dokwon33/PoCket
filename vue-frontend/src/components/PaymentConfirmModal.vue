<template>
  <ModalSheet labelledby="payment-title" :locked="processing" @close="close">
    <h3 id="payment-title" class="sheet-title">실증비 결제</h3>
    <p class="sheet-desc">아래 내용으로 실증을 신청합니다.</p>

    <dl class="summary">
      <div class="row">
        <dt>실증 슬롯</dt>
        <dd class="row-strong">{{ slot.title }}</dd>
      </div>
      <div class="row">
        <dt>산업군</dt>
        <dd>
          <span class="badge" :style="categoryStyle(slot.category)">{{ categoryLabel(slot.category) }}</span>
        </dd>
      </div>
      <div class="row">
        <dt>호스트</dt>
        <dd>{{ hostName }}</dd>
      </div>
      <div class="row total">
        <dt>결제 금액</dt>
        <dd class="amount">₩{{ formatFee(slot.price) }}</dd>
      </div>
    </dl>

    <!-- 실습 환경임을 숨기지 않는다. 실제로 카드가 청구되지 않는다. -->
    <p class="notice">
      실습 환경이라 실제 결제는 일어나지 않습니다. 결제 요청은 모의로 처리되며
      거래번호만 발급됩니다.
    </p>

    <div v-show="error" class="error-msg" role="alert">{{ error }}</div>

    <div class="actions">
      <button type="button" class="btn btn-ghost" @click="close" :disabled="processing">취소</button>
      <button type="button" class="btn btn-primary" @click="$emit('confirm')" :disabled="processing">
        <span v-if="processing">처리 중...</span>
        <span v-else>결제하고 신청하기</span>
      </button>
    </div>
  </ModalSheet>
</template>

<script setup>
import ModalSheet from '@/components/ModalSheet.vue'
import { categoryLabel, categoryStyle, formatFee } from '@/domain/pocket.js'

const props = defineProps({
  slot: { type: Object, required: true }, // { title, category, price }
  hostName: { type: String, default: '호스트 미상' },
  processing: { type: Boolean, default: false },
  error: { type: String, default: '' }
})
const emit = defineEmits(['close', 'confirm'])

function close() {
  if (!props.processing) emit('close')
}
</script>

<style scoped>
.sheet-title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.035em;
  color: var(--color-text-primary);
}
.sheet-desc {
  margin-top: 6px;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.summary {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
}
.row + .row {
  border-top: 1px solid var(--glass-edge);
}
.row dt {
  font-size: 13.5px;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}
.row dd {
  font-size: 14.5px;
  color: var(--color-text-primary);
  text-align: right;
}
.row-strong {
  font-weight: 600;
  line-height: 1.5;
}
.total {
  margin-top: 4px;
  padding-top: 16px;
}
.amount {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.04em;
  color: var(--color-text-primary);
}

.notice {
  margin-top: 18px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  background: var(--color-warning-light);
  color: var(--color-warning);
  font-size: 13px;
  line-height: 1.6;
}

.error-msg {
  margin-top: 16px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  background: #FDECEC;
  color: #B02525;
  font-size: 13.5px;
}

.actions {
  margin-top: 26px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
