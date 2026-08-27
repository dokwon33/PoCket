<template>
  <!-- 읽기 전용: 단순 표시 -->
  <div v-if="readonly" class="stars" :aria-label="`5점 만점에 ${modelValue}점`">
    <span
      v-for="n in 5"
      :key="n"
      class="star"
      :class="{ filled: n <= Math.round(modelValue) }"
      :style="{ fontSize: `${size}px` }"
      aria-hidden="true"
      >★</span
    >
  </div>

  <!-- 입력: 각 별이 라디오처럼 동작한다 -->
  <div v-else class="stars" role="radiogroup" aria-label="평점">
    <button
      v-for="n in 5"
      :key="n"
      type="button"
      class="star star-btn"
      :class="{ filled: n <= (hover || modelValue) }"
      :style="{ fontSize: `${size}px` }"
      role="radio"
      :aria-checked="n === modelValue"
      :aria-label="`${n}점`"
      @click="$emit('update:modelValue', n)"
      @mouseenter="hover = n"
      @mouseleave="hover = 0"
      @focus="hover = n"
      @blur="hover = 0"
    >
      ★
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  modelValue: { type: Number, default: 0 },
  readonly: { type: Boolean, default: false },
  size: { type: Number, default: 24 }
})
defineEmits(['update:modelValue'])

const hover = ref(0)
</script>

<style scoped>
.stars {
  display: inline-flex;
  gap: 2px;
  line-height: 1;
}
.star {
  color: var(--color-border-hover);
  transition: color 0.15s ease, transform 0.15s var(--ease-out);
}
.star.filled {
  color: #F2A93B;
}
.star-btn {
  background: none;
  border: none;
  padding: 0 2px;
  cursor: pointer;
}
.star-btn:hover {
  transform: scale(1.12);
}
.star-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 4px;
}
</style>
