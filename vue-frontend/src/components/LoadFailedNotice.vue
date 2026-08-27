<template>
  <div class="failed">
    <Icon name="target" :size="34" :stroke-width="1.4" class="failed-icon" />
    <p class="failed-title">{{ title }}</p>
    <p class="failed-desc">{{ message }}</p>
    <button v-if="retryable" type="button" class="btn btn-primary" @click="$emit('retry')">
      다시 시도
    </button>
  </div>
</template>

<script setup>
/**
 * 요청 실패 안내
 *
 * "데이터가 없다" 와 "받아오지 못했다" 는 전혀 다른 말이다.
 * catch 에서 목록을 빈 배열로 두고 빈 상태를 그리면, 방금 결제한 사용자가
 * "아직 신청한 실증 슬롯이 없습니다" 를 보고 결제가 사라졌다고 이해한다.
 *
 * 인증 만료는 SessionExpiredNotice 가 따로 맡는다. 여기는 그 외의 실패다.
 */
import Icon from '@/components/Icon.vue'

defineProps({
  title: { type: String, default: '불러오지 못했습니다' },
  message: { type: String, default: '잠시 후 다시 시도해 주세요.' },
  retryable: { type: Boolean, default: true }
})

defineEmits(['retry'])
</script>

<style scoped>
.failed {
  padding: 64px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
}
.failed-icon {
  color: var(--color-text-muted);
  margin-bottom: 6px;
}
.failed-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}
.failed-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  max-width: 380px;
  line-height: 1.6;
  margin-bottom: 8px;
}
</style>
