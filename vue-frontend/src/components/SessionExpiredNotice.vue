<template>
  <div class="expired">
    <Icon name="lock" :size="34" :stroke-width="1.4" class="expired-icon" />
    <p class="expired-title">세션이 만료되었습니다</p>
    <p class="expired-desc">
      로그인 후 시간이 지나 인증이 풀렸습니다. 다시 로그인하면 이어서 보실 수 있습니다.
    </p>
    <router-link to="/login" class="btn btn-primary">다시 로그인</router-link>
  </div>
</template>

<script setup>
import Icon from '@/components/Icon.vue'
</script>

<style scoped>
.expired {
  padding: 64px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
}
.expired-icon {
  color: var(--color-text-muted);
  margin-bottom: 6px;
}
.expired-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}
.expired-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  max-width: 380px;
  line-height: 1.6;
  margin-bottom: 8px;
}
</style>
